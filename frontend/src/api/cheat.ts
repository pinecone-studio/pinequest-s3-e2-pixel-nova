import type { User } from "@/lib/examGuard";
import { apiRequest } from "./client";

export type CheatFlaggedStudent = {
  studentId: string;
  fullName: string;
  flagCount: number;
  eventCount: number;
};

export const reportCheatEvent = (
  payload: { sessionId: string; eventType: string; metadata?: string },
  user?: User | null,
) =>
  apiRequest("/api/cheat/event", {
    method: "POST",
    user,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export const getCheatEvents = (examId: string, user?: User | null) =>
  apiRequest(`/api/cheat/events/${examId}`, { user });

export const getStudentCheatEvents = (
  examId: string,
  studentId: string,
  user?: User | null,
) => apiRequest(`/api/cheat/events/${examId}/${studentId}`, { user });

export const getCheatFlaggedStudents = (examId: string, user?: User | null) =>
  apiRequest<CheatFlaggedStudent[]>(`/api/cheat/flagged/${examId}`, { user });

export const getCheatNotifications = (examId: string, user?: User | null) =>
  apiRequest(`/api/cheat/notifications/${examId}`, { user });

export const acknowledgeCheatNotifications = (
  examId: string,
  user?: User | null,
) =>
  apiRequest(`/api/cheat/notifications/${examId}/ack`, {
    method: "POST",
    user,
  });

export const disqualifySession = (
  sessionId: string,
  reason: string,
  user?: User | null,
) =>
  apiRequest(`/api/cheat/disqualify/${sessionId}`, {
    method: "POST",
    user,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });
