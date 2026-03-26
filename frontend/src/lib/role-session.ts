import type { AuthUser } from "@/lib/backend-auth";
import type { User } from "@/lib/examGuard";

export type RoleKey = "teacher" | "student";

let inMemoryRole: RoleKey = "student";
const inMemorySelectedUsers = new Map<RoleKey, string>();

export const getStoredRole = (): RoleKey => inMemoryRole;

export const setStoredRole = (role: RoleKey) => {
  inMemoryRole = role;
};

export const isTeacherRole = (role: RoleKey) => role === "teacher";

export const getRoleLabel = (role: RoleKey) =>
  role === "teacher" ? "Багш" : "Сурагч";

export const getLinkedTeacherRole = (role: RoleKey): RoleKey =>
  role === "student" ? "teacher" : role;

export const getStoredSelectedUserId = (role: RoleKey): string | null => {
  return inMemorySelectedUsers.get(role) ?? null;
};

export const setStoredSelectedUserId = (role: RoleKey, userId: string) => {
  inMemorySelectedUsers.set(role, userId);
};

export const getTeacherRoles = (): RoleKey[] => ["teacher"];

export const buildSessionUser = (user: AuthUser): User => ({
  id: user.id,
  username: user.fullName,
  password: "",
  role: user.role,
  createdAt: new Date().toISOString(),
});
