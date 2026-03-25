import type { AuthUser } from "@/lib/backend-auth";
import type { User } from "@/lib/examGuard";

export type RoleKey = "teacher" | "student";

const ROLE_KEY = "educoreRole";
const USER_KEY_PREFIX = "educoreSelectedUser";

export const getStoredRole = (): RoleKey => {
  if (typeof window === "undefined") return "student";
  const stored = window.localStorage.getItem(ROLE_KEY);
  return stored === "teacher" || stored === "student" ? stored : "student";
};

export const setStoredRole = (role: RoleKey) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROLE_KEY, role);
};

export const isTeacherRole = (role: RoleKey) => role === "teacher";

export const getRoleLabel = (role: RoleKey) =>
  role === "teacher" ? "Багш" : "Сурагч";

export const getLinkedTeacherRole = (role: RoleKey): RoleKey =>
  role === "student" ? "teacher" : role;

const getUserStorageKey = (role: RoleKey) => `${USER_KEY_PREFIX}:${role}`;

export const getStoredSelectedUserId = (role: RoleKey): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(getUserStorageKey(role));
};

export const setStoredSelectedUserId = (role: RoleKey, userId: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getUserStorageKey(role), userId);
};

export const getTeacherRoles = (): RoleKey[] => ["teacher"];

export const buildSessionUser = (user: AuthUser): User => ({
  id: user.id,
  username: user.fullName,
  password: "",
  role: user.role,
  createdAt: new Date().toISOString(),
});
