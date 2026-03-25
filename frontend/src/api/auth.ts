import { apiRequest } from "./client";

export type AuthRole = "teacher" | "student";

export type AuthUser = {
  id: string;
  code?: string;
  fullName: string;
  email?: string | null;
  avatarUrl?: string | null;
  role: AuthRole;
  xp?: number;
  level?: number;
};

export const getAuthUsers = () => apiRequest<AuthUser[]>("/api/auth/users");

export const loginWithCode = (code: string) =>
  apiRequest<AuthUser>("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });

export const getMe = () => apiRequest<AuthUser>("/api/auth/me");
