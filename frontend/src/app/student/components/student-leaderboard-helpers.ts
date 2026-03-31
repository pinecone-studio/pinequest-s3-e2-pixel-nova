import type { XpLeaderboardEntry } from "@/api/xp";
import type {
  StudentImprovementLeaderboardEntry,
  StudentProgressLeaderboardEntry,
} from "@/lib/backend-auth";

export type LeaderboardEntry = StudentProgressLeaderboardEntry;

export type DisplayEntry = LeaderboardEntry & {
  metricPercent: number;
};

export type XpDisplayEntry = XpLeaderboardEntry & {
  metricPercent: number;
};

export type ImprovementDisplayEntry = StudentImprovementLeaderboardEntry & {
  metricPercent: number;
};

type ImprovementMockOptions = {
  entries: StudentImprovementLeaderboardEntry[];
  currentUserId: string | null;
  currentUserName: string;
};

export const avatarPool = ["🧑‍🎓", "👨‍🎓", "👩‍🎓", "👦", "👧", "🧠"];
const improvementMockNamePool = [
  "Тэмүүлэн",
  "Саруул",
  "Анударь",
  "Билгүүн",
  "Номин",
  "Мишээл",
  "Төгөлдөр",
  "Энэрэл",
  "Содбилэг",
  "Марал",
];

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

export const getAvatarSeed = (entry: { id: string; rank: number }) =>
  entry.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);

export const getAvatar = (entry: { id: string; rank: number }) =>
  avatarPool[(getAvatarSeed(entry) + entry.rank) % avatarPool.length];

export const getFirstName = (value: string) =>
  value.trim().split(/\s+/)[0] || value;

export const formatAverageScore = (value: number) => {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
};

const MIN_PERCENT = 55;
const MAX_PERCENT = 99;

const getBoundedPercent = (value: number, maxValue: number) =>
  Math.max(
    MIN_PERCENT,
    Math.min(MAX_PERCENT, Math.round((value / Math.max(maxValue, 1)) * 100)),
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
    metricPercent: getBoundedPercent(entry.averageScore, maxAverageScore),
  }));
};

export const buildClassEntries = (entries: XpLeaderboardEntry[]) => {
  const sortedEntries = [...entries].sort((left, right) => left.rank - right.rank);
  const maxXp = Math.max(...sortedEntries.map((entry) => entry.xp), 1);

  return sortedEntries.map((entry) => ({
    ...entry,
    metricPercent: getBoundedPercent(entry.xp, maxXp),
  }));
};

export const buildImprovementEntries = (
  entries: StudentImprovementLeaderboardEntry[],
) => {
  const sortedEntries = [...entries].sort((left, right) => left.rank - right.rank);
  const maxXp = Math.max(...sortedEntries.map((entry) => Math.max(entry.xp, 0)), 1);

  return sortedEntries.map((entry) => ({
    ...entry,
    metricPercent: getBoundedPercent(Math.max(entry.xp, 0), maxXp),
  }));
};

const MOCK_IMPROVEMENT_ROW_COUNT = 10;

const getMockImprovementXp = (rank: number) =>
  Math.max(6, 46 - (rank - 1) * 4);

const getMockImprovementLevel = (xp: number) =>
  Math.max(1, Math.floor(Math.max(xp, 0) / 20) + 1);

const getMockImprovementCount = (rank: number) =>
  Math.max(1, 4 - Math.floor((rank - 1) / 3));

export const buildMockImprovementEntries = ({
  entries,
  currentUserId,
  currentUserName,
}: ImprovementMockOptions) => {
  const realEntries = [...entries]
    .sort((left, right) => left.rank - right.rank)
    .slice(0, MOCK_IMPROVEMENT_ROW_COUNT);

  const usedIds = new Set(realEntries.map((entry) => entry.id));
  const filledEntries = [...realEntries];
  const currentUserExists = Boolean(
    currentUserId && realEntries.some((entry) => entry.id === currentUserId),
  );

  if (currentUserId && !currentUserExists) {
    usedIds.add(currentUserId);
    filledEntries.push({
      id: currentUserId,
      fullName: currentUserName,
      rank: Math.min(4, MOCK_IMPROVEMENT_ROW_COUNT),
      xp: getMockImprovementXp(4),
      level: getMockImprovementLevel(getMockImprovementXp(4)),
      examCount: 3,
      improvementCount: 2,
      missedCount: 0,
    });
  }

  let mockIndex = 0;
  while (filledEntries.length < MOCK_IMPROVEMENT_ROW_COUNT) {
    const rank = filledEntries.length + 1;
    const xp = getMockImprovementXp(rank);
    const id = `mock-improvement-${rank}`;

    if (usedIds.has(id)) {
      mockIndex += 1;
      continue;
    }

    filledEntries.push({
      id,
      fullName: improvementMockNamePool[mockIndex % improvementMockNamePool.length] ?? "Сурагч",
      rank,
      xp,
      level: getMockImprovementLevel(xp),
      examCount: Math.max(2, 5 - Math.floor((rank - 1) / 2)),
      improvementCount: getMockImprovementCount(rank),
      missedCount: rank >= 8 ? 1 : 0,
    });
    usedIds.add(id);
    mockIndex += 1;
  }

  const rankedEntries = filledEntries
    .slice(0, MOCK_IMPROVEMENT_ROW_COUNT)
    .sort((left, right) => {
      if (right.xp !== left.xp) {
        return right.xp - left.xp;
      }
      if (right.improvementCount !== left.improvementCount) {
        return right.improvementCount - left.improvementCount;
      }
      return left.fullName.localeCompare(right.fullName);
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  return buildImprovementEntries(rankedEntries);
};

export const getPodiumEntries = (entries: DisplayEntry[]) => {
  const second = entries.find((entry) => entry.rank === 2);
  const first = entries.find((entry) => entry.rank === 1);
  const third = entries.find((entry) => entry.rank === 3);
  return [second, first, third].filter(Boolean) as DisplayEntry[];
};
