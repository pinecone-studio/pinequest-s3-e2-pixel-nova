import type { User } from "@/lib/examGuard";
import { apiRequest } from "./client";
import type { StudentProfile } from "./student";

export type TeacherSubmissionSummary = {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  score: number | null;
  totalPoints: number | null;
  percentage?: number | null;
  submittedAt: string | null;
  isFlagged?: boolean | null;
  flagCount?: number | null;
  violationScore?: number | null;
  riskLevel?: "low" | "medium" | "high" | "critical" | null;
  lastViolationAt?: string | null;
  topViolationType?: string | null;
  eventCount?: number | null;
  latestEvent?: {
    createdAt: string;
    eventSource: string | null;
    eventType: string;
    label: string;
    severity: string;
  } | null;
  countByType?: Record<string, number>;
};

export type TeacherSessionResult = {
  sessionId: string;
  examId: string;
  title: string;
  score: number | null;
  totalPoints: number | null;
  earnedPoints?: number | null;
  submittedAt: string | null;
  student?: {
    id: string;
    fullName: string;
    email?: string | null;
    avatarUrl?: string | null;
  } | null;
  answers: {
    questionId: string;
    questionText: string;
    questionType: string;
    correctAnswerText?: string | null;
    selectedOptionId?: string | null;
    textAnswer?: string | null;
    isCorrect?: boolean | null;
    pointsEarned?: number | null;
    options?: { id: string; label: string; text: string; isCorrect: boolean }[];
  }[];
};

export const getStudentProfileForTeacher = (
  studentId: string,
  user?: User | null,
) =>
  apiRequest<StudentProfile>(`/api/teacher/students/${studentId}/profile`, {
    user,
  });

export const getTeacherExamSubmissions = (examId: string, user?: User | null) =>
  apiRequest<TeacherSubmissionSummary[]>(
    `/api/teacher/exams/${examId}/submissions`,
    { user },
  );

export const getTeacherSessionResult = (
  sessionId: string,
  user?: User | null,
) =>
  apiRequest<TeacherSessionResult>(`/api/teacher/sessions/${sessionId}/result`, {
    user,
  });
