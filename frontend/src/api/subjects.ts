import type { User } from "@/lib/examGuard";
import { apiRequest } from "./client";

export const getSubjects = (user?: User | null) =>
  apiRequest("/api/subjects", { user });

export const createSubject = (payload: Record<string, unknown>, user?: User | null) =>
  apiRequest("/api/subjects", {
    method: "POST",
    user,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export const updateSubject = (
  id: string,
  payload: Record<string, unknown>,
  user?: User | null,
) =>
  apiRequest(`/api/subjects/${id}`, {
    method: "PUT",
    user,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export const deleteSubject = (id: string, user?: User | null) =>
  apiRequest(`/api/subjects/${id}`, {
    method: "DELETE",
    user,
  });
