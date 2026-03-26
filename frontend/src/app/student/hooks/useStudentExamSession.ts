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
};

export const useStudentExamSession = ({
  currentUser,
  roomCodeInput,
  sessionId,
}: UseStudentExamSessionParams) => {
  const [view, setView] = useState<"dashboard" | "exam" | "result">(
    "dashboard",
  );
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [lastSubmission, setLastSubmission] = useState<Submission | null>(null);
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
    if (!sessionId || !currentUser) return;
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
        setView("exam");
      } catch {
        showWarning("Шалгалт эхлүүлэхэд алдаа гарлаа.");
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
      setView("result");
    },
    [activeExam, answers, currentUser, violations, sessionId],
  );

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
    updateAnswer,
    selectMcqAnswer,
    goNext,
    goPrev,
    sidebarTimerRef,
  };
};
