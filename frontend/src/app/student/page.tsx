"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  getSessionUser,
  clearSession,
  getJSON,
  setJSON,
  generateId,
  calculateXP,
  getLevel,
  LEVELS,
} from "@/lib/examGuard";

type Question = {
  id: string;
  text: string;
  type: "text" | "open" | "mcq";
  options?: string[];
  correctAnswer: string;
};

type Exam = {
  id: string;
  title: string;
  scheduledAt: string | null;
  roomCode: string;
  questions: Question[];
  duration?: number;
  createdAt: string;
  notified?: boolean;
};

type Submission = {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  answers: { questionId: string; selectedAnswer: string; correct: boolean }[];
  score: number;
  totalPoints: number;
  percentage: number;
  terminated?: boolean;
  terminationReason?: string;
  violations?: Violations;
  submittedAt: string;
};

type StudentProgress = {
  [studentId: string]: {
    xp: number;
    level: number;
    history: { examId: string; percentage: number; xp: number; date: string }[];
  };
};

type NotificationItem = {
  examId: string;
  message: string;
  read: boolean;
  createdAt: string;
};

type ViolationLog = {
  type: string;
  timestamp: string;
};

type Violations = {
  tabSwitch: number;
  windowBlur: number;
  copyAttempt: number;
  pasteAttempt: number;
  fullscreenExit: number;
  keyboardShortcut: number;
  log: ViolationLog[];
};

type ExamSession = {
  examId: string;
  studentId: string;
  answers: Record<string, string>;
  currentQuestionIndex: number;
  timeLeft: number;
  startedAt: string;
};

const mockHistory = [
  { title: "Algebra Quiz", score: "88%", date: "2026-03-20" },
  { title: "History Final", score: "72%", date: "2026-03-12" },
  { title: "Chemistry Lab", score: "95%", date: "2026-02-28" },
];

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

