import type { User } from "@/lib/examGuard";
import { apiRequest } from "./client";

export type XpProfile = {
  id: string;
  fullName: string;
  xp: number;
  level: number;
  xpForNextLevel: number;
  xpProgress: number;
  rank: number | null;
  totalStudents: number;
};

export type XpActivity = {
  referenceId: string;
  examId: string | null;
  examTitle: string;
  totalXp: number;
  awardedAt: string;
  reasons: {
    reason: string;
    amount: number;
  }[];
};

export type XpLeaderboardEntry = {
  rank: number;
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  xp: number;
  level: number;
};

export type XpNeighborEntry = XpLeaderboardEntry & {
  isCurrentUser: boolean;
};

export const getXpProfile = (user?: User | null) =>
  apiRequest<XpProfile>("/api/xp/profile", { user });

export const getXpHistory = (user?: User | null) =>
  apiRequest<XpActivity[]>("/api/xp/history", { user });

export const getXpLeaderboard = (user?: User | null) =>
  apiRequest<XpLeaderboardEntry[]>("/api/xp/leaderboard", { user });

export const getXpNeighbors = (user?: User | null) =>
  apiRequest<XpNeighborEntry[]>("/api/xp/neighbors", { user });
