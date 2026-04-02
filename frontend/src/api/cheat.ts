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

export type AudioChunkUploadPayload = {
  sessionId: string;
  mimeType: string;
  sequenceNumber: number;
  chunkStartedAt: string;
  chunkEndedAt: string;
  durationMs: number;
  sizeBytes: number;
};

export type AudioChunkFinalizePayload = AudioChunkUploadPayload & {
  objectKey: string;
};

export type AudioChunkUploadResponse = {
  expiresAt: string;
  objectKey: string;
  uploadHeaders: Record<string, string>;
  uploadUrl: string;
};

export type CheatEventRecord = {
  id: string;
  sessionId: string;
  examId: string;
  studentId: string;
  eventType: string;
  eventSource?: string | null;
  confidence?: number | null;
  details?: Record<string, string | number | boolean | null> | string | null;
  metadata?: Record<string, unknown> | string | null;
  createdAt: string;
};

export type ExamAudioChunk = {
  id: string;
  sessionId: string;
  examId: string;
  studentId: string;
  objectKey: string;
  mimeType: string;
  sequenceNumber: number;
  chunkStartedAt: string;
  chunkEndedAt: string;
  uploadedAt: string;
  durationMs: number;
  sizeBytes: number;
  assetUrl: string;
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

export const createAudioUploadUrl = (
  payload: AudioChunkUploadPayload,
  user?: User | null,
) =>
  apiRequest<AudioChunkUploadResponse>("/api/cheat/audio-upload-url", {
    method: "POST",
    user,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export const finalizeAudioUpload = (
  payload: AudioChunkFinalizePayload,
  user?: User | null,
) =>
  apiRequest<ExamAudioChunk>("/api/cheat/audio-chunks", {
    method: "POST",
    user,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export const getExamAudioChunks = (sessionId: string, user?: User | null) =>
  apiRequest<ExamAudioChunk[]>(`/api/cheat/audio-chunks/${sessionId}`, { user });

export const getCheatEvents = (examId: string, user?: User | null) =>
  apiRequest(`/api/cheat/events/${examId}`, { user });

export const getStudentCheatEvents = (
  examId: string,
  studentId: string,
  user?: User | null,
) => apiRequest<CheatEventRecord[]>(`/api/cheat/events/${examId}/${studentId}`, { user });

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

export const warnStudentSession = (
  sessionId: string,
  message: string,
  user?: User | null,
) =>
  apiRequest<{ eventId: string }>(`/api/cheat/warn/${sessionId}`, {
    method: "POST",
    user,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });
