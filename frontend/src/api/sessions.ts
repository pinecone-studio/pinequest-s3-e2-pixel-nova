import type { User } from "@/lib/examGuard";
import { apiRequest } from "./client";

export const joinSession = (roomCode: string, user?: User | null) =>
  apiRequest("/api/sessions/join", {
    method: "POST",
    user,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ roomCode }),
  });

export const getSession = (sessionId: string, user?: User | null) =>
  apiRequest(`/api/sessions/${sessionId}`, { user });

export const startSession = (sessionId: string, user?: User | null) =>
  apiRequest(`/api/sessions/${sessionId}/start`, {
    method: "POST",
    user,
  });

export const submitSessionAnswer = (
  sessionId: string,
  payload: Record<string, unknown>,
  user?: User | null,
) =>
  apiRequest(`/api/sessions/${sessionId}/answer`, {
    method: "POST",
    user,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export const submitSession = (sessionId: string, user?: User | null) =>
  apiRequest(`/api/sessions/${sessionId}/submit`, {
    method: "POST",
    user,
  });

export const getSessionResult = (sessionId: string, user?: User | null) =>
  apiRequest(`/api/sessions/${sessionId}/result`, { user });

export const gradeSession = (sessionId: string, user?: User | null) =>
  apiRequest(`/api/sessions/${sessionId}/grade`, {
    method: "POST",
    user,
  });

export const gradeSessionManual = (
  sessionId: string,
  grades: Array<{ answerId: string; pointsEarned: number; isCorrect: boolean }>,
  user?: User | null,
) =>
  apiRequest(`/api/sessions/${sessionId}/grade-manual`, {
    method: "POST",
    user,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ grades }),
  });
