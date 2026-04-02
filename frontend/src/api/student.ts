import type { User } from "@/lib/examGuard";
import { apiRequest } from "./client";
import type { XpLeaderboardEntry } from "./xp";

export type StudentProfile = {
  id?: string;
  code?: string;
  fullName: string;
  email?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  school?: string | null;
  grade?: string | null;
  groupName?: string | null;
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
    topic?: string | null;
    questionText: string;
    selectedAnswer: string | null;
    correctAnswer: string | null;
    isCorrect: boolean | null;
    points: number | null;
    pointsEarned: number | null;
  }[];
};

export type StudentTermRankOverview = {
  rank: number | null;
  totalStudents: number;
  termExamCount: number;
  xp: number;
  level: number;
};

export type StudentProgressRankOverview = {
  rank: number | null;
  totalStudents: number;
  progressExamCount: number;
  xp: number;
  level: number;
  isPrivate: boolean;
};

export type StudentProgressLeaderboardEntry = {
  id: string;
  fullName: string;
  level: number;
  rank: number;
  averageScore: number;
  examCount: number;
};

export type StudentImprovementLeaderboardEntry = {
  id: string;
  fullName: string;
  level: number;
  rank: number;
  xp: number;
  examCount: number;
  improvementCount: number;
  missedCount: number;
};

export const getStudentExams = (user?: User | null) =>
  apiRequest<StudentExamSummary[]>("/api/student/exams", { user });

export const getStudentResults = (user?: User | null) =>
  apiRequest<StudentResultSummary[]>("/api/student/results", { user });

export const getStudentResult = (sessionId: string, user?: User | null) =>
  apiRequest<StudentResultDetail>(`/api/student/results/${sessionId}`, { user });

export const getStudentProfile = (user?: User | null) =>
  apiRequest<StudentProfile>("/api/student/profile", { user });

export const getStudentTermRank = (user?: User | null) =>
  apiRequest<StudentTermRankOverview>("/api/student/term-rank", { user });

export const getStudentTermLeaderboard = (user?: User | null) =>
  apiRequest<XpLeaderboardEntry[]>("/api/student/term-leaderboard", { user });

export const getStudentProgressRank = (user?: User | null) =>
  apiRequest<StudentProgressRankOverview>("/api/student/progress-rank", { user });

export const getStudentProgressLeaderboard = (user?: User | null) =>
  apiRequest<StudentProgressLeaderboardEntry[]>(
    "/api/student/progress-leaderboard",
    { user },
  );

export const getStudentImprovementLeaderboard = (user?: User | null) =>
  apiRequest<StudentImprovementLeaderboardEntry[]>(
    "/api/student/improvement-leaderboard",
    { user },
  );

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
