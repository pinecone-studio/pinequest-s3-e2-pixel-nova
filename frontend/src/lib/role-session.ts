import type { User } from "@/lib/examGuard";

export type RoleKey = "teacher-1" | "teacher-2" | "student-1" | "student-2";

const ROLE_KEY = "educoreRole";

export const getStoredRole = (): RoleKey => {
  if (typeof window === "undefined") return "student-1";
  const stored = window.localStorage.getItem(ROLE_KEY) as RoleKey | null;
  return stored ?? "student-1";
};

export const setStoredRole = (role: RoleKey) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROLE_KEY, role);
};

export const isTeacherRole = (role: RoleKey) => role.startsWith("teacher");

export const getRoleLabel = (role: RoleKey) => {
  switch (role) {
    case "teacher-1":
      return "Teacher-1";
    case "teacher-2":
      return "Teacher-2";
    case "student-1":
      return "Student-1";
    case "student-2":
      return "Student-2";
    default:
      return role;
  }
};

export const getLinkedTeacherRole = (role: RoleKey): RoleKey => {
  if (role === "student-1") return "teacher-1";
  if (role === "student-2") return "teacher-2";
  return role;
};

export const buildRoleUser = (role: RoleKey): User => {
  const isTeacher = role.startsWith("teacher");
  const suffix = role.endsWith("1") ? "1" : "2";
  return {
    id: role,
    username: `${isTeacher ? "Багш" : "Сурагч"}-${suffix}`,
    password: "",
    role: isTeacher ? "teacher" : "student",
    createdAt: new Date().toISOString(),
  };
};
