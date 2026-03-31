import { getSessionUser, type User } from "@/lib/examGuard";
import { getStoredRole, type RoleKey } from "@/lib/role-session";

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
  roleOverride?: RoleKey;
  user?: User | null;
  userIdOverride?: string;
};

export type ApiUserContext = {
  roleKey: RoleKey;
  userId: string;
  userRole: "teacher" | "student";
  userName: string;
};

export const unwrapApi = <T,>(value: ApiEnvelope<T> | T): T => {
  if (value && typeof value === "object" && "data" in value) {
    return (value as ApiEnvelope<T>).data as T;
  }
  return value as T;
};

export const getApiUserContext = (
  roleOverride?: RoleKey,
  userOverride?: User | null,
): ApiUserContext => {
  const roleKey = roleOverride ?? getStoredRole();
  const sessionUser = userOverride ?? getSessionUser();
  const user =
    sessionUser ??
    ({
      id: roleKey,
      username: roleKey === "teacher" ? "Ð‘Ð°Ð³Ñˆ" : "Ð¡ÑƒÑ€Ð°Ð³Ñ‡",
      role: roleKey,
    } as const);

  return {
    roleKey,
    userId: user.id,
    userRole: user.role,
    userName: user.username,
  };
};

const encodeHeaderValue = (value: string) => encodeURIComponent(value);

const buildHeaders = (
  headers: HeadersInit | undefined,
  user?: User | null,
  roleOverride?: RoleKey,
  userIdOverride?: string,
  body?: BodyInit | null,
) => {
  const context = getApiUserContext(roleOverride, user);
  const next = new Headers(headers);

  if (context) {
    next.set("x-user-id", userIdOverride ?? context.userId);
    next.set("x-user-role", context.userRole);
    next.set("x-user-name-encoded", encodeHeaderValue(context.userName));
  }

  if (
    body &&
    !(body instanceof FormData) &&
    !(body instanceof URLSearchParams) &&
    !next.has("Content-Type")
  ) {
    next.set("Content-Type", "application/json");
  }

  return next;
};

export const apiRequest = async <T,>(
  path: string,
  { user, roleOverride, userIdOverride, headers, ...init }: RequestOptions = {},
): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: buildHeaders(headers, user, roleOverride, userIdOverride, init.body),
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Network request failed";
    throw new Error(`API unreachable: ${message}`);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const json = (await response.json()) as ApiEnvelope<T> | T;
  return unwrapApi<T>(json);
};
