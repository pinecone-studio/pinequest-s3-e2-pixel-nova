import { getStoredRole, type RoleKey } from "@/lib/role-session";
import { getSessionUser } from "@/lib/examGuard";

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return "https://backend.zbymba4.workers.dev";
  }
  return "http://localhost:8787";
};

export const API_BASE_URL = getApiBaseUrl();

const readErrorMessage = async (res: Response) => {
  try {
    const payload = (await res.json()) as
      | { error?: { message?: string }; message?: string }
      | undefined;
    return (
      payload?.error?.message ||
      payload?.message ||
      `Request failed: ${res.status}`
    );
  } catch {
    const text = await res.text();
    return text || `Request failed: ${res.status}`;
  }
};

export type ApiUserContext = {
  roleKey: RoleKey;
  userId: string;
  userRole: "teacher" | "student";
  userName: string;
};

const encodeHeaderValue = (value: string) => encodeURIComponent(value);

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

export const apiFetch = async <T>(
  path: string,
  options: RequestInit = {},
  roleOverride?: RoleKey,
): Promise<T> => {
  const { userId, userRole, userName } = getApiUserContext(roleOverride);
  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");
  headers.set("x-user-id", userId);
  headers.set("x-user-role", userRole);
  headers.set("x-user-name-encoded", encodeHeaderValue(userName));

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }

  return (await res.json()) as T;
};

export const unwrapApi = <T>(payload: { data?: T } | T): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data?: T }).data ?? (payload as T);
  }
  return payload as T;
};
