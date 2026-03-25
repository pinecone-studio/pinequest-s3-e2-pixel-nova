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
  log: [],
});

export const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const generateRoomCode = () =>
  Math.random()
    .toString(36)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);

const ROLE_KEY = "educoreRole";

const withRolePrefix = (key: string, roleOverride?: string) => {
  if (typeof window === "undefined") return key;
  const role = roleOverride ?? localStorage.getItem(ROLE_KEY);
  return role ? `${role}:${key}` : key;
};

export const getJSON = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(withRolePrefix(key));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const setJSON = (key: string, value: unknown): boolean => {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(withRolePrefix(key), JSON.stringify(value));
    return true;
  } catch (err) {
    console.error("localStorage quota error:", err);
    return false;
  }
};

export const getJSONForRole = <T,>(
  key: string,
  fallback: T,
  role: string,
): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(withRolePrefix(key, role));
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
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(withRolePrefix(key, role), JSON.stringify(value));
    return true;
  } catch (err) {
    console.error("localStorage quota error:", err);
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
  const userId = getJSON<string | null>(STORAGE_KEYS.sessionUserId, null);
  const role = getJSON<Role | null>(STORAGE_KEYS.sessionRole, null);
  if (!userId || !role) return null;
  const users = getJSON<User[]>(STORAGE_KEYS.users, []);
  return users.find((u) => u.id === userId && u.role === role) || null;
};

export const setSessionUser = (user: User) => {
  setJSON(STORAGE_KEYS.sessionUserId, user.id);
  setJSON(STORAGE_KEYS.sessionRole, user.role);
};

export const clearSession = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.sessionUserId);
  localStorage.removeItem(STORAGE_KEYS.sessionRole);
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
