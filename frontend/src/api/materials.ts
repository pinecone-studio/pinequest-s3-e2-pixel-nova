import type { User } from "@/lib/examGuard";
import { apiRequest } from "./client";

export const addExamMaterial = (
  examId: string,
  payload: Record<string, unknown>,
  user?: User | null,
) =>
  apiRequest(`/api/materials/${examId}`, {
    method: "POST",
    user,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export const getExamMaterials = (examId: string, user?: User | null) =>
  apiRequest(`/api/materials/${examId}`, { user });

export const deleteExamMaterial = (
  examId: string,
  materialId: string,
  user?: User | null,
) =>
  apiRequest(`/api/materials/${examId}/${materialId}`, {
    method: "DELETE",
    user,
  });
