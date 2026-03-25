import { getStoredRole, type RoleKey } from "@/lib/role-session";
import { getSessionUser } from "@/lib/examGuard";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8787";

export type ApiUserContext = {
  roleKey: RoleKey;
  userId: string;
  userRole: "teacher" | "student";
  userName: string;
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

export const apiFetch = async <T,>(
  path: string,
  options: RequestInit = {},
  roleOverride?: RoleKey,
): Promise<T> => {
  const { userId, userRole, userName } = getApiUserContext(roleOverride);
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId,
      "x-user-role": userRole,
      "x-user-name": userName,
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return (await res.json()) as T;
};

export const unwrapApi = <T,>(payload: { data?: T } | T): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data?: T }).data ?? (payload as T);
  }
  return payload as T;
};
