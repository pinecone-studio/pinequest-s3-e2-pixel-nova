export type Question = {
  id: string;
  text: string;
  type: "text" | "open" | "mcq";
  options?: string[];
  correctAnswer: string;
  points: number;
  imageUrl?: string;
};

export type Exam = {
  id: string;
  title: string;
  scheduledAt: string | null;
  examStartedAt?: string | null;
  roomCode: string;
  expectedStudentsCount?: number;
  questions: Question[];
  duration?: number;
  createdAt: string;
  notified?: boolean;
};

export type TeacherStat = {
  label: string;
  value: string;
  trend: string;
  tone: "primary" | "success" | "warning" | "neutral";
};

export type Submission = {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  answers?: { questionId: string; selectedAnswer: string; correct: boolean }[];
  score: number;
  totalPoints: number;
  percentage: number;
  terminated?: boolean;
  terminationReason?: string;
  violations?: Partial<{
    tabSwitch: number;
    windowBlur: number;
    copyAttempt: number;
    pasteAttempt: number;
    fullscreenExit: number;
    keyboardShortcut: number;
  }>;
  submittedAt: string;
};

export type QuestionInsight = {
  id: string;
  text: string;
  correctCount: number;
  total: number;
  correctRate: number;
  missCount: number;
};

export type ScoreBand = {
  label: string;
  count: number;
  color: string;
};

export type ExamStatsSummary = {
  average: number;
  passRate: number;
  submissionCount: number;
  totalPoints: number;
  mostMissed: QuestionInsight[];
  mostCorrect: QuestionInsight[];
  questionStats: QuestionInsight[];
  scoreDistribution: { name: string; score: number }[];
  correctTotal: number;
  incorrectTotal: number;
  performanceBands: ScoreBand[];
};

export type NotificationItem = {
  examId: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type CheatStudent = {
  studentId?: string;
  id?: string;
  name: string;
  score: number;
  cheat: "Бага" | "Дунд" | "Өндөр";
  examTitle?: string;
  reason?: string;
  events?: number;
  flagCount?: number;
};

export type XpLeaderboardEntry = {
  studentId: string;
  name: string;
  xp: number;
  level: number;
  levelName: string;
  icon: string;
  examsTaken: number;
  progressPercent: number;
  nextLevelXp: number;
  lastActivity: string | null;
};
