import type { User } from "@/lib/examGuard";
import { apiRequest } from "./client";

export const getXpProfile = (user?: User | null) =>
  apiRequest<{
    id: string;
    fullName: string;
    xp: number;
    level: number;
    xpForNextLevel: number;
    xpProgress: number;
  }>("/api/xp/profile", { user });

export const getXpHistory = (user?: User | null) =>
  apiRequest("/api/xp/history", { user });

export const getXpLeaderboard = (user?: User | null) =>
  apiRequest<
    {
      rank: number;
      id: string;
      fullName: string;
      avatarUrl?: string | null;
      xp: number;
      level: number;
    }[]
  >("/api/xp/leaderboard", { user });
