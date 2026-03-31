export type Question = {
  id: string;
  text: string;
  type: "text" | "open" | "mcq";
  options?: string[];
  correctAnswer: string;
  points: number;
  imageUrl?: string;
};

import type { NotificationItem as AppNotificationItem } from "@/lib/notifications";

export type Grade = "A" | "B" | "C" | "D" | "F";

export type StudentTab =
  | "Home"
  | "Exams"
  | "Progress"
  | "Profile"
  | "Settings"
  | "Help";

export type Exam = {
  id: string;
  title: string;
  teacherName?: string | null;
  description?: string | null;
  status?: string | null;
  sessionStatus?: string | null;
  entryStatus?: "on_time" | "late" | null;
  scheduledAt: string | null;
  examStartedAt?: string | null;
  finishedAt?: string | null;
  roomCode: string;
  requiresAudioRecording?: boolean;
  enabledCheatDetections?: string[];
  questions: Question[];
  duration?: number;
  locationPolicy?: "anywhere" | "school_only";
  locationLabel?: string | null;
  allowedRadiusMeters?: number | null;
  createdAt: string;
  notified?: boolean;
};

export type ViolationLog = {
  type: string;
  timestamp: string;
  source?: string;
};

export type Violations = {
  tabSwitch: number;
  windowBlur: number;
  copyAttempt: number;
  pasteAttempt: number;
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
  studentНэр: string;
  answers: { questionId: string; selectedAnswer: string; correct: boolean }[];
  score: number;
  totalPoints: number;
  percentage: number;
  terminated?: boolean;
  terminationReason?: string;
  violations?: Violations;
  submittedAt: string;
};

export type StudentProgress = {
  [studentId: string]: {
    xp: number;
    level: number;
    history: {
      examId: string;
      percentage: number;
      xp: number;
      date: string;
      score?: number;
      totalPoints?: number;
      grade?: Grade;
    }[];
  };
};

export type NotificationItem = AppNotificationItem;

export type ExamSession = {
  examId: string;
  studentId: string;
  answers: Record<string, string>;
  currentQuestionIndex: number;
  timeLeft: number;
  startedAt: string;
};

export type ExamAudioChunk = {
  id: string;
  sessionId: string;
  examId: string;
  studentId: string;
  objectKey: string;
  mimeType: string;
  sequenceNumber: number;
  chunkStartedAt: string;
  chunkEndedAt: string;
  uploadedAt: string;
  durationMs: number;
  sizeBytes: number;
  assetUrl: string;
};
