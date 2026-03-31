import type { StudentProgressLeaderboardEntry } from "@/lib/backend-auth";

export type LeaderboardEntry = StudentProgressLeaderboardEntry;

export type DisplayEntry = LeaderboardEntry & {
  metricPercent: number;
};

export const avatarPool = ["🧑‍🎓", "👨‍🎓", "👩‍🎓", "👦", "👧", "🧠"];

export const podiumStyles = {
  1: {
    shell: "border-[#ffd772] bg-[#fff8e7]",
    block: "bg-gradient-to-b from-[#ffc94f] to-[#f2a91d] text-white",
    avatar: "border-[#f4be3d] bg-[#fff6d9]",
    icon: "crown",
    iconTone: "bg-[#fff1bf] text-[#c68a08]",
    height: "h-[150px]",
  },
  2: {
    shell: "border-[#cfd8f3] bg-[#f7f9ff]",
    block: "bg-gradient-to-b from-[#cfd7ea] to-[#9aa8c0] text-white",
    avatar: "border-[#bfc9e7] bg-[#f8faff]",
    icon: "trophy",
    iconTone: "bg-[#eef2ff] text-[#6a74a2]",
    height: "h-[112px]",
  },
  3: {
    shell: "border-[#f2b05d] bg-[#fff7ef]",
    block: "bg-gradient-to-b from-[#f0a44e] to-[#c45d1d] text-white",
    avatar: "border-[#e89f4c] bg-[#fff7ef]",
    icon: "medal",
    iconTone: "bg-[#fff0df] text-[#cf7c23]",
    height: "h-[96px]",
  },
} as const;

export type PodiumIconKey = (typeof podiumStyles)[1]["icon"];

export const getAvatarSeed = (entry: LeaderboardEntry) =>
  entry.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);

export const getAvatar = (entry: LeaderboardEntry) =>
  avatarPool[(getAvatarSeed(entry) + entry.rank) % avatarPool.length];

export const getFirstName = (value: string) =>
  value.trim().split(/\s+/)[0] || value;

export const formatAverageScore = (value: number) => {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
};

const MIN_PERCENT = 55;
const MAX_PERCENT = 99;

const getScorePercent = (value: number, maxScore: number) =>
  Math.max(
    MIN_PERCENT,
    Math.min(MAX_PERCENT, Math.round((value / Math.max(maxScore, 1)) * 100)),
  );

export const buildProgressLeaderboardEntries = (
  entries: StudentProgressLeaderboardEntry[],
) => {
  const sortedEntries = [...entries].sort((left, right) => left.rank - right.rank);
  const maxAverageScore = Math.max(
    ...sortedEntries.map((entry) => entry.averageScore),
    1,
  );

  return sortedEntries.map((entry) => ({
    ...entry,
    metricPercent: getScorePercent(entry.averageScore, maxAverageScore),
  }));
};

export const getPodiumEntries = (entries: DisplayEntry[]) => {
  const second = entries.find((entry) => entry.rank === 2);
  const first = entries.find((entry) => entry.rank === 1);
  const third = entries.find((entry) => entry.rank === 3);
  return [second, first, third].filter(Boolean) as DisplayEntry[];
};
