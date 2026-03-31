import type { User } from "@/lib/examGuard";
import { apiRequest } from "./client";

export type CheatFlaggedStudent = {
  sessionId: string;
  studentId: string;
  fullName: string;
  flagCount: number;
  eventCount: number;
  violationScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  lastViolationAt?: string | null;
  topViolationType?: string | null;
};

export type CheatEventPayload = {
  sessionId: string;
  eventType: string;
  source?: string;
  confidence?: number;
  details?: Record<string, string | number | boolean | null>;
  metadata?: string;
};

export const reportCheatEvent = (
  payload: CheatEventPayload,
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
