import type { User } from "@/lib/examGuard";
import { apiRequest } from "./client";

export const saveExamForStudent = (examId: string, user?: User | null) =>
  apiRequest(`/api/saved/${examId}`, {
    method: "POST",
    user,
  });

export const unsaveExamForStudent = (examId: string, user?: User | null) =>
  apiRequest(`/api/saved/${examId}`, {
    method: "DELETE",
    user,
  });

export const getSavedExams = (user?: User | null) =>
  apiRequest("/api/saved", { user });
