import type {
  ActiveExamSession,
  AnswerValue,
  AuthUser,
  CheatEventType,
  JoinSessionResponse,
  SessionDetailResponse,
  SessionResultResponse,
  StudentExamHistoryItem,
  StudentProfile,
} from "@/types/student-app";
import type { SnapshotAnalysisResult } from "../proctoring";
import { getApiBaseUrl } from "../core/utils";

type ApiEnvelope<T> = {
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
};

type SubmitSessionResponse = {
  sessionId: string;
  status: string;
  submittedAt: string | null;
  score: number;
  totalPoints: number;
  earnedPoints: number;
  xpEarned?: number;
};

export type SnapshotUploadTicket = {
  assetUrl: string;
  expiresAt: string;
  objectKey: string;
  uploadHeaders: Record<string, string>;
  uploadUrl: string;
};

const API_BASE_URL = getApiBaseUrl();

const unwrapApi = <T>(payload: ApiEnvelope<T> | T): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiEnvelope<T>).data as T;
  }

  return payload as T;
};

const buildHeaders = (student?: AuthUser | null, headers?: HeadersInit) => {
  const next = new Headers(headers);

  if (student) {
    next.set("x-user-id", student.id);
    next.set("x-user-role", student.role);
    next.set("x-user-name-encoded", encodeURIComponent(student.fullName));
  }

  return next;
};

export const apiRequest = async <T>(
  path: string,
  options: RequestInit & { student?: AuthUser | null } = {},
) => {
  const { student, headers, ...rest } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: buildHeaders(student, headers),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as ApiEnvelope<T> | T;
  return unwrapApi(payload);
};

export const loginWithCode = async (code: string) =>
  apiRequest<AuthUser>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

export const getAuthUsers = async () =>
  apiRequest<AuthUser[]>("/api/auth/users");

export const getMe = async (student: AuthUser) =>
  apiRequest<AuthUser>("/api/auth/me", { student });

export const getStudentProfile = async (student: AuthUser) =>
  apiRequest<StudentProfile>("/api/student/profile", { student });

export const updateStudentProfile = async (
  student: AuthUser,
  payload: StudentProfile,
) =>
  apiRequest<StudentProfile>("/api/student/profile", {
    method: "PUT",
    student,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const getStudentExamHistory = async (student: AuthUser) => {
  const [sessions, results] = await Promise.all([
    apiRequest<
      {
        examId: string;
        title: string;
        sessionStatus: string;
        score: number | null;
        startedAt: string | null;
        submittedAt: string | null;
      }[]
    >("/api/student/exams", { student }),
    apiRequest<
      {
        sessionId: string;
        examId: string;
        title: string;
        score: number | null;
        totalPoints: number | null;
        earnedPoints: number | null;
        startedAt: string | null;
        submittedAt: string | null;
      }[]
    >("/api/student/results", { student }),
  ]);

  const resultByExamId = new Map(results.map((item) => [item.examId, item]));

  return sessions
    .map<StudentExamHistoryItem>((session) => {
      const result = resultByExamId.get(session.examId);
      return {
        sessionId:
          result?.sessionId ??
          `${session.examId}:${session.startedAt ?? "pending"}`,
        examId: session.examId,
        title: session.title,
        status: result ? "graded" : session.sessionStatus,
        score: result?.score ?? session.score ?? null,
        earnedPoints: result?.earnedPoints ?? null,
        totalPoints: result?.totalPoints ?? null,
        startedAt: result?.startedAt ?? session.startedAt ?? null,
        submittedAt: result?.submittedAt ?? session.submittedAt ?? null,
      };
    })
    .sort((left, right) => {
      const leftTime = new Date(
        left.submittedAt ?? left.startedAt ?? 0,
      ).getTime();
      const rightTime = new Date(
        right.submittedAt ?? right.startedAt ?? 0,
      ).getTime();
      return rightTime - leftTime;
    });
};

export const joinSession = async (student: AuthUser, roomCode: string) =>
  apiRequest<JoinSessionResponse>("/api/sessions/join", {
    method: "POST",
    student,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomCode }),
  });

export const getSessionDetail = async (student: AuthUser, sessionId: string) =>
  apiRequest<SessionDetailResponse>(`/api/sessions/${sessionId}`, { student });

export const startSession = async (student: AuthUser, sessionId: string) =>
  apiRequest<{ sessionId: string; status: string; startedAt: string }>(
    `/api/sessions/${sessionId}/start`,
    {
      method: "POST",
      student,
    },
  );

export const submitSessionAnswer = async (
  student: AuthUser,
  sessionId: string,
  questionId: string,
  answer: AnswerValue,
) =>
  apiRequest<{ answerId: string; updated: boolean }>(
    `/api/sessions/${sessionId}/answer`,
    {
      method: "POST",
      student,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId,
        selectedOptionId: answer.selectedOptionId ?? undefined,
        textAnswer: answer.textAnswer ?? undefined,
      }),
    },
  );

export const submitSession = async (student: AuthUser, sessionId: string) =>
  apiRequest<SubmitSessionResponse>(`/api/sessions/${sessionId}/submit`, {
    method: "POST",
    student,
  });

export const getSessionResult = async (student: AuthUser, sessionId: string) =>
  apiRequest<SessionResultResponse>(`/api/sessions/${sessionId}/result`, {
    student,
  });

export const reportCheatEvent = async (
  student: AuthUser,
  session: ActiveExamSession,
  eventType: CheatEventType,
  metadata?: string,
) =>
  apiRequest("/api/cheat/event", {
    method: "POST",
    student,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: session.sessionId,
      eventType,
      metadata,
    }),
  });

export const createCheatSnapshotUpload = async (
  student: AuthUser,
  sessionId: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp",
  capturedAt: string,
) =>
  apiRequest<SnapshotUploadTicket>("/api/cheat/snapshot-upload-url", {
    method: "POST",
    student,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      mimeType,
      capturedAt,
    }),
  });

export const uploadCheatSnapshot = async (
  uploadUrl: string,
  body: BodyInit,
  uploadHeaders: Record<string, string>,
) => {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: uploadHeaders,
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Snapshot upload failed: ${response.status}`);
  }
};

export const analyzeCheatSnapshot = async (
  student: AuthUser,
  sessionId: string,
  objectKey: string,
  capturedAt: string,
  imageUrl?: string,
) =>
  apiRequest<SnapshotAnalysisResult>("/api/cheat/analyze-snapshot", {
    method: "POST",
    student,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      objectKey,
      imageUrl,
      capturedAt,
    }),
  });
