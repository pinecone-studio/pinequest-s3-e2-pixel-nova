import { useMemo, useState } from "react";
import { Crown, Medal, Sparkles, Trophy, Zap } from "lucide-react";

type StudentLeaderboardTabProps = {
  currentUserId: string;
  entries: {
    id: string;
    fullName: string;
    xp: number;
    level: number;
    rank: number;
  }[];
};

type LeaderboardEntry = StudentLeaderboardTabProps["entries"][number];
type LeaderboardMode = "class" | "subject";
type DisplayEntry = LeaderboardEntry & {
  metricValue: number;
  metricPercent: number;
  focusLabel: string;
};

const avatarPool = ["🧑‍🎓", "👨‍🎓", "👩‍🎓", "👦", "👧", "🧠"];
const subjectPool = ["Математик", "Англи хэл", "Физик", "Хими", "Түүх", "Биологи"];

const podiumStyles = {
  1: {
    shell: "border-[#ffd772] bg-[#fff8e7]",
    block: "bg-gradient-to-b from-[#ffc94f] to-[#f2a91d] text-white",
    avatar: "border-[#f4be3d] bg-[#fff6d9]",
    icon: <Crown className="h-4 w-4" />,
    iconTone: "bg-[#fff1bf] text-[#c68a08]",
    height: "h-[150px]",
  },
  2: {
    shell: "border-[#cfd8f3] bg-[#f7f9ff]",
    block: "bg-gradient-to-b from-[#cfd7ea] to-[#9aa8c0] text-white",
    avatar: "border-[#bfc9e7] bg-[#f8faff]",
    icon: <Trophy className="h-4 w-4" />,
    iconTone: "bg-[#eef2ff] text-[#6a74a2]",
    height: "h-[112px]",
  },
  3: {
    shell: "border-[#f2b05d] bg-[#fff7ef]",
    block: "bg-gradient-to-b from-[#f0a44e] to-[#c45d1d] text-white",
    avatar: "border-[#e89f4c] bg-[#fff7ef]",
    icon: <Medal className="h-4 w-4" />,
    iconTone: "bg-[#fff0df] text-[#cf7c23]",
    height: "h-[96px]",
  },
} as const;

const getAvatarSeed = (entry: LeaderboardEntry) =>
  entry.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);

const getAvatar = (entry: LeaderboardEntry) =>
  avatarPool[(getAvatarSeed(entry) + entry.rank) % avatarPool.length];

const getFirstName = (value: string) => value.trim().split(/\s+/)[0] || value;

const formatCompactXp = (value: number) => {
  if (value >= 1000) {
    const compact = (value / 1000).toFixed(1);
    return `${compact.endsWith(".0") ? compact.slice(0, -2) : compact}k`;
  }

  return `${value}`;
};

const sortEntries = (entries: LeaderboardEntry[]) =>
  [...entries].sort((left, right) => left.rank - right.rank);

const getScorePercent = (value: number, maxXp: number) =>
  Math.max(55, Math.min(99, Math.round((value / Math.max(maxXp, 1)) * 100)));

const withMetricPercent = (entries: Omit<DisplayEntry, "metricPercent">[]) => {
  const maxMetric = Math.max(...entries.map((entry) => entry.metricValue), 1);
  return entries.map((entry) => ({
    ...entry,
    metricPercent: getScorePercent(entry.metricValue, maxMetric),
  }));
};

const buildClassEntries = (entries: LeaderboardEntry[]) =>
  withMetricPercent(
    sortEntries(entries).map((entry) => ({
      ...entry,
      metricValue: entry.xp,
      focusLabel: "10-р анги",
    })),
  );

const buildSubjectEntries = (entries: LeaderboardEntry[]) =>
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

const getPodiumEntries = (entries: DisplayEntry[]) => {
  const second = entries.find((entry) => entry.rank === 2);
  const first = entries.find((entry) => entry.rank === 1);
  const third = entries.find((entry) => entry.rank === 3);
  return [second, first, third].filter(Boolean) as DisplayEntry[];
};