export default function StudentPage() {
  const router = useRouter();
  const cardClass =
    "rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";
  const mutedCardClass =
    "rounded-2xl border border-border bg-muted p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";
  const inputClass =
    "w-full rounded-xl border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
  const buttonPrimary =
    "rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:brightness-110";
  const buttonGhost =
    "rounded-xl border border-border px-3 py-2 text-xs transition hover:bg-muted";
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"dashboard" | "exam" | "result">(
    "dashboard"
  );
  const [activeTab, setActiveTab] = useState<"Exam" | "Results" | "Settings">(
    "Exam"
  );
  const [exams, setExams] = useState<Exam[]>([]);
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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const sidebarTimerRef = useRef<number | null>(null);
  const [violations, setViolations] = useState<Violations>({
    tabSwitch: 0,
    windowBlur: 0,
    copyAttempt: 0,
    pasteAttempt: 0,
    fullscreenExit: 0,
    keyboardShortcut: 0,
    log: [],
  });
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    const user = getSessionUser();
    setCurrentUser(
      user ?? {
        id: "demo",
        username: "DemoStudent",
        password: "",
        role: "student",
        createdAt: "",
      }
    );
    const storedTheme =
      typeof window !== "undefined"
        ? (localStorage.getItem("theme") as "dark" | "light" | null)
        : null;
    if (storedTheme) setTheme(storedTheme);
    setExams(getJSON<Exam[]>("exams", []));
    setNotifications(getJSON<NotificationItem[]>("notifications", []));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  const activeExam = useMemo(() => {
    return selectedExam ?? exams[0] ?? null;
  }, [selectedExam, exams]);

  const sessionKey = useMemo(() => {
    if (!currentUser || !activeExam) return null;
    return `examSession_${activeExam.id}_${currentUser.id}`;
  }, [activeExam, currentUser]);

  const studentHistory = useMemo(() => {
    if (!currentUser) return [] as StudentProgress[string]["history"];
    const progress = getJSON<StudentProgress>("studentProgress", {});
    return progress[currentUser.id]?.history ?? [];
  }, [currentUser, lastSubmission]);

  const studentProgress = useMemo(() => {
    if (!currentUser) return { xp: 0, level: 1, history: [] };
    const progress = getJSON<StudentProgress>("studentProgress", {});
    return progress[currentUser.id] ?? { xp: 0, level: 1, history: [] };
  }, [currentUser, lastSubmission]);

  const levelInfo = useMemo(() => getLevel(studentProgress.xp), [studentProgress.xp]);
  const nextLevel = useMemo(() => {
    const next = LEVELS.find((lvl) => lvl.level === levelInfo.level + 1);
    return next ?? levelInfo;
  }, [levelInfo]);
  const progressSegments = useMemo(() => {
    const total = nextLevel.minXP - levelInfo.minXP || 1;
    const current = Math.max(studentProgress.xp - levelInfo.minXP, 0);
    return Math.min(10, Math.max(0, Math.round((current / total) * 10)));
  }, [studentProgress.xp, levelInfo, nextLevel]);

  const handleLookup = () => {
    const code = roomCodeInput.trim().toUpperCase();
    if (!code) {
      setJoinError("Room code оруулна уу.");
      return;
    }
    const found = exams.find((exam) => exam.roomCode === code) || null;
    if (!found) {
      setJoinError("Room code олдсонгүй.");
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
      log: [
        { type, timestamp: new Date().toISOString() },
        ...prev.log,
      ].slice(0, 50),
      tabSwitch: type === "TAB_SWITCH" ? prev.tabSwitch + 1 : prev.tabSwitch,
      windowBlur: type === "WINDOW_BLUR" ? prev.windowBlur + 1 : prev.windowBlur,
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

  const terminateExam = (reason: string) => {
    showWarning("Шалгалт зогсоолоо.");
    submitExam(true, true, reason);
  };

  const startExam = () => {
    if (!activeExam || !currentUser) return;
    const totalSeconds = (activeExam.duration ?? 45) * 60;
    setTimeLeft(totalSeconds);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setViolations({
      tabSwitch: 0,
      windowBlur: 0,
      copyAttempt: 0,
      pasteAttempt: 0,
      fullscreenExit: 0,
      keyboardShortcut: 0,
      log: [],
    });
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

  useEffect(() => {
    if (view !== "exam" || !sessionKey) return;
    const session = getJSON<ExamSession | null>(sessionKey, null);
    if (session) {
      setAnswers(session.answers);
      setCurrentQuestionIndex(session.currentQuestionIndex);
      setTimeLeft(session.timeLeft);
    }
  }, [view, sessionKey]);

  useEffect(() => {
    if (view !== "exam") return;

    const handleVisibility = () => {
      if (!document.hidden) return;
      const nextCount = violations.tabSwitch + 1;
      logViolation("TAB_SWITCH");
      showWarning(`⚠️ Tab солисон илэрлээ! ${3 - nextCount} оролдлого үлдлээ`);
      if (nextCount >= 3) terminateExam("TAB_SWITCH_LIMIT");
    };

    const handleBlur = () => {
      const nextCount = violations.windowBlur + 1;
      logViolation("WINDOW_BLUR");
      showWarning(`⚠️ Window focus алдагдлаа! ${3 - nextCount} оролдлого үлдлээ`);
      if (nextCount >= 3) terminateExam("WINDOW_BLUR_LIMIT");
    };

    const handleCopy = (event: ClipboardEvent) => {
      event.preventDefault();
      logViolation("COPY_ATTEMPT");
      showWarning("🚫 Хуулах хориглогдсон!");
    };

    const handlePaste = (event: ClipboardEvent) => {
      event.preventDefault();
      logViolation("PASTE_ATTEMPT");
      showWarning("🚫 Буулгах хориглогдсон!");
    };

    const handleCut = (event: ClipboardEvent) => {
      event.preventDefault();
      logViolation("CUT_ATTEMPT");
      showWarning("🚫 Огтлох хориглогдсон!");
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      logViolation("CONTEXT_MENU");
      showWarning("🚫 Баруун товч хориглогдсон!");
    };

    const handleKeydown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const blocked =
        (event.ctrlKey && ["c", "v", "x", "a", "p", "u", "s"].includes(key)) ||
        key === "f12" ||
        (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key)) ||
        key === "printscreen";
      if (blocked) {
        event.preventDefault();
        const nextCount = violations.keyboardShortcut + 1;
        logViolation("KEYBOARD_SHORTCUT");
        showWarning("⌨️ Энэ товч хориглогдсон!");
        if (nextCount >= 3) terminateExam("KEYBOARD_LIMIT");
      }
    };

    const handleFullscreen = () => {
      if (document.fullscreenElement) return;
      const nextCount = violations.fullscreenExit + 1;
      logViolation("FULLSCREEN_EXIT");
      showWarning(`⚠️ Fullscreen‑с гарлаа! ${3 - nextCount} оролдлого үлдлээ`);
      if (nextCount >= 3) terminateExam("FULLSCREEN_EXIT_LIMIT");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("cut", handleCut);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("fullscreenchange", handleFullscreen);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("fullscreenchange", handleFullscreen);
    };
  }, [
    view,
    violations.tabSwitch,
    violations.windowBlur,
    violations.fullscreenExit,
    violations.keyboardShortcut,
  ]);

  useEffect(() => {
    if (view !== "exam" || !sessionKey || !currentUser || !activeExam) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          submitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [view, sessionKey, currentUser, activeExam]);

  useEffect(() => {
    if (view !== "exam" || !sessionKey || !currentUser || !activeExam) return;
    const autosave = setInterval(() => {
      const session: ExamSession = {
        examId: activeExam.id,
        studentId: currentUser.id,
        answers,
        currentQuestionIndex,
        timeLeft,
        startedAt: new Date().toISOString(),
      };
      setJSON(sessionKey, session);
    }, 30000);
    return () => clearInterval(autosave);
  }, [view, sessionKey, currentUser, activeExam, answers, currentQuestionIndex, timeLeft]);

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
    const next = Math.min(currentQuestionIndex + 1, activeExam.questions.length - 1);
    setCurrentQuestionIndex(next);
    persistSessionNow();
  };

  const goPrev = () => {
    const prev = Math.max(currentQuestionIndex - 1, 0);
    setCurrentQuestionIndex(prev);
    persistSessionNow();
  };

  const submitExam = (auto = false, terminated = false, reason?: string) => {
    if (!activeExam || !currentUser) return;
    if (!auto) {
      const ok = window.confirm("Та шалгалтаа илгээхдээ итгэлтэй байна уу?");
      if (!ok) return;
    }
    const report = activeExam.questions.map((question) => {
      const studentAnswer = (answers[question.id] || "").trim();
      const correctAnswer = question.correctAnswer.trim();
      const correct =
        studentAnswer.toLowerCase() === correctAnswer.toLowerCase() ||
        (question.type === "mcq" &&
          !!question.options?.some(
            (opt) =>
              opt.toLowerCase() === correctAnswer.toLowerCase() &&
              studentAnswer.toLowerCase() === opt.toLowerCase()
          ));
      return { question, answer: studentAnswer, correct: !!correct };
    });
    const score = terminated ? 0 : report.filter((item) => item.correct).length;
    const totalPoints = activeExam.questions.length || 1;
    const percentage = terminated ? 0 : Math.round((score / totalPoints) * 100);
    const submission: Submission = {
      id: generateId(),
      examId: activeExam.id,
      studentId: currentUser.id,
      studentName: currentUser.username,
      answers: report.map((item) => ({
        questionId: item.question.id,
        selectedAnswer: item.answer,
        correct: item.correct,
      })),
      score,
      totalPoints,
      percentage,
      terminated,
      terminationReason: reason,
      violations,
      submittedAt: new Date().toISOString(),
    };
    const stored = getJSON<Submission[]>("submissions", []);
    setJSON("submissions", [submission, ...stored]);

    const progress = getJSON<StudentProgress>("studentProgress", {});
    const existing = progress[currentUser.id] ?? { xp: 0, level: 1, history: [] };
    const xpEarned = terminated ? 0 : calculateXP(percentage);
    const nextXp = existing.xp + xpEarned;
    const level = getLevel(nextXp);
    progress[currentUser.id] = {
      xp: nextXp,
      level: level.level,
      history: [
        { examId: activeExam.id, percentage, xp: xpEarned, date: new Date().toISOString() },
        ...existing.history,
      ],
    };
    setJSON("studentProgress", progress);

    const notification: NotificationItem = {
      examId: activeExam.id,
      message: `📥 ${currentUser.username} ${activeExam.title} шалгалтыг өглөө (${percentage}%).`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    const notifStore = getJSON<NotificationItem[]>("notifications", []);
    setJSON("notifications", [notification, ...notifStore]);
    setNotifications([notification, ...notifStore]);

    if (sessionKey) localStorage.removeItem(sessionKey);
    setLastSubmission(submission);
    setAnswerReport(report);
    setView("result");
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {view === "dashboard" && (
        <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
          <aside
            className={`border-r border-border bg-card/70 p-5 backdrop-blur transition-all duration-200 ease-out delay-75 ${
              sidebarCollapsed ? "w-20" : "w-full"
            }`}
            onMouseEnter={() => {
              if (sidebarTimerRef.current) {
                window.clearTimeout(sidebarTimerRef.current);
                sidebarTimerRef.current = null;
              }
              setSidebarCollapsed(false);
            }}
            onMouseLeave={() => {
              if (sidebarTimerRef.current) {
                window.clearTimeout(sidebarTimerRef.current);
              }
              sidebarTimerRef.current = window.setTimeout(() => {
                setSidebarCollapsed(true);
              }, 300);
            }}
          >
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-muted text-xs font-bold text-primary">
                EG
              </span>
              {!sidebarCollapsed && <span>ExamGuard</span>}
            </div>
            <button
              className="mt-4 w-full rounded-xl border border-border bg-muted px-3 py-2 text-[11px] uppercase tracking-wide"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
            >
              {sidebarCollapsed ? "Expand" : "Collapse"}
            </button>
            <nav className="mt-6 space-y-2 text-sm">
              {([
                { key: "Exam", icon: "E" },
                { key: "Results", icon: "R" },
                { key: "Settings", icon: "S" },
              ] as const).map((item) => (
                <button
                  key={item.key}
                  className={`group flex w-full items-center ${
                    sidebarCollapsed ? "justify-center gap-0 px-2" : "gap-3 px-3"
                  } rounded-full border py-2 text-left text-[13px] transition duration-200 ease-out hover:scale-[1.01] hover:ring-1 hover:ring-primary/30 ${
                    activeTab === item.key
                      ? "border-primary/30 bg-primary/10 text-foreground shadow-sm"
                      : "border-transparent hover:border-border hover:bg-muted"
                  }`}
                  onClick={() => setActiveTab(item.key)}
                >
                  <span
                    className={`relative grid h-9 w-9 place-items-center rounded-full border text-xs font-semibold transition ${
                      activeTab === item.key
                        ? "border-primary/30 bg-gradient-to-br from-primary/20 to-transparent text-primary"
                        : "border-border bg-card text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    {item.key === "Exam" && (
                      <svg
                        className={`h-4 w-4 transition group-hover:scale-110 ${
                          activeTab === item.key
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 5a2 2 0 0 1 2-2h11a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2Z" />
                        <path d="M6 3v15" />
                      </svg>
                    )}
                    {item.key === "Results" && (
                      <svg
                        className={`h-4 w-4 transition group-hover:scale-110 ${
                          activeTab === item.key
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 19V5" />
                        <path d="M4 19h16" />
                        <path d="M8 15v-4" />
                        <path d="M12 15V9" />
                        <path d="M16 15v-6" />
                      </svg>
                    )}
                    {item.key === "Settings" && (
                      <svg
                        className={`h-4 w-4 transition group-hover:scale-110 ${
                          activeTab === item.key
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
                      </svg>
                    )}
                    {sidebarCollapsed && (
                      <span className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground opacity-0 shadow-sm transition duration-200 ease-out group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100 group-hover:shadow-md translate-x-1 scale-95">
                        {item.key}
                      </span>
                    )}
                  </span>
                  {!sidebarCollapsed && <span>{item.key}</span>}
                </button>
              ))}
            </nav>
          </aside>

          <main className="px-6 py-8">
            <div className="mx-auto w-full max-w-7xl space-y-6">
              <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold">Student Dashboard</h1>
                  <p className="text-sm text-muted-foreground">
                    Real-time exam room & progress
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                <button
                  className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs transition hover:bg-muted"
                  onClick={() =>
                    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
                  }
                >
                  <svg
                    className="h-4 w-4 text-muted-foreground"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3a1 1 0 0 0 0 2" />
                    <path d="M12 19a1 1 0 0 0 0 2" />
                    <path d="M4.93 4.93a1 1 0 0 0 1.41 1.41" />
                    <path d="M17.66 17.66a1 1 0 0 0 1.41 1.41" />
                    <path d="M3 12a1 1 0 0 0 2 0" />
                    <path d="M19 12a1 1 0 0 0 2 0" />
                    <path d="M4.93 19.07a1 1 0 0 0 1.41-1.41" />
                    <path d="M17.66 6.34a1 1 0 0 0 1.41-1.41" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </button>
                <button className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs transition hover:bg-muted">
                  <svg
                    className="h-4 w-4 text-muted-foreground"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  Notifications
                </button>
                <button
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:brightness-110"
                  onClick={() => {
                    clearSession();
                    router.push("/");
                  }}
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <path d="M16 17l5-5-5-5" />
                    <path d="M21 12H9" />
                  </svg>
                  Гарах
                </button>
                </div>
              </header>

            {activeTab === "Exam" && (
              <>
                <section className="grid gap-4 md:grid-cols-3">
                  {loading
                    ? Array.from({ length: 3 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="h-28 animate-pulse rounded-2xl border border-border bg-muted"
                        />
                      ))
                    : (
                      <>
                        <div className={mutedCardClass}>
                          <div className="text-xs text-muted-foreground">
                            <span className="flex items-center gap-2">
                              <svg
                                className="h-4 w-4 text-muted-foreground"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M7 10V7a5 5 0 0 1 10 0v3" />
                                <rect x="5" y="10" width="14" height="10" rx="2" />
                              </svg>
                              Room Code
                            </span>
                          </div>
                          <div className="mt-3 grid gap-2">
                            <input
                              className={inputClass}
                              placeholder="Жишээ: AX7K2P"
                              value={roomCodeInput}
                              onChange={(event) =>
                                setRoomCodeInput(event.target.value)
                              }
                            />
                            <button
                              className={buttonPrimary}
                              onClick={handleLookup}
                            >
                              Шалгах
                            </button>
                            {joinError && (
                              <div className="text-xs text-red-500">
                                {joinError}
                              </div>
                            )}
                          </div>
                          {selectedExam && (
                            <div className="mt-4 rounded-xl border border-border bg-muted px-3 py-2 text-xs">
                              <div className="font-semibold">
                                {selectedExam.title}
                              </div>
                              <div className="text-muted-foreground">
                                {selectedExam.questions.length} асуулт · {selectedExam.duration ?? 45} мин
                              </div>
                              <button
                                className={`mt-3 w-full ${buttonGhost}`}
                                onClick={startExam}
                              >
                                Шалгалт эхлэх
                              </button>
                            </div>
                          )}
                        </div>
                        <div className={mutedCardClass}>
                          <div className="text-xs text-muted-foreground">
                            <span className="flex items-center gap-2">
                              <svg
                                className="h-4 w-4 text-muted-foreground"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 2l2.4 6.4L21 9l-5 4.2L17.2 21 12 17.6 6.8 21 8 13.2 3 9l6.6-.6L12 2Z" />
                              </svg>
                              XP & Level
                            </span>
                          </div>
                          <div className="mt-2 text-xl font-semibold">
                            Lv {levelInfo.level} · {studentProgress.xp} XP
                          </div>
                          <div className="mt-3 grid grid-cols-10 gap-1">
                            {Array.from({ length: 10 }).map((_, idx) => (
                              <div
                                key={idx}
                                className={`h-2 rounded-full ${
                                  idx < progressSegments
                                    ? "bg-primary"
                                    : "bg-muted"
                                }`}
                              />
                            ))}
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Next level: {Math.max(nextLevel.minXP - studentProgress.xp, 0)} XP
                          </div>
                        </div>
                        <div className={mutedCardClass}>
                          <div className="text-xs text-muted-foreground">
                            <span className="flex items-center gap-2">
                              <svg
                                className="h-4 w-4 text-muted-foreground"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                              </svg>
                              Notifications
                            </span>
                          </div>
                          <div className="mt-3 space-y-2 text-xs">
                            {notifications.length === 0 && (
                              <div className="text-muted-foreground">
                                Одоогоор мэдэгдэл алга.
                              </div>
                            )}
                            {notifications.slice(0, 3).map((item) => (
                              <div
                                key={`${item.examId}-${item.createdAt}`}
                                className="rounded-lg border border-border bg-muted px-2 py-1"
                              >
                                {item.message}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                </section>

                <section className={cardClass}>
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <svg
                      className="h-4 w-4 text-muted-foreground"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 12a9 9 0 1 0 9-9" />
                      <path d="M12 7v5l3 3" />
                      <path d="M3 3v4h4" />
                    </svg>
                    Exam History
                  </h2>
                  <div className="mt-4 space-y-3 text-sm">
                    {studentHistory.length === 0
                      ? mockHistory.map((exam) => (
                          <div
                            key={exam.title}
                            className="flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2"
                          >
                            <div>
                              <div className="font-medium">{exam.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {exam.date}
                              </div>
                            </div>
                            <div className="text-xs font-semibold text-foreground">
                              {exam.score}
                            </div>
                          </div>
                        ))
                      : studentHistory.map((exam) => (
                          <div
                            key={`${exam.examId}-${exam.date}`}
                            className="flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2"
                          >
                            <div>
                              <div className="font-medium">Exam #{exam.examId.slice(-4)}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(exam.date)}
                              </div>
                            </div>
                            <div className="text-xs font-semibold text-foreground">
                              {exam.percentage}%
                            </div>
                          </div>
                        ))}
                  </div>
                </section>
              </>
            )}

            {activeTab === "Results" && (
              <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                <div className={cardClass}>
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <svg
                      className="h-4 w-4 text-muted-foreground"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 19V5" />
                      <path d="M4 19h16" />
                      <path d="M8 15v-4" />
                      <path d="M12 15V9" />
                      <path d="M16 15v-6" />
                    </svg>
                    Latest Results
                  </h2>
                  <div className="mt-4 space-y-3 text-sm">
                    {studentHistory.length === 0
                      ? mockHistory.map((exam) => (
                          <div
                            key={exam.title}
                            className="flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2"
                          >
                            <div>
                              <div className="font-medium">{exam.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {exam.date}
                              </div>
                            </div>
                            <div className="text-xs font-semibold text-foreground">
                              {exam.score}
                            </div>
                          </div>
                        ))
                      : studentHistory.map((exam) => (
                          <div
                            key={`${exam.examId}-${exam.date}`}
                            className="flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2"
                          >
                            <div>
                              <div className="font-medium">Exam #{exam.examId.slice(-4)}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(exam.date)}
                              </div>
                            </div>
                            <div className="text-xs font-semibold text-foreground">
                              {exam.percentage}%
                            </div>
                          </div>
                        ))}
                  </div>
                </div>
                <div className={cardClass}>
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <svg
                      className="h-4 w-4 text-muted-foreground"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 8v4" />
                      <path d="M12 16h.01" />
                      <path d="M21 12a9 9 0 1 0-9 9" />
                    </svg>
                    AI Feedback
                  </h2>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Strong performance overall. Focus on time management and
                    check calculations on multi-step questions.
                  </p>
                  <div className="mt-4 rounded-xl border border-border bg-muted px-3 py-2 text-xs">
                    Average result: 85%
                  </div>
                </div>
              </section>
            )}

            {activeTab === "Settings" && (
              <section className="grid gap-4 lg:grid-cols-2">
                <div className={cardClass}>
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <svg
                      className="h-4 w-4 text-muted-foreground"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                    </svg>
                    Profile
                  </h2>
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <div>Name: {currentUser.username}</div>
                    <div>Plan: Student Pro</div>
                    <div>Notifications: Enabled</div>
                  </div>
                </div>
                <div className={cardClass}>
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <svg
                      className="h-4 w-4 text-muted-foreground"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 4v6h-6" />
                      <path d="M3 20v-6h6" />
                      <path d="M21 10a9 9 0 0 0-15.3-6.3L3 6" />
                      <path d="M3 18a9 9 0 0 0 15.3 2.3L21 18" />
                    </svg>
                    Preferences
                  </h2>
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <div>Auto-save: On</div>
                    <div>Exam reminders: On</div>
                    <div>Focus mode: Enabled</div>
                  </div>
                </div>
              </section>
            )}
            </div>
          </main>
        </div>
      )}

      {view === "exam" && (
        <div className="min-h-screen bg-background px-6 py-8 text-foreground">
          {warning && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-red-900/40 backdrop-blur-sm">
              <div className="rounded-2xl border border-red-400/40 bg-red-500/20 px-6 py-4 text-center text-sm font-semibold">
                {warning}
              </div>
            </div>
          )}
          <header className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
            <div className="font-semibold">
              {activeExam ? activeExam.title : "Exam Room"}
            </div>
            <div className="text-lg font-semibold">{formatTimer(timeLeft)}</div>
            <div className="text-sm text-muted-foreground">
              {currentQuestionIndex + 1}/{activeExam ? activeExam.questions.length || 1 : 1}
            </div>
            <div className="flex gap-2 text-xs">
              <span className="rounded-full border border-border bg-muted px-2 py-1 text-muted-foreground">
                Tab: {violations.tabSwitch}
              </span>
              <span className="rounded-full border border-border bg-muted px-2 py-1 text-muted-foreground">
                Copy: {violations.copyAttempt}
              </span>
            </div>
          </header>

          <div className="mx-auto mt-6 grid w-full max-w-5xl gap-4 lg:grid-cols-[1fr_140px]">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="text-lg font-semibold">
                {activeExam?.questions[currentQuestionIndex]
                  ? activeExam.questions[currentQuestionIndex].text
                  : "Асуулт хараахан алга"}
              </div>
              {activeExam?.questions[currentQuestionIndex]?.type === "open" ? (
                <textarea
                  className="mt-4 h-32 w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Хариултаа энд бичнэ үү"
                  value={
                    activeExam?.questions[currentQuestionIndex]
                      ? answers[activeExam.questions[currentQuestionIndex].id] || ""
                      : ""
                  }
                  onChange={(event) => updateAnswer(event.target.value)}
                />
              ) : activeExam?.questions[currentQuestionIndex]?.type === "mcq" ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {(activeExam.questions[currentQuestionIndex].options ?? []).map(
                    (option, idx) => {
                      const label = String.fromCharCode(65 + idx);
                      const currentAnswer =
                        answers[activeExam.questions[currentQuestionIndex].id] || "";
                      const isSelected = currentAnswer === option || currentAnswer === label;
                      return (
                        <button
                          key={`${label}-${option}`}
                          className={`rounded-xl border border-border px-4 py-3 text-left text-sm transition ${
                            isSelected
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                              : "bg-muted hover:bg-muted/70"
                          }`}
                          onClick={() => selectMcqAnswer(option)}
                        >
                          {label}. {option}
                        </button>
                      );
                    }
                  )}
                </div>
              ) : (
                <input
                  className="mt-4 w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Хариултаа бичнэ үү"
                  value={
                    activeExam?.questions[currentQuestionIndex]
                      ? answers[activeExam.questions[currentQuestionIndex].id] || ""
                      : ""
                  }
                  onChange={(event) => updateAnswer(event.target.value)}
                />
              )}
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="text-xs text-muted-foreground">Progress</div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {Array.from({ length: activeExam?.questions.length || 6 }).map(
                  (_, idx) => (
                    <button
                      key={idx}
                      className={`grid h-8 place-items-center rounded-lg border border-border text-xs ${
                        idx === currentQuestionIndex ? "bg-primary/10" : "bg-muted"
                      }`}
                      onClick={() => setCurrentQuestionIndex(idx)}
                    >
                      {idx + 1}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="mx-auto mt-6 flex w-full max-w-5xl flex-wrap justify-between gap-3">
            <button
              className="rounded-xl border border-border bg-muted px-4 py-2 text-sm transition hover:bg-muted/70"
              onClick={() => setView("dashboard")}
            >
              Exit
            </button>
            <div className="flex gap-2">
              <button
                className="rounded-xl border border-border bg-muted px-4 py-2 text-sm transition hover:bg-muted/70"
                onClick={goPrev}
                disabled={currentQuestionIndex === 0}
              >
                Өмнөх
              </button>
              <button
                className="rounded-xl border border-border bg-muted px-4 py-2 text-sm transition hover:bg-muted/70"
                onClick={goNext}
                disabled={
                  !activeExam ||
                  currentQuestionIndex >= activeExam.questions.length - 1
                }
              >
                Дараах
              </button>
              <button
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
                onClick={() => submitExam(false)}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {view === "result" && (
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Result Summary</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-muted p-4">
                <div className="text-xs text-muted-foreground">Score</div>
                <div className="mt-2 text-2xl font-semibold">
                  {lastSubmission?.percentage ?? 0}%
                </div>
              </div>
              <div className="rounded-xl border border-border bg-muted p-4">
                <div className="text-xs text-muted-foreground">Correct</div>
                <div className="mt-2 text-2xl font-semibold">
                  {lastSubmission?.score ?? 0}/{lastSubmission?.totalPoints ?? 0}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-semibold">Асуултын тайлан</h3>
              <div className="mt-3 space-y-2 text-sm">
                {answerReport.map((item, idx) => (
                  <div
                    key={item.question.id}
                    className="rounded-xl border border-border bg-muted px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <span>
                        {idx + 1}. {item.question.text}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          item.correct
                            ? "text-emerald-600 dark:text-emerald-300"
                            : "text-red-600 dark:text-red-300"
                        }`}
                      >
                        {item.correct ? "Зөв" : "Буруу"}
                      </span>
                    </div>
                    {!item.correct && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Зөв хариулт: {item.question.correctAnswer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <button
              className="mt-6 w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              onClick={() => setView("dashboard")}
            >
              Back to dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
