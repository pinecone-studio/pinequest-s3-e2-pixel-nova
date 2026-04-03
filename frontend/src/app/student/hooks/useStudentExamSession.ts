import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/api/client";
import { openNotificationsLiveStream } from "@/api/notifications";
import type { User } from "@/lib/examGuard";
import type { Exam, Submission } from "../types";
import { buildAnswerReport } from "./student-exam-helpers";
import {
  EMPTY_VIOLATIONS,
  mapResultToReport,
  mapSessionAnswers,
  mapSessionToExam,
} from "./student-exam-session-helpers";
import { useStudentExamResultState } from "./useStudentExamResultState";
import { useStudentExamWarnings } from "./useStudentExamWarnings";

const ANSWER_SYNC_DEBOUNCE_MS = 1500;
const STUDENT_EXAM_RUNTIME_KEY = "student:exam-runtime";

type UseStudentExamSessionParams = {
  currentUser: User | null;
  roomCodeInput: string;
  sessionId: string | null;
  setJoinError?: (value: string | null) => void;
};

type SessionData = {
  exam: {
    id: string;
    title: string;
    description?: string | null;
    durationMin: number;
    enabledCheatDetections?: string[];
  };
  answers?: {
    questionId: string;
    selectedOptionId?: string | null;
    textAnswer?: string | null;
    answeredAt?: string | null;
  }[];
  questions: {
    id: string;
    type: string;
    questionText: string;
    imageUrl?: string | null;
    points: number;
    options?: { id: string; label: string; text: string }[];
  }[];
};

type SessionResult = {
  answers: {
    questionText: string;
    selectedAnswer: string | null;
    correctAnswer: string | null;
    isCorrect: boolean;
    points: number;
    pointsEarned: number;
  }[];
  score: number;
  totalPoints: number;
};

const parseErrorMessage = (error: unknown, fallback: string) => {
  if (!(error instanceof Error) || !error.message) return fallback;
  try {
    const parsed = JSON.parse(error.message) as { message?: string; error?: string | { code?: string; message?: string } };
    return parsed.message || (typeof parsed.error === "string" ? parsed.error : parsed.error?.message) || fallback;
  } catch {
    return error.message;
  }
};


const getRemainingSeconds = (exam: Exam) => {
  const durationMs = (exam.duration ?? 45) * 60 * 1000;
  const base = exam.finishedAt ?? exam.examStartedAt ?? exam.scheduledAt ?? null;
  if (!base) return (exam.duration ?? 45) * 60;
  const baseTime = new Date(base).getTime();
  if (Number.isNaN(baseTime)) return (exam.duration ?? 45) * 60;
  const endTime = exam.finishedAt ? baseTime : baseTime + durationMs;
  return Math.max(Math.floor((endTime - Date.now()) / 1000), 0);
};

const getErrorCode = (error: unknown) => {
  if (!(error instanceof Error) || !error.message) return null;
  try {
    const parsed = JSON.parse(error.message) as { error?: { code?: string } };
    return parsed.error?.code ?? null;
  } catch {
    return null;
  }
};

const getDraftStorageKey = (currentSessionId: string) =>
  `student-exam-draft:${currentSessionId}`;