function PodiumCard({ entry }: { entry: DisplayEntry }) {
  const style = podiumStyles[entry.rank as 1 | 2 | 3];

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-end">
      <div className="relative mb-3">
        {entry.rank === 1 && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#ffe8a5] px-2 py-1 text-[#d08c00] shadow-sm">
            <Crown className="h-4 w-4" />
          </div>
        )}

        <div
          className={`grid h-[56px] w-[56px] place-items-center rounded-[18px] border-2 text-[1.35rem] shadow-[0_10px_20px_rgba(103,120,170,0.12)] ${style.shell} ${style.avatar}`}
        >
          {getAvatar(entry)}
        </div>
      </div>

      <div
        className={`flex w-full max-w-[112px] flex-col items-center justify-end rounded-t-[28px] px-3 pb-4 pt-5 text-center shadow-[0_18px_30px_rgba(96,112,156,0.14)] ${style.block} ${style.height}`}
      >
        <div className={`mb-3 rounded-full px-2 py-1 ${style.iconTone}`}>
          {style.icon}
        </div>
        <div className="text-[2rem] font-bold leading-none">{entry.rank}</div>
      </div>

      <div className="mt-3 text-center">
        <div className="text-sm font-semibold text-slate-900">
          {getFirstName(entry.fullName)}
        </div>
        <div className="mt-1 text-xs font-medium text-slate-500">
          {formatCompactXp(entry.metricValue)} XP
        </div>
      </div>
    </div>
  );
}

