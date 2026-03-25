import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { setJSON } from "@/lib/examGuard";
import type {
  Exam,
  ExamSession,
  NotificationItem,
  Question,
  Submission,
  Violations,
} from "../types";
import type { User } from "@/lib/examGuard";
import {
  buildAnswerReport,
  markExamStartedForRoles,
  persistSubmissionData,
} from "./student-exam-helpers";

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
  exams: Exam[];
  setNotifications: (items: NotificationItem[]) => void;
}) => {
  const { currentUser, exams, setNotifications } = params;
  const [view, setView] = useState<"dashboard" | "exam" | "result">(
    "dashboard",
  );
  const [activeTab, setActiveTab] = useState<
    "Шалгалт" | "Дүн" | "Профайл" | "Тохиргоо" | "Тусламж"
  >("Шалгалт");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
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
  const activeExam = useMemo(() => {
    return selectedExam ?? exams[0] ?? null;
  }, [selectedExam, exams]);
  const sessionKey = useMemo(() => {
    if (!currentUser || !activeExam) return null;
    return `examSession_${activeExam.id}_${currentUser.id}`;
  }, [activeExam, currentUser]);
  const handleLookup = () => {
    const code = roomCodeInput.trim().toUpperCase();
    if (!code) {
      setJoinError("Өрөөний код оруулна уу.");
      return;
    }
    const found = exams.find((exam) => exam.roomCode === code) || null;
    if (!found) {
      setJoinError("Өрөөний код олдсонгүй.");
      setSelectedExam(null);
      return;
    }
    if (found.scheduledAt) {
      const now = Date.now();
      const scheduledAt = new Date(found.scheduledAt).getTime();
      if (Number.isFinite(scheduledAt) && now < scheduledAt) {
        setJoinError("Шалгалт хараахан эхлээгүй байна. Товлосон үед хүлээнэ үү.");
        setSelectedExam(found);
        return;
      }
      if (
        Number.isFinite(scheduledAt) &&
        now > scheduledAt + 5 * 60 * 1000 &&
        !found.examStartedAt
      ) {
        setJoinError("Шалгалтын эхлэлээс 5 минут өнгөрсөн тул орох боломжгүй.");
        setSelectedExam(null);
        return;
      }
    }
    if (found.examStartedAt) {
      setJoinError("Шалгалт аль хэдийн эхэлсэн байна.");
      setSelectedExam(null);
      return;
    }
    setJoinError(null);
    setSelectedExam(found);
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
  };
  const startExam = () => {
    if (!activeExam || !currentUser) return;
    if (activeExam.scheduledAt) {
      const scheduledAt = new Date(activeExam.scheduledAt).getTime();
      if (Number.isFinite(scheduledAt) && Date.now() < scheduledAt) {
        setJoinError("Шалгалт хараахан эхлээгүй байна. Түр хүлээнэ үү.");
        return;
      }
      if (
        Number.isFinite(scheduledAt) &&
        Date.now() > scheduledAt + 5 * 60 * 1000 &&
        !activeExam.examStartedAt
      ) {
        setJoinError("Шалгалтын эхлэлээс 5 минут өнгөрсөн тул орох боломжгүй.");
        return;
      }
    }
    const startedAt = new Date().toISOString();
    if (!activeExam.examStartedAt) {
      markExamStartedForRoles(activeExam, startedAt);
    }
    const totalSeconds = (activeExam.duration ?? 45) * 60;
    setTimeLeft(totalSeconds);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setViolations({ ...emptyViolations });
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => null);
    }
    if (sessionKey) {
      const session: ExamSession = {
        examId: activeExam.id,
        studentId: currentUser.id,
        answers: {},
        currentQuestionIndex: 0,
        timeLeft: totalSeconds,
        startedAt: new Date().toISOString(),
      };
      setJSON(sessionKey, session);
    }
    setView("exam");
  };
  const submitExam = useCallback(
    (auto = false, terminated = false, reason?: string) => {
      if (!activeExam || !currentUser) return;
      if (!auto) {
        const ok = window.confirm("Та шалгалтаа илгээхдээ итгэлтэй байна уу?");
        if (!ok) return;
      }
      const report = buildAnswerReport(activeExam, answers);
      const { submission } = persistSubmissionData({
        exam: activeExam,
        currentUser,
        report,
        violations,
        terminated,
        reason,
        setNotifications,
      });

      if (sessionKey) localStorage.removeItem(sessionKey);
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => null);
      }
      document.body.style.filter = "none";
      setLastSubmission(submission);
      setAnswerReport(report);
      setActiveTab("Дүн");
      setView("result");
    },
    [activeExam, answers, currentUser, sessionKey, violations, setNotifications],
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
  };
  const selectMcqAnswer = (value: string) => {
    updateAnswer(value);
  };

  const persistSessionNow = () => {
    if (!sessionKey || !activeExam || !currentUser) return;
    const session: ExamSession = {
      examId: activeExam.id,
      studentId: currentUser.id,
      answers,
      currentQuestionIndex,
      timeLeft,
      startedAt: new Date().toISOString(),
    };
    setJSON(sessionKey, session);
  };

  const goNext = () => {
    if (!activeExam) return;
    const next = Math.min(
      currentQuestionIndex + 1,
      activeExam.questions.length - 1,
    );
    setCurrentQuestionIndex(next);
    persistSessionNow();
  };

  const goPrev = () => {
    const prev = Math.max(currentQuestionIndex - 1, 0);
    setCurrentQuestionIndex(prev);
    persistSessionNow();
  };

  return {
    view,
    setView,
    activeTab,
    setActiveTab,
    handleLookup,
    roomCodeInput,
    setRoomCodeInput,
    joinError,
    setJoinError,
    selectedExam,
    setSelectedExam,
    activeExam,
    sessionKey,
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
