export type Question = {
  id: string;
  text: string;
  type: "text" | "open" | "mcq";
  options?: string[];
  correctAnswer: string;
};

export type Exam = {
  id: string;
  title: string;
  scheduledAt: string | null;
  roomCode: string;
  questions: Question[];
  duration?: number;
  createdAt: string;
  notified?: boolean;
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
  violations?: {
    tabSwitch: number;
    windowBlur: number;
    copyAttempt: number;
    pasteAttempt: number;
    fullscreenExit: number;
    keyboardShortcut: number;
  };
  submittedAt: string;
};

export type NotificationItem = {
  examId: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type CheatStudent = {
  name: string;
  score: number;
  cheat: "Бага" | "Дунд" | "Өндөр";
};

export const mockStudents: CheatStudent[] = [
  { name: "Anu", score: 92, cheat: "Бага" },
  { name: "Baatar", score: 76, cheat: "Дунд" },
  { name: "Saraa", score: 63, cheat: "Өндөр" },
  { name: "Temuulen", score: 88, cheat: "Бага" },
];
