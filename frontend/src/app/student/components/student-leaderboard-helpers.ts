export type LeaderboardEntry = {
  id: string;
  fullName: string;
  xp: number;
  level: number;
  rank: number;
};

export type DisplayEntry = LeaderboardEntry & {
  metricValue: number;
  metricPercent: number;
  focusLabel: string;
};

export const avatarPool = ["🧑‍🎓", "👨‍🎓", "👩‍🎓", "👦", "👧", "🧠"];
export const subjectPool = ["Математик", "Англи хэл", "Физик", "Хими", "Түүх", "Биологи"];

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

export const formatCompactXp = (value: number) => {
  if (value >= 1000) {
    const compact = (value / 1000).toFixed(1);
    return `${compact.endsWith(".0") ? compact.slice(0, -2) : compact}k`;
  }

  return `${value}`;
};

const sortEntries = (entries: LeaderboardEntry[]) =>
  [...entries].sort((left, right) => left.rank - right.rank);

const MIN_PERCENT = 55;
const MAX_PERCENT = 99;

const getScorePercent = (value: number, maxXp: number) =>
  Math.max(
    MIN_PERCENT,
    Math.min(MAX_PERCENT, Math.round((value / Math.max(maxXp, 1)) * 100)),
  );

const withMetricPercent = (entries: Omit<DisplayEntry, "metricPercent">[]) => {
  const maxMetric = Math.max(...entries.map((entry) => entry.metricValue), 1);
  return entries.map((entry) => ({
    ...entry,
    metricPercent: getScorePercent(entry.metricValue, maxMetric),
  }));
};

export const buildClassEntries = (entries: LeaderboardEntry[]) =>
  withMetricPercent(
    sortEntries(entries).map((entry) => ({
      ...entry,
      metricValue: entry.xp,
      focusLabel: "10-р анги",
    })),
  );

export const buildSubjectEntries = (entries: LeaderboardEntry[]) =>
  withMetricPercent(
    sortEntries(entries)
      .map((entry) => {
        const seed = getAvatarSeed(entry);
        const multiplier = 0.72 + ((seed % 26) + 8) / 100;

        return {
          ...entry,
          metricValue: Math.round(entry.xp * multiplier),
          focusLabel: subjectPool[seed % subjectPool.length],
        };
      })
      .sort((left, right) => {
        const metricDiff = right.metricValue - left.metricValue;
        if (metricDiff !== 0) return metricDiff;
        return left.fullName.localeCompare(right.fullName);
      })
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      })),
  );

export const getPodiumEntries = (entries: DisplayEntry[]) => {
  const second = entries.find((entry) => entry.rank === 2);
  const first = entries.find((entry) => entry.rank === 1);
  const third = entries.find((entry) => entry.rank === 3);
  return [second, first, third].filter(Boolean) as DisplayEntry[];
};
