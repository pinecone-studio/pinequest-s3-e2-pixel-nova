import type { NotificationItem as AppNotificationItem } from "@/lib/notifications";

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
  status?: string;
  description?: string | null;
  examType?: string | null;
  className?: string | null;
  groupName?: string | null;
  scheduledAt: string | null;
  examStartedAt?: string | null;
  finishedAt?: string | null;
  roomCode: string;
  expectedStudentsCount?: number;
  questionCount?: number;
  submissionCount?: number;
  enabledCheatDetections?: string[];
  questions: Question[];
  duration?: number;
  locationPolicy?: "anywhere" | "school_only";
  locationLabel?: string | null;
  locationLatitude?: number | null;
  locationLongitude?: number | null;
  allowedRadiusMeters?: number | null;
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
  isFlagged?: boolean;
  flagCount?: number;
  violationScore?: number;
  riskLevel?: "low" | "medium" | "high" | "critical";
  lastViolationAt?: string | null;
  topViolationType?: string | null;
  eventCount?: number;
  latestEvent?: {
    createdAt: string;
    eventSource: string | null;
    eventType: string;
    label: string;
    severity: string;
  } | null;
  countByType?: Record<string, number>;
};

export type QuestionInsight = {
  id: string;
  text: string;
  correctCount: number;
  total: number;
  correctRate: number;
  missCount: number;
  skippedCount: number;
  topWrongAnswer: string | null;
  topWrongAnswerCount: number;
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

export type ExamAttendanceStats = {
  expected: number;
  joined: number;
  submitted: number;
  attendance_rate: number;
  submission_rate: number;
};

export type NotificationItem = AppNotificationItem;

export type CheatStudent = {
  studentId?: string;
  sessionId?: string;
  id?: string;
  name: string;
  score: number;
  cheat: "Бага" | "Дунд" | "Өндөр";
  examTitle?: string;
  reason?: string;
  events?: number;
  flagCount?: number;
  violationScore?: number;
  riskLevel?: "low" | "medium" | "high" | "critical";
  lastViolationAt?: string | null;
  topViolationType?: string | null;
  latestEventLabel?: string | null;
  countByType?: Record<string, number>;
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

export type ExamRosterParticipant = {
  sessionId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  status: string;
  answeredCount: number;
  totalQuestions: number;
  progressPercent: number;
  submittedAt: string | null;
  startedAt: string | null;
  flagCount: number;
  isFlagged: boolean;
  violationScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  lastViolationAt: string | null;
  topViolationType: string | null;
  eventCount: number;
  latestEvent: {
    createdAt: string;
    eventSource: string | null;
    eventType: string;
    label: string;
    severity: string;
  } | null;
  countByType: Record<string, number>;
  score: number | null;
  joinLocationStatus?: string | null;
  joinDistanceMeters?: number | null;
  joinLocationCheckedAt?: string | null;
};

export type ExamRosterDetail = {
  examId: string;
  title: string;
  roomCode: string;
  durationMin: number;
  expectedStudentsCount: number;
  scheduledAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  participants: ExamRosterParticipant[];
};

export type AiExamGeneratorInput = {
  topic: string;
  subject?: string;
  gradeOrClass?: string;
  difficulty: "easy" | "medium" | "hard";
  questionCount: number;
  instructions?: string;
};

export type AiGeneratedDraft = {
  title: string;
  description: string | null;
  questions: Question[];
};

export type AiAcceptedDraftResponse = {
  id: string;
  status: "accepted";
};
