import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, unwrapApi } from "@/lib/api-client";
import type {
  Exam,
  Question,
  StudentTab,
  Submission,
  Violations,
} from "../types";
import type { User } from "@/lib/examGuard";
import { buildAnswerReport } from "./student-exam-helpers";

const emptyViolations: Violations = {
  tabSwitch: 0,
  windowBlur: 0,
  copyAttempt: 0,
  pasteAttempt: 0,
  fullscreenExit: 0,
  keyboardShortcut: 0,
  log: [],
};
export const useStudentExamState = (params: {
  currentUser: User | null;
}) => {
  const { currentUser } = params;
  const [view, setView] = useState<"dashboard" | "exam" | "result">(
    "dashboard",
  );
  const [activeTab, setActiveTab] = useState<StudentTab>("Home");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [lastSubmission, setLastSubmission] = useState<Submission | null>(null);
  const [answerReport, setAnswerReport] = useState<
    { question: Question; answer: string; correct: boolean }[]
  >([]);
  const [violations, setViolations] = useState<Violations>({ ...emptyViolations });
  const [warning, setWarning] = useState<string | null>(null);
  const sidebarTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (view === "exam") return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => null);
    }
    document.body.style.filter = "none";
  }, [view]);
  const handleLookup = async () => {
    const code = roomCodeInput.trim().toUpperCase();
    if (!code) {
      setJoinError("Өрөөний код оруулна уу.");
      return;
    }
    setJoinLoading(true);
    try {
      const payload = await apiFetch<
        { data?: { sessionId: string; exam: { id: string; title: string; durationMin: number; questionCount: number } } } | {
          sessionId: string;
          exam: { id: string; title: string; durationMin: number; questionCount: number };
        }
      >("/api/sessions/join", {
        method: "POST",
        body: JSON.stringify({ roomCode: code }),
      });
      const data = unwrapApi(payload);
      setSessionId(data.sessionId);
      const detailPayload = await apiFetch<
        | {
            data?: {
              session: {
                id: string;
                status: string;
                startedAt: string | null;
                submittedAt: string | null;
              };
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
                options?: {
                  id: string;
                  label: string;
                  text: string;
                }[];
              }[];
            };
          }
        | {
            session: {
              id: string;
              status: string;
              startedAt: string | null;
              submittedAt: string | null;
            };
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
              options?: {
                id: string;
                label: string;
                text: string;
              }[];
            }[];
          }
      >(`/api/sessions/${data.sessionId}`);
      const detail = unwrapApi(detailPayload);
      setSelectedExam({
        id: detail.exam.id,
        title: detail.exam.title,
        description: detail.exam.description ?? null,
        scheduledAt: detail.session.startedAt ?? new Date().toISOString(),
        examStartedAt: detail.session.startedAt ?? null,
        roomCode: code,
        questions: detail.questions.map((question) => ({
          id: question.id,
          text: question.questionText,
          type: question.type as Question["type"],
          options: question.options?.map((opt) => opt.text) ?? undefined,
          correctAnswer: "",
          points: Number(question.points ?? 1),
          imageUrl: question.imageUrl ?? undefined,
        })),
        duration: detail.exam.durationMin,
        createdAt: new Date().toISOString(),
      });
      setJoinError(null);
    } catch (err) {
      let message: unknown =
        "Өрөөний код олдсонгүй эсвэл шалгалт идэвхгүй байна.";
      if (err instanceof Error && err.message) {
        try {
          const parsed = JSON.parse(err.message) as {
            message?: string;
            error?: string | { message?: string; code?: string };
          };
          if (typeof parsed.message === "string") {
            message = parsed.message;
          } else if (typeof parsed.error === "string") {
            message = parsed.error;
          } else if (parsed.error && typeof parsed.error === "object") {
            message = parsed.error.message ?? message;
          }
        } catch {
          message = err.message;
        }
      }
      const messageText = String(message);
      if (
        messageText.toLowerCase().includes("load failed") ||
        messageText.toLowerCase().includes("failed to fetch")
      ) {
        setJoinError(
          "Сервертэй холбогдож чадсангүй. Backend ажиллаж байгаа эсэхийг шалгана уу.",
        );
      } else {
        setJoinError(messageText);
      }
      setSelectedExam(null);
    } finally {
      setJoinLoading(false);
    }
  };
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
    const eventTypeMap: Record<string, string> = {
      TAB_SWITCH: "tab_switch",
      WINDOW_BLUR: "window_blur",
      COPY_ATTEMPT: "copy_paste",
      PASTE_ATTEMPT: "copy_paste",
      FULLSCREEN_EXIT: "tab_hidden",
      KEYBOARD_SHORTCUT: "devtools_open",
      SUSPICIOUS_SPEED: "rapid_answers",
      NO_MOUSE_MOVEMENT: "idle_too_long",
      EXTENDED_DISPLAY: "multiple_monitors",
    };
    const eventType = eventTypeMap[type] ?? "suspicious_resize";
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
          { data?: { exam: { id: string; title: string; description?: string | null; durationMin: number }; questions: { id: string; type: string; questionText: string; imageUrl?: string | null; points: number; options?: { id: string; label: string; text: string }[] }[] } } | {
            exam: { id: string; title: string; description?: string | null; durationMin: number };
            questions: { id: string; type: string; questionText: string; imageUrl?: string | null; points: number; options?: { id: string; label: string; text: string }[] }[];
          }
        >(`/api/sessions/${sessionId}`);
        const sessionData = unwrapApi(sessionPayload);
        const examData = sessionData.exam;
        const mappedExam: Exam = {
          id: examData.id,
          title: examData.title,
          description: examData.description ?? null,
          scheduledAt: null,
          roomCode: roomCodeInput.trim().toUpperCase(),
          questions: sessionData.questions.map((question) => ({
            id: question.id,
            text: question.questionText,
            type: question.type as Question["type"],
            options: question.options?.map((opt) => opt.text) ?? undefined,
            correctAnswer: "",
            points: Number(question.points ?? 1),
            imageUrl: question.imageUrl ?? undefined,
          })),
          duration: examData.durationMin,
          createdAt: new Date().toISOString(),
        };
        setActiveExam(mappedExam);
        await apiFetch(`/api/sessions/${sessionId}/start`, { method: "POST" });
        const totalSeconds = (mappedExam.duration ?? 45) * 60;
        setTimeLeft(totalSeconds);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setViolations({ ...emptyViolations });
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => null);
        }
        setView("exam");
      } catch {
        setJoinError("Шалгалт эхлүүлэхэд алдаа гарлаа.");
      }
    };
    void run();
  };
  const submitExam = useCallback(
    async (auto = false, terminated = false, reason?: string) => {
      if (!activeExam || !currentUser) return;
      if (!auto) {
        const ok = window.confirm("Та шалгалтаа илгээхдээ итгэлтэй байна уу?");
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
      const backendReport = result.answers.map((item) => ({
        question: {
          id: `${item.questionText}-${item.points}`,
          text: item.questionText,
          type: "text" as const,
          options: undefined,
          correctAnswer: item.correctAnswer ?? "",
          points: item.points ?? 1,
        },
        answer: item.selectedAnswer ?? "",
        correct: Boolean(item.isCorrect),
      }));

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
      setActiveTab("Progress");
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
    activeTab,
    setActiveTab,
    handleLookup,
    roomCodeInput,
    setRoomCodeInput,
    joinLoading,
    joinError,
    setJoinError,
    selectedExam,
    setSelectedExam,
    activeExam,
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