const readDraftAnswers = (currentSessionId: string | null) => {
  if (!currentSessionId || typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(getDraftStorageKey(currentSessionId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
};

const writeDraftAnswers = (
  currentSessionId: string | null,
  nextAnswers: Record<string, string>,
) => {
  if (!currentSessionId || typeof window === "undefined") return;
  try {
    if (Object.keys(nextAnswers).length === 0) {
      window.localStorage.removeItem(getDraftStorageKey(currentSessionId));
      return;
    }
    window.localStorage.setItem(
      getDraftStorageKey(currentSessionId),
      JSON.stringify(nextAnswers),
    );
  } catch {
    // Ignore storage quota / private mode errors and keep exam flow working.
  }
};

const clearDraftAnswers = (currentSessionId: string | null) => {
  if (!currentSessionId || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(getDraftStorageKey(currentSessionId));
  } catch {
    // Ignore storage errors.
  }
};

const readStoredRuntimeState = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STUDENT_EXAM_RUNTIME_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as {
      sessionId?: string | null;
      view?: "dashboard" | "exam" | "result";
      activeExam?: Exam | null;
      answers?: Record<string, string>;
      currentQuestionIndex?: number;
      timeLeft?: number;
    };
  } catch {
    return null;
  }
};

const requestDesktopCameraPermission = async () => {
  if (
    typeof window === "undefined" ||
    !window.isSecureContext ||
    !navigator.mediaDevices?.getUserMedia
  ) {
    throw new Error(
      "Ширээний төхөөрөмжөөс камер ашиглахын тулд аюулгүй хөтчийн орчин шаардлагатай.",
    );
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  });

  stream.getTracks().forEach((track) => track.stop());
};

const requestDesktopMicrophonePermission = async () => {
  if (
    typeof window === "undefined" ||
    !window.isSecureContext ||
    !navigator.mediaDevices?.getUserMedia
  ) {
    throw new Error(
      "Ширээний төхөөрөмжөөс микрофоны бичлэг ашиглахын тулд аюулгүй хөтчийн орчин шаардлагатай.",
    );
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });

  stream.getTracks().forEach((track) => track.stop());
};

const reportPermissionIssue = async ({
  eventType,
  message,
  sessionId,
  source,
}: {
  eventType: "camera_blocked" | "microphone_permission_denied";
  message: string;
  sessionId: string;
  source: "browser_camera" | "browser_audio";
}) => {
  await apiRequest("/api/cheat/event", {
    method: "POST",
    body: JSON.stringify({
      sessionId,
      eventType,
      source,
      confidence: 0.99,
      details: {
        message,
      },
    }),
  }).catch(() => null);
};

