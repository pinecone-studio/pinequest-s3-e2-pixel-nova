export type Role = "teacher" | "student";
export type QuestionType = "mcq" | "truefalse";
export type ExamStatus = "scheduled" | "active" | "finished";

export type User = {
  id: string;
  username: string;
  password: string;
  role: Role;
  createdAt: string;
};

export type Question = {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
  correctAnswer: string;
  points: number;
};

export type Exam = {
  id: string;
  title: string;
  roomCode: string;
  teacherId: string;
  scheduledAt: string | null;
  examStartedAt?: string | null;
  duration: number;
  questions: Question[];
  status: ExamStatus;
  createdAt: string;
  notified?: boolean;
};

export type ViolationLog = {
  type: string;
  timestamp: string;
  questionIndex?: number;
  timeSpent?: number;
};

export type Violations = {
  tabSwitch: number;
  windowBlur: number;
  copyAttempt: number;
  pasteAttempt: number;
  suspiciousSpeed: number;
  fullscreenExit: number;
  keyboardShortcut: number;
  idleTooLong?: number;
  rightClick?: number;
  suspiciousResize?: number;
  eventCount?: number;
  riskLevel?: "low" | "medium" | "high" | "critical";
  log: ViolationLog[];
};

export type Submission = {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  answers: { questionId: string; selectedAnswer: string; timeSpent: number }[];
  score: number;
  totalPoints: number;
  percentage: number;
  violations: Violations;
  terminated: boolean;
  submittedAt: string;
  xpEarned: number;
};

export type StudentProgress = {
  [studentId: string]: {
    xp: number;
    level: number;
    history: { examId: string; percentage: number; xp: number; date: string }[];
  };
};

export type NotificationItem = {
  examId: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export const STORAGE_KEYS = {
  users: "users",
  exams: "exams",
  submissions: "submissions",
  progress: "studentProgress",
  notifications: "notifications",
  sessionUserId: "sessionUserId",
  sessionRole: "sessionRole",
};

let inMemorySession: User | null = null;

export const LEVELS = [
  { level: 1, name: "Анхдагч", minXP: 0, icon: "🌱" },
  { level: 2, name: "Суралцагч", minXP: 200, icon: "📖" },
  { level: 3, name: "Дайчин", minXP: 500, icon: "⚔️" },
  { level: 4, name: "Мастер", minXP: 1000, icon: "🏆" },
  { level: 5, name: "Аварга", minXP: 2000, icon: "👑" },
  { level: 6, name: "Тэргүүн", minXP: 3500, icon: "💫" },
  { level: 7, name: "Домог", minXP: 5000, icon: "🔥" },
  { level: 8, name: "Од", minXP: 7000, icon: "🌟" },
  { level: 9, name: "Гайхамшиг", minXP: 9000, icon: "🛡️" },
  { level: 10, name: "Супер", minXP: 12000, icon: "🎮" },
];

export const defaultViolations = (): Violations => ({
  tabSwitch: 0,
  windowBlur: 0,
  copyAttempt: 0,
  pasteAttempt: 0,
  suspiciousSpeed: 0,
  fullscreenExit: 0,
  keyboardShortcut: 0,
  idleTooLong: 0,
  rightClick: 0,
  suspiciousResize: 0,
  eventCount: 0,
  riskLevel: "low",
  log: [],
});

export const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const generateRoomCode = () =>
  (() => {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const digits = "23456789";
    const nextLetters = Array.from({ length: 4 }, () =>
      letters[Math.floor(Math.random() * letters.length)],
    ).join("");
    const nextDigits = Array.from({ length: 2 }, () =>
      digits[Math.floor(Math.random() * digits.length)],
    ).join("");

    return `${nextLetters}${nextDigits}`;
  })();

const memoryStore = new Map<string, string>();

const withRolePrefix = (key: string, roleOverride?: string) =>
  roleOverride ? `${roleOverride}:${key}` : key;

export const getJSON = <T,>(key: string, fallback: T): T => {
  try {
    const raw = memoryStore.get(withRolePrefix(key));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const setJSON = (key: string, value: unknown): boolean => {
  try {
    memoryStore.set(withRolePrefix(key), JSON.stringify(value));
    return true;
  } catch (err) {
    console.error("memoryStore quota error:", err);
    return false;
  }
};

export const getJSONForRole = <T,>(
  key: string,
  fallback: T,
  role: string,
): T => {
  try {
    const raw = memoryStore.get(withRolePrefix(key, role));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const setJSONForRole = (
  key: string,
  value: unknown,
  role: string,
): boolean => {
  try {
    memoryStore.set(withRolePrefix(key, role), JSON.stringify(value));
    return true;
  } catch (err) {
    console.error("memoryStore quota error:", err);
    return false;
  }
};

export const calculateXP = (percentage: number) => {
  if (percentage >= 90) return 100;
  if (percentage >= 80) return 80;
  if (percentage >= 70) return 60;
  if (percentage >= 60) return 40;
  if (percentage >= 50) return 20;
  return 10;
};

export const getLevel = (xp: number) => {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.minXP) current = level;
  }
  return current;
};

export const ensureDemoAccounts = () => {
  const stored = getJSON<User[]>(STORAGE_KEYS.users, []);
  if (stored.length === 0) {
    const demo: User[] = [
      {
        id: generateId(),
        username: "teacher",
        password: "teacher123",
        role: "teacher",
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        username: "student",
        password: "student123",
        role: "student",
        createdAt: new Date().toISOString(),
      },
    ];
    setJSON(STORAGE_KEYS.users, demo);
  }
};

export const getSessionUser = () => {
  return inMemorySession;
};

export const setSessionUser = (user: User) => {
  inMemorySession = user;
};

export const clearSession = () => {
  inMemorySession = null;
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
