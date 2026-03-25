import type { User } from "@/lib/examGuard";
import { apiRequest } from "./client";

export const getTeacherDashboardAnalytics = (user?: User | null) =>
  apiRequest("/api/analytics/dashboard", { user });

export const getExamQuestionAnalytics = (examId: string, user?: User | null) =>
  apiRequest(`/api/analytics/exam/${examId}/questions`, { user });

export const getExamSummaryAnalytics = (examId: string, user?: User | null) =>
  apiRequest(`/api/analytics/exam/${examId}/summary`, { user });