export const useStudentExamSession = ({
  currentUser,
  roomCodeInput,
  sessionId,
  setJoinError,
}: UseStudentExamSessionParams) => {
  const storedRuntimeState = readStoredRuntimeState();
  const canReuseStoredRuntime =
    storedRuntimeState?.sessionId &&
    sessionId &&
    storedRuntimeState.sessionId === sessionId;
  const [view, setView] = useState<"dashboard" | "exam" | "result">(
    canReuseStoredRuntime ? storedRuntimeState?.view ?? "dashboard" : "dashboard",
  );
  const [activeExam, setActiveExam] = useState<Exam | null>(
    canReuseStoredRuntime ? storedRuntimeState?.activeExam ?? null : null,
  );
  const [startingExam, setStartingExam] = useState(false);
  const [submittingExam, setSubmittingExam] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>(
    canReuseStoredRuntime ? storedRuntimeState?.answers ?? {} : {},
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    canReuseStoredRuntime ? storedRuntimeState?.currentQuestionIndex ?? 0 : 0,
  );
  const [timeLeft, setTimeLeft] = useState<number>(
    canReuseStoredRuntime ? storedRuntimeState?.timeLeft ?? 0 : 0,
  );
  const sidebarTimerRef = useRef<number | null>(null);
  const answerFlushTimerRef = useRef<number | null>(null);
  const pendingAnswersRef = useRef<Record<string, string>>({});
  const disqualificationHandledRef = useRef(false);
  const { violations, setViolations, warning, showWarning, logViolation } =
    useStudentExamWarnings(sessionId, activeExam?.enabledCheatDetections);
  const {
    lastSubmission,
    setLastSubmission,
    resultPending,
    setResultPending,
    resultReleaseAt,
    setResultReleaseAt,
    resultCountdown,
    answerReport,
    setAnswerReport,
  } = useStudentExamResultState(sessionId, activeExam);

  useEffect(() => {
    if (view === "exam") return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => null);
    }
    document.body.style.filter = "none";
  }, [view]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (!sessionId || view === "dashboard" || !activeExam) {
        window.sessionStorage.removeItem(STUDENT_EXAM_RUNTIME_KEY);
        return;
      }

      window.sessionStorage.setItem(
        STUDENT_EXAM_RUNTIME_KEY,
        JSON.stringify({
          sessionId,
          view,
          activeExam,
          answers,
          currentQuestionIndex,
          timeLeft,
        }),
      );
    } catch {
      // ignore persistence failures
    }
  }, [activeExam, answers, currentQuestionIndex, sessionId, timeLeft, view]);

  const clearAnswerFlushTimer = useCallback(() => {
    if (answerFlushTimerRef.current !== null) {
      window.clearTimeout(answerFlushTimerRef.current);
      answerFlushTimerRef.current = null;
    }
  }, []);

  const flushPendingAnswers = useCallback(async () => {
    if (!sessionId) return;
    const pendingEntries = Object.entries(pendingAnswersRef.current);
    if (pendingEntries.length === 0) return;

    clearAnswerFlushTimer();
    const pendingSnapshot = { ...pendingAnswersRef.current };

    try {
      await apiRequest(`/api/sessions/${sessionId}/answer`, {
        method: "POST",
        body: JSON.stringify({
          answers: pendingEntries.map(([questionId, textAnswer]) => ({
            questionId,
            textAnswer,
          })),
        }),
      });

      const remainingPending = { ...pendingAnswersRef.current };
      pendingEntries.forEach(([questionId, textAnswer]) => {
        if (remainingPending[questionId] === textAnswer) {
          delete remainingPending[questionId];
        }
      });
      pendingAnswersRef.current = remainingPending;
    } catch (error) {
      pendingAnswersRef.current = {
        ...pendingSnapshot,
        ...pendingAnswersRef.current,
      };
      throw error;
    }
  }, [clearAnswerFlushTimer, sessionId]);

  const scheduleAnswerFlush = useCallback(() => {
    clearAnswerFlushTimer();
    answerFlushTimerRef.current = window.setTimeout(() => {
      void flushPendingAnswers().catch(() => null);
    }, ANSWER_SYNC_DEBOUNCE_MS);
  }, [clearAnswerFlushTimer, flushPendingAnswers]);

  const startExam = (params?: { sessionId?: string | null; roomCode?: string }) => {
    if (startingExam) return;
    const effectiveSessionId = params?.sessionId ?? sessionId;
    const effectiveRoomCode = params?.roomCode ?? roomCodeInput;
    if (!effectiveSessionId || !currentUser) {
      setJoinError?.("Шалгалт эхлүүлэхэд шаардлагатай мэдээлэл алга байна.");
      return;
    }

    const run = async () => {
      let requiresAudioRecording = false;
      setStartingExam(true);
      try {
        const sessionData = await apiRequest<SessionData>(`/api/sessions/${effectiveSessionId}`);
        const mappedExam: Exam = mapSessionToExam(sessionData, effectiveRoomCode);
        requiresAudioRecording = Boolean(mappedExam.requiresAudioRecording);
        let cameraIssue: string | null = null;
        let microphoneIssue: string | null = null;

        try {
          await requestDesktopCameraPermission();
        } catch (error) {
          cameraIssue = parseErrorMessage(
            error,
            "Камерын зөвшөөрөл олгогдоогүй байна.",
          );
        }

        if (requiresAudioRecording) {
          try {
            await requestDesktopMicrophonePermission();
          } catch (error) {
            microphoneIssue = parseErrorMessage(
              error,
              "Микрофоны зөвшөөрөл олгогдоогүй байна.",
            );
          }
        }
        const restoredServerAnswers = mapSessionAnswers(sessionData);
        const restoredDraftAnswers = readDraftAnswers(effectiveSessionId);
        const restoredAnswers = {
          ...restoredServerAnswers,
          ...restoredDraftAnswers,
        };
        const startData = await apiRequest<{ startedAt?: string; status?: string }>(`/api/sessions/${effectiveSessionId}/start`, {
          method: "POST",
          body: JSON.stringify({
            audioReady:
              requiresAudioRecording && !microphoneIssue ? true : undefined,
          }),
        });
        const nextExam = {
          ...mappedExam,
          status: (startData as { status?: string }).status ?? mappedExam.status,
          examStartedAt: (startData as { startedAt?: string }).startedAt ?? mappedExam.examStartedAt,
        };
        setActiveExam(nextExam);
        setTimeLeft(getRemainingSeconds(nextExam));
        setCurrentQuestionIndex(0);
        setAnswers(restoredAnswers);
        pendingAnswersRef.current = {};
        writeDraftAnswers(effectiveSessionId, restoredAnswers);
        setViolations({ ...EMPTY_VIOLATIONS });
        setJoinError?.(null);
        setView("exam");

        if (cameraIssue) {
          void reportPermissionIssue({
            eventType: "camera_blocked",
            message: cameraIssue,
            sessionId: effectiveSessionId,
            source: "browser_camera",
          });
        }

        if (microphoneIssue) {
          void reportPermissionIssue({
            eventType: "microphone_permission_denied",
            message: microphoneIssue,
            sessionId: effectiveSessionId,
            source: "browser_audio",
          });
        }

        if (cameraIssue || microphoneIssue) {
          const deniedItems = [
            cameraIssue ? "камер" : null,
            microphoneIssue ? "микрофон" : null,
          ].filter(Boolean);
          showWarning(
            `${deniedItems.join(" ба ")} зөвшөөрөгдөөгүй ч шалгалт эхэллээ. Багшид мэдэгдэнэ.`,
          );
        }
      } catch (error) {
        const message = parseErrorMessage(error, "Шалгалт эхлүүлэхэд алдаа гарлаа.");
        setJoinError?.(message);
        showWarning(message);
      } finally {
        setStartingExam(false);
      }
    };

    void run();
  };

  const submitExam = useCallback(async (auto = false, terminated = false, reason?: string) => {
    if (!activeExam || !currentUser || !sessionId || submittingExam) return;
    if (!auto && !window.confirm("Та шалгалтаа илгээхдээ итгэлтэй байна уу?")) return;

    setSubmittingExam(true);
    const report = buildAnswerReport(activeExam, answers);
    const examEndAt = (() => {
      const durationMs = (activeExam.duration ?? 45) * 60 * 1000;
      const base = activeExam.finishedAt ?? activeExam.examStartedAt ?? activeExam.scheduledAt ?? null;
      if (!base) return null;
      const baseTime = new Date(base).getTime();
      if (Number.isNaN(baseTime)) return null;
      return activeExam.finishedAt ? new Date(baseTime).toISOString() : new Date(baseTime + durationMs).toISOString();
    })();
    const pendingSubmission: Submission = {
      id: sessionId,
      examId: activeExam.id,
      studentId: currentUser.id,
      studentName: currentUser.username,
      answers: report.map((item) => ({ questionId: item.question.id, selectedAnswer: item.answer, correct: item.correct })),
      score: 0,
      totalPoints: 0,
      percentage: 0,
      terminated,
      terminationReason: reason,
      violations,
      submittedAt: new Date().toISOString(),
    };

    try {
      await flushPendingAnswers();
      await apiRequest(`/api/sessions/${sessionId}/submit`, { method: "POST" });

      const result = await apiRequest<SessionResult>(`/api/sessions/${sessionId}/result`);
      clearDraftAnswers(sessionId);
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => null);
      }
      document.body.style.filter = "none";
      setLastSubmission({ ...pendingSubmission, score: result.score ?? 0, totalPoints: result.totalPoints ?? 0, percentage: result.score ?? 0 });
      setAnswerReport(mapResultToReport(result));
      setResultPending(false);
      setResultReleaseAt(null);
      setView("result");
      return;
    } catch (error) {
      const errorCode = getErrorCode(error);
      if (errorCode === "RESULTS_PENDING" || errorCode === "NOT_GRADED") {
        clearDraftAnswers(sessionId);
        setResultPending(true);
        setResultReleaseAt(examEndAt ?? activeExam.finishedAt ?? null);
        setAnswerReport([]);
        setLastSubmission(pendingSubmission);
        setView("result");
        return;
      }

      const message = parseErrorMessage(
        error,
        "Шалгалт илгээх үед алдаа гарлаа. Дахин оролдоно уу.",
      );
      showWarning(message);
    } finally {
      setSubmittingExam(false);
    }
  }, [activeExam, answers, currentUser, flushPendingAnswers, sessionId, showWarning, submittingExam, violations, setAnswerReport, setLastSubmission, setResultPending, setResultReleaseAt]);

  const terminateExam = useCallback((reason: string) => {
    showWarning("Шалгалт зогсоолоо.");
    void submitExam(true, true, reason);
  }, [showWarning, submitExam]);

  useEffect(() => {
    disqualificationHandledRef.current = false;
  }, [sessionId]);

  useEffect(() => {
    if (view !== "exam" || !currentUser || !sessionId) {
      return;
    }

    const stopStream = openNotificationsLiveStream(
      "student",
      {
        onMessage: (notification) => {
          if (notification.sessionId !== sessionId) {
            return;
          }

          if (notification.type === "teacher_warning") {
            showWarning(notification.message);
            return;
          }

          if (
            notification.type === "exam_disqualified" &&
            !disqualificationHandledRef.current
          ) {
            disqualificationHandledRef.current = true;
            terminateExam(
              notification.message || "Teacher disqualified this exam session.",
            );
          }
        },
      },
      currentUser.id,
    );

    return () => {
      stopStream();
    };
  }, [currentUser, sessionId, showWarning, terminateExam, view]);

  const updateAnswer = (questionIdOrValue: string, maybeValue?: string) => {
    if (!activeExam) return;
    const currentQuestion = activeExam.questions[currentQuestionIndex];
    const questionId = maybeValue ? questionIdOrValue : currentQuestion?.id;
    const value = maybeValue ?? questionIdOrValue;
    if (!questionId) return;
    setAnswers((prev) => {
      const nextAnswers = { ...prev, [questionId]: value };
      writeDraftAnswers(sessionId, nextAnswers);
      return nextAnswers;
    });
    if (!sessionId) return;
    pendingAnswersRef.current = {
      ...pendingAnswersRef.current,
      [questionId]: value,
    };
    scheduleAnswerFlush();
  };

  const resetExamSession = useCallback(() => {
    clearAnswerFlushTimer();
    pendingAnswersRef.current = {};
    clearDraftAnswers(sessionId);
    setView("dashboard");
    setActiveExam(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setTimeLeft(0);
    setLastSubmission(null);
    setResultPending(false);
    setResultReleaseAt(null);
    setAnswerReport([]);
    setViolations({ ...EMPTY_VIOLATIONS });
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => null);
    }
    document.body.style.filter = "none";
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem(STUDENT_EXAM_RUNTIME_KEY);
      } catch {
        // ignore persistence failures
      }
    }
  }, [clearAnswerFlushTimer, sessionId, setAnswerReport, setLastSubmission, setResultPending, setResultReleaseAt, setViolations]);

  useEffect(() => {
    return () => {
      clearAnswerFlushTimer();
      pendingAnswersRef.current = {};
    };
  }, [clearAnswerFlushTimer]);

  return {
    view,
    setView,
    activeExam,
    setActiveExam,
    answers,
    setAnswers,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    timeLeft,
    setTimeLeft,
    lastSubmission,
    answerReport,
    setAnswerReport,
    violations,
    setViolations,
    warning,
    showWarning,
    logViolation,
    startingExam,
    startExam,
    submittingExam,
    submitExam,
    terminateExam,
    resultPending,
    resultCountdown,
    resultReleaseAt,
    updateAnswer,
    selectMcqAnswer: (questionIdOrValue: string, maybeValue?: string) => updateAnswer(questionIdOrValue, maybeValue),
    goNext: () => activeExam && setCurrentQuestionIndex((prev) => Math.min(prev + 1, activeExam.questions.length - 1)),
    goPrev: () => setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0)),
    resetExamSession,
    sidebarTimerRef,
  };
};
