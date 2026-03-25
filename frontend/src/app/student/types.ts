export type Question = {
  id: string;
  text: string;
  type: "text" | "open" | "mcq";
  options?: string[];
  correctAnswer: string;
  points: number;
  imageUrl?: string;
};

export type Grade = "A" | "B" | "C" | "D" | "F";

export type Exam = {
  id: string;
  title: string;
  scheduledAt: string | null;
  examStartedAt?: string | null;
  roomCode: string;
  questions: Question[];
  duration?: number;
  createdAt: string;
  notified?: boolean;
};

export type ViolationLog = {
  type: string;
  timestamp: string;
};

export type Violations = {
  tabSwitch: number;
  windowBlur: number;
  copyAttempt: number;
  pasteAttempt: number;
  fullscreenExit: number;
  keyboardShortcut: number;
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

export type NotificationItem = {
  examId: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type ExamSession = {
  examId: string;
  studentId: string;
  answers: Record<string, string>;
  currentQuestionIndex: number;
  timeLeft: number;
  startedAt: string;
};
