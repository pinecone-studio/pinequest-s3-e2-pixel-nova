import { getStoredRole, type RoleKey } from "@/lib/role-session";
import { getSessionUser } from "@/lib/examGuard";

const LOCAL_API_BASE_URL = "http://localhost:8787";
const DEPLOYED_API_BASE_URL = "https://backend.zbymba4.workers.dev";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const normalizePath = (path: string) => {
  if (isAbsoluteUrl(path)) return path;
  return `/${path.replace(/^\/+/, "")}`;
};

const shouldUseLocalApi = () => {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
};

export const getApiBaseUrl = () => {
  const envBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (envBaseUrl) return trimTrailingSlash(envBaseUrl);
  return shouldUseLocalApi() ? LOCAL_API_BASE_URL : DEPLOYED_API_BASE_URL;
};

export const API_BASE_URL = getApiBaseUrl();

export type ApiUserContext = {
  roleKey: RoleKey;
  userId: string;
  userRole: "teacher" | "student";
  userName: string;
};

type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
  };
  message?: string;
};

export const getApiUserContext = (roleOverride?: RoleKey): ApiUserContext => {
  const roleKey = roleOverride ?? getStoredRole();
  const sessionUser = getSessionUser();
  const user =
    sessionUser ??
    ({
      id: roleKey,
      username: roleKey === "teacher" ? "Багш" : "Сурагч",
      role: roleKey,
    } as const);

  return {
    roleKey,
    userId: user.id,
    userRole: user.role,
    userName: user.username,
  };
};

const buildApiUrl = (path: string) => {
  if (isAbsoluteUrl(path)) return path;
  return `${getApiBaseUrl()}${normalizePath(path)}`;
};

const buildHeaders = (
  headers: HeadersInit | undefined,
  body: BodyInit | null | undefined,
  roleOverride?: RoleKey,
) => {
  const { userId, userRole, userName } = getApiUserContext(roleOverride);
  const nextHeaders = new Headers(headers);

  nextHeaders.set("x-user-id", userId);
  nextHeaders.set("x-user-role", userRole);
  nextHeaders.set("x-user-name", userName);

  const hasBody = body !== undefined && body !== null;
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  if (hasBody && !isFormData && !nextHeaders.has("Content-Type")) {
    nextHeaders.set("Content-Type", "application/json");
  }

  return nextHeaders;
};

const readErrorMessage = async (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const payload = (await response.json()) as ApiErrorPayload;
      return (
        payload.error?.message ||
        payload.message ||
        `Request failed: ${response.status}`
      );
    } catch {
      return `Request failed: ${response.status}`;
    }
  }

  const text = await response.text();
  return text || `Request failed: ${response.status}`;
};

const readResponsePayload = async <T,>(response: Response): Promise<T> => {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();
    return text as T;
  }

  const text = await response.text();
  if (!text.trim()) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
};

export const apiFetch = async <T,>(
  path: string,
  options: RequestInit = {},
  roleOverride?: RoleKey,
): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(buildApiUrl(path), {
      ...options,
      headers: buildHeaders(options.headers, options.body, roleOverride),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown network error";
    throw new Error(`Failed to reach API: ${message}`);
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return readResponsePayload<T>(response);
};

export const unwrapApi = <T,>(payload: { data?: T } | T): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data?: T }).data ?? (payload as T);
  }
  return payload as T;
};
