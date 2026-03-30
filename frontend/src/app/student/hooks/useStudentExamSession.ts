import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, unwrapApi } from "@/lib/api-client";
import type { User } from "@/lib/examGuard";
import type { Exam, Question, Submission } from "../types";
import { buildAnswerReport } from "./student-exam-helpers";
import { EMPTY_VIOLATIONS, mapResultToReport, mapSessionToExam } from "./student-exam-session-helpers";
import { useStudentExamResultState } from "./useStudentExamResultState";
import { useStudentExamWarnings } from "./useStudentExamWarnings";

type UseStudentExamSessionParams = {
  currentUser: User | null;
  roomCodeInput: string;
  sessionId: string | null;
  setJoinError?: (value: string | null) => void;
};

type SessionData = {
  exam: { id: string; title: string; description?: string | null; durationMin: number };
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

export const useStudentExamSession = ({
  currentUser,
  roomCodeInput,
  sessionId,
  setJoinError,
}: UseStudentExamSessionParams) => {
  const [view, setView] = useState<"dashboard" | "exam" | "result">("dashboard");
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const sidebarTimerRef = useRef<number | null>(null);
  const { violations, setViolations, warning, showWarning, logViolation } = useStudentExamWarnings(sessionId);
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

  const startExam = () => {
    if (!sessionId || !currentUser) {
      setJoinError?.("Шалгалт эхлүүлэхэд шаардлагатай мэдээлэл алга байна.");
      return;
    }

    const run = async () => {
      try {
        const sessionPayload = await apiFetch<SessionData | { data?: SessionData }>(`/api/sessions/${sessionId}`);
        const sessionData = unwrapApi(sessionPayload);
        const mappedExam: Exam = mapSessionToExam(sessionData, roomCodeInput);
        const startPayload = await apiFetch<{ startedAt?: string; status?: string } | { data?: { startedAt?: string; status?: string } }>(`/api/sessions/${sessionId}/start`, { method: "POST" });
        const startData = unwrapApi(startPayload);
        const nextExam = {
          ...mappedExam,
          status: (startData as { status?: string }).status ?? mappedExam.status,
          examStartedAt: (startData as { startedAt?: string }).startedAt ?? mappedExam.examStartedAt,
        };
        setActiveExam(nextExam);
        setTimeLeft(getRemainingSeconds(nextExam));
        setCurrentQuestionIndex(0);
        setAnswers({});
        setViolations({ ...EMPTY_VIOLATIONS });
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => null);
        }
        setJoinError?.(null);
        setView("exam");
      } catch (error) {
        const message = parseErrorMessage(error, "Шалгалт эхлүүлэхэд алдаа гарлаа.");
        setJoinError?.(message);
        showWarning(message);
      }
    };

    void run();
  };

  const submitExam = useCallback(async (auto = false, terminated = false, reason?: string) => {
    if (!activeExam || !currentUser || !sessionId) return;
    if (!auto && !window.confirm("Та шалгалтаа илгээхдээ итгэлтэй байна уу?")) return;

    const report = buildAnswerReport(activeExam, answers);
    await apiFetch(`/api/sessions/${sessionId}/submit`, { method: "POST" });

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
      studentНэр: currentUser.username,
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
      const resultPayload = await apiFetch<SessionResult | { data?: SessionResult }>(`/api/sessions/${sessionId}/result`);
      const result = unwrapApi(resultPayload);
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
        setResultPending(true);
        setResultReleaseAt(examEndAt);
        setAnswerReport([]);
        setLastSubmission(pendingSubmission);
        setView("result");
      }
    }
  }, [activeExam, answers, currentUser, sessionId, violations, setAnswerReport, setLastSubmission, setResultPending, setResultReleaseAt]);

  const terminateExam = useCallback((reason: string) => {
    showWarning("Шалгалт зогсоолоо.");
    void submitExam(true, true, reason);
  }, [showWarning, submitExam]);

  const updateAnswer = (questionIdOrValue: string, maybeValue?: string) => {
    if (!activeExam) return;
    const currentQuestion = activeExam.questions[currentQuestionIndex];
    const questionId = maybeValue ? questionIdOrValue : currentQuestion?.id;
    const value = maybeValue ?? questionIdOrValue;
    if (!questionId) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (!sessionId) return;
    void apiFetch(`/api/sessions/${sessionId}/answer`, {
      method: "POST",
      body: JSON.stringify({ questionId, textAnswer: value }),
    });
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
    setAnswerReport([]);
    setViolations({ ...EMPTY_VIOLATIONS });
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => null);
    }
    document.body.style.filter = "none";
  }, [setAnswerReport, setLastSubmission, setResultPending, setResultReleaseAt, setViolations]);

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
    selectMcqAnswer: (questionIdOrValue: string, maybeValue?: string) => updateAnswer(questionIdOrValue, maybeValue),
    goNext: () => activeExam && setCurrentQuestionIndex((prev) => Math.min(prev + 1, activeExam.questions.length - 1)),
    goPrev: () => setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0)),
    resetExamSession,
    sidebarTimerRef,
  };
};
