import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, unwrapApi } from "@/lib/api-client";
import type { Exam, Question, Submission, Violations } from "../types";
import type { User } from "@/lib/examGuard";
import { buildAnswerReport } from "./student-exam-helpers";
import {
  EMPTY_VIOLATIONS,
  EVENT_TYPE_MAP,
  mapResultToReport,
  mapSessionToExam,
} from "./student-exam-session-helpers";

type UseStudentExamSessionParams = {
  currentUser: User | null;
  roomCodeInput: string;
  sessionId: string | null;
  setJoinError?: (value: string | null) => void;
};

export const useStudentExamSession = ({
  currentUser,
  roomCodeInput,
  sessionId,
  setJoinError,
}: UseStudentExamSessionParams) => {
  const [view, setView] = useState<"dashboard" | "exam" | "result">(
    "dashboard",
  );
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [lastSubmission, setLastSubmission] = useState<Submission | null>(null);
  const [resultPending, setResultPending] = useState(false);
  const [resultReleaseAt, setResultReleaseAt] = useState<string | null>(null);
  const [resultCountdown, setResultCountdown] = useState("00:00:00");
  const [answerReport, setAnswerReport] = useState<
    { question: Question; answer: string; correct: boolean }[]
  >([]);
  const [violations, setViolations] = useState<Violations>({
    ...EMPTY_VIOLATIONS,
  });
  const [warning, setWarning] = useState<string | null>(null);
  const sidebarTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (view === "exam") return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => null);
    }
    document.body.style.filter = "none";
  }, [view]);

  const showWarning = (message: string) => {
    setWarning(message);
    setTimeout(() => setWarning(null), 3000);
  };

  const logViolation = (type: string) => {
    setViolations((prev) => ({
      ...prev,
      log: [{ type, timestamp: new Date().toISOString() }, ...prev.log].slice(
        0,
        50,
      ),
      tabSwitch: type === "TAB_SWITCH" ? prev.tabSwitch + 1 : prev.tabSwitch,
      windowBlur:
        type === "WINDOW_BLUR" ? prev.windowBlur + 1 : prev.windowBlur,
      copyAttempt:
        type === "COPY_ATTEMPT" ? prev.copyAttempt + 1 : prev.copyAttempt,
      pasteAttempt:
        type === "PASTE_ATTEMPT" ? prev.pasteAttempt + 1 : prev.pasteAttempt,
      fullscreenExit:
        type === "FULLSCREEN_EXIT"
          ? prev.fullscreenExit + 1
          : prev.fullscreenExit,
      keyboardShortcut:
        type === "KEYBOARD_SHORTCUT"
          ? prev.keyboardShortcut + 1
          : prev.keyboardShortcut,
    }));
    if (!sessionId) return;
    const eventType = EVENT_TYPE_MAP[type] ?? "suspicious_resize";
    void apiFetch("/api/cheat/event", {
      method: "POST",
      body: JSON.stringify({
        sessionId,
        eventType,
        metadata: type,
      }),
    });
  };

  const startExam = () => {
    if (!sessionId || !currentUser) {
      setJoinError?.("Шалгалт эхлүүлэхэд шаардлагатай мэдээлэл алга байна.");
      return;
    }
    const run = async () => {
      try {
        const sessionPayload = await apiFetch<
          | {
              data?: {
                exam: {
                  id: string;
                  title: string;
                  description?: string | null;
                  durationMin: number;
                };
                questions: {
                  id: string;
                  type: string;
                  questionText: string;
                  imageUrl?: string | null;
                  points: number;
                  options?: { id: string; label: string; text: string }[];
                }[];
              };
            }
          | {
              exam: {
                id: string;
                title: string;
                description?: string | null;
                durationMin: number;
              };
              questions: {
                id: string;
                type: string;
                questionText: string;
                imageUrl?: string | null;
                points: number;
                options?: { id: string; label: string; text: string }[];
              }[];
            }
        >(`/api/sessions/${sessionId}`);
        const sessionData = unwrapApi(sessionPayload);
        const mappedExam: Exam = mapSessionToExam(sessionData, roomCodeInput);
        setActiveExam(mappedExam);
        await apiFetch(`/api/sessions/${sessionId}/start`, { method: "POST" });
        const totalSeconds = (mappedExam.duration ?? 45) * 60;
        setTimeLeft(totalSeconds);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setViolations({ ...EMPTY_VIOLATIONS });
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => null);
        }
        setJoinError?.(null);
        setView("exam");
      } catch (err) {
        let message = "Шалгалт эхлүүлэхэд алдаа гарлаа.";
        if (err instanceof Error && err.message) {
          try {
            const parsed = JSON.parse(err.message) as {
              message?: string;
              error?: string | { message?: string };
            };
            message =
              parsed.message ||
              (typeof parsed.error === "string"
                ? parsed.error
                : parsed.error?.message) ||
              message;
          } catch {
            message = err.message;
          }
        }
        setJoinError?.(message);
        showWarning(message);
      }
    };
    void run();
  };

  const submitExam = useCallback(
    async (auto = false, terminated = false, reason?: string) => {
      if (!activeExam || !currentUser) return;
      if (!auto) {
        const ok = window.confirm(
          "Та шалгалтаа илгээхдээ итгэлтэй байна уу?",
        );
        if (!ok) return;
      }
      if (!sessionId) return;
      const report = buildAnswerReport(activeExam, answers);
      await apiFetch(`/api/sessions/${sessionId}/submit`, { method: "POST" });
      const getExamEndAt = () => {
        const durationMs = (activeExam.duration ?? 45) * 60 * 1000;
        const base =
          activeExam.finishedAt ??
          activeExam.examStartedAt ??
          activeExam.scheduledAt ??
          null;
        if (!base) return null;
        const baseTime = new Date(base).getTime();
        if (Number.isNaN(baseTime)) return null;
        if (activeExam.finishedAt) return new Date(baseTime).toISOString();
        return new Date(baseTime + durationMs).toISOString();
      };

      try {
        const resultPayload = await apiFetch<
          | {
              data?: {
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
            }
          | {
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
            }
        >(`/api/sessions/${sessionId}/result`);
        const result = unwrapApi(resultPayload);
        const backendReport = mapResultToReport(result);

        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => null);
        }
        document.body.style.filter = "none";
        const submission: Submission = {
          id: sessionId,
          examId: activeExam.id,
          studentId: currentUser.id,
          studentНэр: currentUser.username,
          answers: report.map((item) => ({
            questionId: item.question.id,
            selectedAnswer: item.answer,
            correct: item.correct,
          })),
          score: result.score ?? 0,
          totalPoints: result.totalPoints ?? 0,
          percentage: result.score ?? 0,
          terminated,
          terminationReason: reason,
          violations,
          submittedAt: new Date().toISOString(),
        };
        setLastSubmission(submission);
        setAnswerReport(backendReport);
        setResultPending(false);
        setResultReleaseAt(null);
        setView("result");
        return;
      } catch (err) {
        let errorCode: string | null = null;
        if (err instanceof Error && err.message) {
          try {
            const parsed = JSON.parse(err.message) as {
              error?: { code?: string; message?: string };
            };
            errorCode = parsed.error?.code ?? null;
          } catch {
            errorCode = null;
          }
        }

        if (errorCode === "RESULTS_PENDING" || errorCode === "NOT_GRADED") {
          setResultPending(true);
          setResultReleaseAt(getExamEndAt());
          setAnswerReport([]);
          const submission: Submission = {
            id: sessionId,
            examId: activeExam.id,
            studentId: currentUser.id,
            studentНэр: currentUser.username,
            answers: report.map((item) => ({
              questionId: item.question.id,
              selectedAnswer: item.answer,
              correct: item.correct,
            })),
            score: 0,
            totalPoints: 0,
            percentage: 0,
            terminated,
            terminationReason: reason,
            violations,
            submittedAt: new Date().toISOString(),
          };
          setLastSubmission(submission);
          setView("result");
          return;
        }
      }
    },
    [activeExam, answers, currentUser, violations, sessionId],
  );

  useEffect(() => {
    if (!resultPending) return;
    if (!resultReleaseAt) {
      setResultCountdown("00:00:00");
      return;
    }
    const releaseTime = new Date(resultReleaseAt).getTime();
    if (Number.isNaN(releaseTime)) return;
    const timer = window.setInterval(() => {
      const diff = releaseTime - Date.now();
      const safeDiff = Math.max(diff, 0);
      const hours = Math.floor(safeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((safeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((safeDiff % (1000 * 60)) / 1000);
      setResultCountdown(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [resultPending, resultReleaseAt]);

  useEffect(() => {
    if (!resultPending || !sessionId || !activeExam) return;
    const interval = window.setInterval(async () => {
      try {
        const resultPayload = await apiFetch<
          | {
              data?: {
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
            }
          | {
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
            }
        >(`/api/sessions/${sessionId}/result`);
        const result = unwrapApi(resultPayload);
        const backendReport = mapResultToReport(result);
        setAnswerReport(backendReport);
        setLastSubmission((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            score: result.score ?? 0,
            totalPoints: result.totalPoints ?? 0,
            percentage: result.score ?? 0,
          };
        });
        setResultPending(false);
        setResultReleaseAt(null);
      } catch {
        return;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [resultPending, sessionId, activeExam]);

  const terminateExam = useCallback(
    (reason: string) => {
      showWarning("Шалгалт зогсоолоо.");
      submitExam(true, true, reason);
    },
    [submitExam],
  );

  const updateAnswer = (value: string) => {
    if (!activeExam) return;
    const currentQuestion = activeExam.questions[currentQuestionIndex];
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    if (!sessionId) return;
    void apiFetch(`/api/sessions/${sessionId}/answer`, {
      method: "POST",
      body: JSON.stringify({
        questionId: currentQuestion.id,
        textAnswer: value,
      }),
    });
  };
  const selectMcqAnswer = (value: string) => {
    updateAnswer(value);
  };

  const goNext = () => {
    if (!activeExam) return;
    const next = Math.min(
      currentQuestionIndex + 1,
      activeExam.questions.length - 1,
    );
    setCurrentQuestionIndex(next);
  };

  const goPrev = () => {
    const prev = Math.max(currentQuestionIndex - 1, 0);
    setCurrentQuestionIndex(prev);
  };

  const resetExamSession = useCallback(() => {
    setView("dashboard");
    setActiveExam(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setTimeLeft(0);
    setLastSubmission(null);
    setResultPending(false);
    setResultReleaseAt(null);
    setResultCountdown("00:00:00");
    setAnswerReport([]);
    setViolations({ ...EMPTY_VIOLATIONS });
    setWarning(null);
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => null);
    }
    document.body.style.filter = "none";
  }, []);

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
    startExam,
    submitExam,
    terminateExam,
    resultPending,
    resultCountdown,
    resultReleaseAt,
    updateAnswer,
    selectMcqAnswer,
    goNext,
    goPrev,
    resetExamSession,
    sidebarTimerRef,
  };
};
