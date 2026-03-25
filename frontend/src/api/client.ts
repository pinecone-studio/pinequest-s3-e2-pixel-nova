import { getSessionUser, type User } from "@/lib/examGuard";

const getApiBaseUrl = () => {
  // Build-time env var takes priority
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  // Runtime: if running in browser on a deployed domain, use the backend URL
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return "https://backend.zbymba4.workers.dev";
  }
  // Local dev fallback
  return "http://localhost:8787";
};

export const API_BASE_URL = getApiBaseUrl();

type ApiEnvelope<T> = {
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
};

type RequestOptions = RequestInit & {
  user?: User | null;
};

const unwrapResponse = <T,>(value: ApiEnvelope<T> | T): T => {
  if (value && typeof value === "object" && "data" in value) {
    return (value as ApiEnvelope<T>).data as T;
  }
  return value as T;
};

const buildHeaders = (headers: HeadersInit | undefined, user?: User | null) => {
  const resolvedUser = user ?? getSessionUser();
  const next = new Headers(headers);

  if (resolvedUser) {
    next.set("x-user-id", resolvedUser.id);
    next.set("x-user-role", resolvedUser.role);
  }

  return next;
};

export const apiRequest = async <T,>(
  path: string,
  { user, headers, ...init }: RequestOptions = {},
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(headers, user),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const json = (await response.json()) as ApiEnvelope<T> | T;
  return unwrapResponse<T>(json);
};
