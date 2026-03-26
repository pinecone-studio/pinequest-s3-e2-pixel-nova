import type {
  ActiveExamSession,
  AnswerValue,
  AuthUser,
  CheatEventType,
  JoinSessionResponse,
  SessionDetailResponse,
  SessionResultResponse,
  StudentProfile,
} from './types';
import { getApiBaseUrl } from './utils';

type ApiEnvelope<T> = {
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
};

const API_BASE_URL = getApiBaseUrl();

const unwrapApi = <T,>(payload: ApiEnvelope<T> | T): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data as T;
  }
  return payload as T;
};

const buildHeaders = (student?: AuthUser | null, headers?: HeadersInit) => {
  const next = new Headers(headers);

  if (student) {
    next.set('x-user-id', student.id);
    next.set('x-user-role', student.role);
  }

  return next;
};

export const apiRequest = async <T,>(
  path: string,
  options: RequestInit & { student?: AuthUser | null } = {}
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
  apiRequest<AuthUser>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

export const getMe = async (student: AuthUser) =>
  apiRequest<AuthUser>('/api/auth/me', { student });

export const getStudentProfile = async (student: AuthUser) =>
  apiRequest<StudentProfile>('/api/student/profile', { student });

export const updateStudentProfile = async (
  student: AuthUser,
  payload: StudentProfile
) =>
  apiRequest<StudentProfile>('/api/student/profile', {
    method: 'PUT',
    student,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

export const joinSession = async (student: AuthUser, roomCode: string) =>
  apiRequest<JoinSessionResponse>('/api/sessions/join', {
    method: 'POST',
    student,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomCode }),
  });

export const getSessionDetail = async (student: AuthUser, sessionId: string) =>
  apiRequest<SessionDetailResponse>(`/api/sessions/${sessionId}`, { student });

export const startSession = async (student: AuthUser, sessionId: string) =>
  apiRequest(`/api/sessions/${sessionId}/start`, {
    method: 'POST',
    student,
  });

export const submitSessionAnswer = async (
  student: AuthUser,
  sessionId: string,
  questionId: string,
  answer: AnswerValue
) =>
  apiRequest(`/api/sessions/${sessionId}/answer`, {
    method: 'POST',
    student,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      questionId,
      selectedOptionId: answer.selectedOptionId ?? undefined,
      textAnswer: answer.textAnswer ?? undefined,
    }),
  });

export const submitSession = async (student: AuthUser, sessionId: string) =>
  apiRequest(`/api/sessions/${sessionId}/submit`, {
    method: 'POST',
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
  metadata?: string
) =>
  apiRequest('/api/cheat/event', {
    method: 'POST',
    student,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: session.sessionId,
      eventType,
      metadata,
    }),
  });
