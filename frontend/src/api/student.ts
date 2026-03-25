import type { User } from "@/lib/examGuard";
import { apiRequest } from "./client";

export type StudentProfile = {
  id?: string;
  code?: string;
  fullName: string;
  email?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  school?: string | null;
  grade?: string | null;
  bio?: string | null;
  xp?: number;
  level?: number;
};

export type StudentExamSummary = {
  examId: string;
  title: string;
  sessionStatus?: string | null;
  score?: number | null;
  startedAt?: string | null;
  submittedAt?: string | null;
};

export type StudentResultSummary = {
  sessionId: string;
  examId: string;
  title: string;
  score: number | null;
  totalPoints: number | null;
  earnedPoints: number | null;
  submittedAt: string | null;
};

export type StudentResultDetail = StudentResultSummary & {
  description?: string | null;
  startedAt?: string | null;
  answers: {
    questionText: string;
    selectedAnswer: string | null;
    correctAnswer: string | null;
    isCorrect: boolean | null;
    points: number | null;
    pointsEarned: number | null;
  }[];
};

export const getStudentExams = (user?: User | null) =>
  apiRequest<StudentExamSummary[]>("/api/student/exams", { user });

export const getStudentResults = (user?: User | null) =>
  apiRequest<StudentResultSummary[]>("/api/student/results", { user });

export const getStudentResult = (sessionId: string, user?: User | null) =>
  apiRequest<StudentResultDetail>(`/api/student/results/${sessionId}`, { user });

export const getStudentProfile = (user?: User | null) =>
  apiRequest<StudentProfile>("/api/student/profile", { user });

export const updateStudentProfile = (
  payload: StudentProfile,
  user?: User | null,
) =>
  apiRequest<StudentProfile>("/api/student/profile", {
    method: "PUT",
    user,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