export default function StudentLeaderboardTab({
  currentUserId,
  entries,
}: StudentLeaderboardTabProps) {
  const [mode, setMode] = useState<LeaderboardMode>("class");
  const classEntries = useMemo(() => buildClassEntries(entries), [entries]);
  const subjectEntries = useMemo(() => buildSubjectEntries(entries), [entries]);
  const activeEntries = mode === "class" ? classEntries : subjectEntries;
  const currentUser = activeEntries.find((entry) => entry.id === currentUserId) ?? null;
  const topThree = getPodiumEntries(activeEntries);
  const listEntries = activeEntries.filter((entry) => entry.rank > 3);
  const topThreeCutoff =
    activeEntries.find((entry) => entry.rank === 3)?.metricValue ??
    activeEntries[0]?.metricValue ??
    1;
  const gapToTopThree =
    currentUser && currentUser.rank > 3
      ? Math.max(topThreeCutoff - currentUser.metricValue, 0)
      : 0;

  const copy =
    mode === "class"
      ? {
          subtitle: "XP цуглуулж тэргүүлэгчтэй нэгд",
          badgeLabel: "10-р анги",
          bannerTitle: "Чиний эрэмбэ",
          bannerBody:
            currentUser && currentUser.rank <= 3
              ? "Чи топ 3 дотор явж байна."
              : currentUser
                ? `Чи ${currentUser.rank}-т орж байна.`
                : "Эрэмбээ ахиулаарай.",
        }
      : {
          subtitle: "Сонгосон хичээлийн XP чансаа",
          badgeLabel: currentUser?.focusLabel ?? activeEntries[0]?.focusLabel ?? "Хичээл",
          bannerTitle: "Чиний хичээлийн байр",
          bannerBody:
            currentUser && currentUser.rank <= 3
              ? `Чи ${currentUser.focusLabel}-д топ 3 дотор явж байна.`
              : currentUser
                ? `Чи ${currentUser.focusLabel}-д ${currentUser.rank}-т орж байна.`
                : "Хичээлийн чансаагаа ахиулаарай.",
        };

  if (activeEntries.length === 0) {
    return (
      <section className="w-full rounded-[30px] border border-[#dfe4ff] bg-white p-6 shadow-[0_22px_55px_rgba(77,92,148,0.08)]">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900">
          Тэргүүлэгчид
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Одоогоор leaderboard мэдээлэл алга байна.
        </p>
      </section>
    );
  }

  return (
    <section className="w-full space-y-5">
      <div className="rounded-[30px] border border-[#dfe4ff] bg-white p-5 shadow-[0_22px_55px_rgba(77,92,148,0.08)] sm:p-6">
        <div>
          <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-900">
            Тэргүүлэгчид
          </h2>
          <p className="mt-1 text-sm text-slate-400">{copy.subtitle}</p>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-1 rounded-[22px] bg-[#edf1ff] p-1">
            <button
              type="button"
              className={`rounded-[18px] px-4 py-3 text-center text-sm font-semibold transition ${
                mode === "class"
                  ? "bg-white text-slate-700 shadow-sm"
                  : "text-[#8c97b5]"
              }`}
              onClick={() => setMode("class")}
            >
              10-р анги
            </button>
            <button
              type="button"
              className={`rounded-[18px] px-4 py-3 text-center text-sm font-semibold transition ${
                mode === "subject"
                  ? "bg-white text-slate-700 shadow-sm"
                  : "text-[#8c97b5]"
              }`}
              onClick={() => setMode("subject")}
            >
              Хичээл
            </button>
          </div>

          <div className="shrink-0 rounded-full bg-[#eef3ff] px-3 py-2 text-xs font-semibold text-[#5c6cff]">
            {copy.badgeLabel}
          </div>
        </div>

        {currentUser && (
          <div className="mt-4 flex items-center justify-between gap-4 rounded-[24px] bg-gradient-to-r from-[#4b74ff] to-[#7b4df1] px-4 py-4 text-white shadow-[0_18px_36px_rgba(90,92,225,0.28)]">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/12">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-semibold">{copy.bannerTitle}</div>
                <div className="text-sm text-white/80">{copy.bannerBody}</div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[2rem] font-bold leading-none">
                #{currentUser.rank}
              </div>
              <div className="mt-1 text-xs font-medium text-white/80">
                {gapToTopThree > 0 ? `Топ 3-д ${gapToTopThree} XP` : "Сайн явж байна"}
              </div>
            </div>
          </div>
        )}

        {topThree.length > 0 && (
          <div className="mt-6 flex items-end justify-center gap-3 sm:gap-5">
            {topThree.map((entry) => (
              <PodiumCard key={`${mode}-${entry.id}`} entry={entry} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {listEntries.map((entry) => {
          const isCurrentUser = entry.id === currentUserId;

          return (
            <div
              key={`${mode}-${entry.id}`}
              className={`flex items-center justify-between gap-3 rounded-[24px] border px-4 py-4 shadow-[0_10px_22px_rgba(77,92,148,0.05)] transition ${
                isCurrentUser
                  ? "border-[#cfd8ff] bg-[#eef3ff]"
                  : "border-[#edf1fb] bg-white"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                    isCurrentUser
                      ? "bg-[#5b67f6] text-white"
                      : "bg-[#eef2fb] text-slate-500"
                  }`}
                >
                  {entry.rank}
                </div>

                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#edf1fb] bg-[#f8faff] text-lg">
                  {getAvatar(entry)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-base font-semibold text-slate-900">
                      {getFirstName(entry.fullName)}
                    </span>
                    {isCurrentUser && (
                      <span className="rounded-full bg-[#5c6cff] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-slate-400">
                    Lvl {entry.level}
                    {mode === "subject" ? ` • ${entry.focusLabel}` : ""}
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="flex items-center justify-end gap-1 text-base font-semibold text-[#d69424]">
                  <Zap className="h-4 w-4" />
                  {formatCompactXp(entry.metricValue)}
                </div>
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#fff5de] px-2.5 py-1 text-xs font-semibold text-[#d69424]">
                  <Sparkles className="h-3.5 w-3.5" />
                  {entry.metricPercent}%
                </div>
              </div>
            </div>
          );
        })}

        {listEntries.length === 0 && (
          <div className="rounded-[24px] border border-dashed border-[#dfe4ff] bg-white px-4 py-6 text-center text-sm text-slate-400">
            Одоогоор podium-ын дараах жагсаалт хоосон байна.
          </div>
        )}
      </div>
    </section>
  );
}
