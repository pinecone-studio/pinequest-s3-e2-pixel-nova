import { useMemo } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import type { XpLeaderboardEntry } from "@/api/xp";
import type { Exam } from "../types";
import { subjectFromExam, formatClock } from "./student-exams-helpers";

type StudentDashboardTabProps = {
  loading: boolean;
  currentUserId: string | null;
  currentUserName: string;
  exams: Exam[];
  selectedExam: Exam | null;
  levelInfo: { level: number; minXP: number };
  studentProgress: { xp: number };
  nextLevel: { minXP: number };
  currentRank: number | null;
  studentCount: number;
  studentHistory: {
    examId: string;
    title: string;
    percentage: number;
    score?: number;
    totalPoints?: number;
    grade?: "A" | "B" | "C" | "D" | "F";
    date: string;
  }[];
  termLeaderboardEntries: XpLeaderboardEntry[];
  onOpenExams: () => void;
  onOpenProgress: () => void;
};

const scheduleBadgeStyles = [
  {
    label: "Явцын шалгалт",
    className: "bg-[#eef1ff] text-[#6d72ff]",
  },
  {
    label: "Сонгон судлал",
    className: "bg-[#fff3e7] text-[#f0a24d]",
  },
  {
    label: "Явцын шалгалт",
    className: "bg-[#eef1ff] text-[#6d72ff]",
  },
  {
    label: "Явцын шалгалт",
    className: "bg-[#eef1ff] text-[#6d72ff]",
  },
] as const;

const xpEmojis = ["🧑", "🧒", "🧑‍🎓", "👩"];

const getExamTimestamp = (exam: Exam) => {
  const value = exam.scheduledAt ?? exam.createdAt;
  const timestamp = new Date(value ?? "");
  return Number.isNaN(timestamp.getTime()) ? new Date() : timestamp;
};

const formatSlashDate = (value: Date) =>
  value.toLocaleDateString("en-CA").replace(/-/g, "/");

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const buildBezierPath = (points: Array<{ x: number; y: number }>) => {
  if (points.length === 1) {
    return `M 0 ${points[0]?.y.toFixed(2) ?? "0.00"}`;
  }

  return points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    }

    const previousPoint = points[index - 1] ?? point;
    const pointBeforePrevious = points[index - 2] ?? previousPoint;
    const nextPoint = points[index + 1] ?? point;

    const cp1x =
      previousPoint.x + (point.x - pointBeforePrevious.x) / 6;
    const cp1y =
      previousPoint.y + (point.y - pointBeforePrevious.y) / 6;
    const cp2x = point.x - (nextPoint.x - previousPoint.x) / 6;
    const cp2y = point.y - (nextPoint.y - previousPoint.y) / 6;

    return `${path} C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  }, "");
};

const formatCompactXp = (value: number) => {
  if (value >= 1000) {
    const compact = value >= 10000 ? Math.round(value / 1000) : Math.round(value / 100) / 10;
    return `${compact.toString().replace(/\.0$/, "")}k`;
  }

  return value.toLocaleString();
};

const getDisplayName = (value: string) => value.trim().split(/\s+/)[0] || value;

export default function StudentDashboardTab({
  loading,
  currentUserId,
  currentUserName,
  exams,
  selectedExam,
  levelInfo,
  studentProgress,
  nextLevel,
  currentRank,
  studentCount,
  studentHistory,
  termLeaderboardEntries,
  onOpenExams,
  onOpenProgress,
}: StudentDashboardTabProps) {
  const scheduleCards = useMemo(() => {
    const sourceExams = [
      ...(selectedExam ? [selectedExam] : []),
      ...exams.filter((exam) => exam.id !== selectedExam?.id),
    ]
      .sort((left, right) => getExamTimestamp(right).getTime() - getExamTimestamp(left).getTime())
      .slice(0, 4)
      .map((exam, index) => {
        const timestamp = getExamTimestamp(exam);
        const badge = scheduleBadgeStyles[index % scheduleBadgeStyles.length];

        return {
          id: exam.id,
          title: subjectFromExam(exam),
          badgeLabel: badge.label,
          badgeClassName: badge.className,
          dateLabel: formatSlashDate(timestamp),
          timeLabel: formatClock(timestamp),
          durationLabel: `${exam.duration ?? 40} минут`,
        };
      });

    if (sourceExams.length >= 4) return sourceExams;

    const historyCards = studentHistory
      .filter((item) => !sourceExams.some((exam) => exam.id === item.examId))
      .slice(0, 4 - sourceExams.length)
      .map((item, index) => {
        const timestamp = new Date(item.date);
        const safeDate = Number.isNaN(timestamp.getTime()) ? new Date() : timestamp;
        const badge =
          scheduleBadgeStyles[(sourceExams.length + index) % scheduleBadgeStyles.length];

        return {
          id: item.examId,
          title: getDisplayName(item.title),
          badgeLabel: badge.label,
          badgeClassName: badge.className,
          dateLabel: formatSlashDate(safeDate),
          timeLabel: formatClock(safeDate),
          durationLabel: "40 минут",
        };
      });

    return [...sourceExams, ...historyCards];
  }, [exams, selectedExam, studentHistory]);

  const progressChart = useMemo(() => {
    const orderedHistory = [...studentHistory].sort(
      (left, right) =>
        new Date(right.date).getTime() - new Date(left.date).getTime(),
    );
    const sourceHistory =
      orderedHistory.length > 0
        ? orderedHistory.slice(0, 5)
        : [
            {
              examId: "placeholder-1",
              title: "Нийгэм",
              percentage: 83,
              date: new Date().toISOString(),
            },
            {
              examId: "placeholder-2",
              title: "Монгол хэл",
              percentage: 71,
              date: new Date().toISOString(),
            },
            {
              examId: "placeholder-3",
              title: "Англи хэл",
              percentage: 49,
              date: new Date().toISOString(),
            },
            {
              examId: "placeholder-4",
              title: "Түүх",
              percentage: 63,
              date: new Date().toISOString(),
            },
            {
              examId: "placeholder-5",
              title: "Нийгэм",
              percentage: 38,
              date: new Date().toISOString(),
            },
          ];

    const latestItem = sourceHistory[0] ?? null;
    const latestValue = clamp(latestItem?.percentage ?? 83, 18, 95);
    const previousValues = sourceHistory
      .slice(1)
      .map((item) => clamp(item.percentage, 18, 95));
    const previousAverage =
      previousValues.length > 0
        ? Math.round(
            previousValues.reduce((sum, value) => sum + value, 0) /
              previousValues.length,
          )
        : 54;

    const risingValue = clamp(
      Math.min(latestValue - 10, previousAverage + 12),
      24,
      Math.max(latestValue - 12, 28),
    );
    const valleyValue = clamp(
      Math.min(risingValue - 10, latestValue - 18),
      18,
      Math.max(risingValue - 6, 20),
    );
    const startValue = clamp(valleyValue - 14, 12, 48);
    const dropValue = clamp(latestValue - 34, 18, 70);
    const tailValue = clamp(dropValue + 6, 22, 74);
    const values = [
      startValue,
      risingValue,
      valleyValue,
      latestValue,
      dropValue,
      tailValue,
    ];

    const width = 100;
    const height = 52;
    const chartTop = 7;
    const chartBottom = 44;
    const xPositions = [5, 27, 43, 62, 87, 98];
    const points = values.map((value, index) => ({
      x: xPositions[index] ?? index * (width / Math.max(values.length - 1, 1)),
      y: chartBottom - (value / 100) * (chartBottom - chartTop),
    }));
    const highlightIndex = 3;
    const highlightPoint = points[highlightIndex] ?? points[points.length - 1];
    const latestDate = new Date(latestItem?.date ?? "");
    const bubbleLeftPercent = clamp((highlightPoint.x / width) * 100 + 4, 54, 73);
    const bubbleTopPercent = clamp((highlightPoint.y / height) * 100 - 24, 10, 32);
    const linePath = buildBezierPath(points);

    return {
      latestValue,
      latestTitle: latestItem?.title ?? "Шалгалт",
      latestDateLabel: Number.isNaN(latestDate.getTime())
        ? "Тун удахгүй"
        : formatSlashDate(latestDate),
      linePath,
      areaPath: `${linePath} L 100 52 L 0 52 Z`,
      dotX: highlightPoint.x,
      dotY: highlightPoint.y,
      bubbleLeftPercent,
      bubbleTopPercent,
      hasRealData: orderedHistory.length > 0,
    };
  }, [studentHistory]);

  const xpRows = useMemo(() => {
    const normalizedEntries = termLeaderboardEntries.map((entry) => ({
      ...entry,
      fullName:
        currentUserId && entry.id === currentUserId ? currentUserName : entry.fullName,
    }));
    const currentEntry =
      normalizedEntries.find((entry) => entry.id === currentUserId) ??
      (currentUserId
        ? {
            rank: currentRank ?? Math.max(normalizedEntries.length + 1, 1),
            id: currentUserId,
            fullName: currentUserName,
            xp: studentProgress.xp,
            level: levelInfo.level,
          }
        : null);

    const topEntries = normalizedEntries.slice(0, 3);
    const rows = [...topEntries];

    if (currentEntry && !rows.some((entry) => entry.id === currentEntry.id)) {
      rows.splice(Math.min(2, rows.length), 0, currentEntry);
    }

    return rows.slice(0, 3);
  }, [
    currentRank,
    currentUserId,
    currentUserName,
    levelInfo.level,
    studentProgress.xp,
    termLeaderboardEntries,
  ]);

  const xpToNext = Math.max(nextLevel.minXP - studentProgress.xp, 0);

  if (loading) {
    return (
      <section className="mx-auto grid w-full max-w-[1216px] gap-8 xl:grid-cols-[800px_384px]">
        <div className="space-y-5">
          <div className="h-8 w-52 animate-pulse rounded-full bg-[#e9ecfb]" />
          <div className="grid gap-8 md:grid-cols-2 xl:[grid-template-columns:repeat(2,384px)]">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-[264px] animate-pulse rounded-[28px] border border-[#e8ecfb] bg-white"
              />
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="h-[294px] animate-pulse rounded-[32px] border border-[#e8ecfb] bg-white" />
          <div className="h-[210px] animate-pulse rounded-[28px] border border-[#e8ecfb] bg-white" />
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto grid w-full max-w-[1216px] gap-8 xl:grid-cols-[800px_384px]">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[1.9rem] font-semibold tracking-[-0.04em] text-slate-900">
            Шалгалтын хуваарь
          </h2>
          <button
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#6b72ff] transition hover:text-[#4d5cf0]"
            onClick={onOpenExams}
          >
            Бүгдийг харах
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {scheduleCards.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[#dfe5fb] bg-white px-5 py-8 text-sm text-slate-400">
            Одоогоор харагдах шалгалтын хуваарь алга.
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 xl:[grid-template-columns:repeat(2,384px)]">
            {scheduleCards.map((card) => (
              <article
                key={card.id}
                className="h-[264px] rounded-[30px] border border-[#dfe5fb] bg-white px-5 py-6 shadow-[0_18px_42px_rgba(79,93,132,0.08)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[1.15rem] font-semibold tracking-[-0.03em] text-slate-900">
                    {card.title}
                  </h3>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${card.badgeClassName}`}
                  >
                    {card.badgeLabel}
                  </span>
                </div>

                <dl className="mt-6 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-400">Өдөр:</dt>
                    <dd className="font-medium text-slate-700">{card.dateLabel}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-400">Эхлэх цаг:</dt>
                    <dd className="font-medium text-slate-700">{card.timeLabel}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-400">Үргэлжлэх хугацаа:</dt>
                    <dd className="font-medium text-slate-700">{card.durationLabel}</dd>
                  </div>
                </dl>

                <div className="mt-7 border-t border-[#edf1ff] pt-4">
                  <button
                    className="inline-flex w-full items-center justify-end gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
                    onClick={onOpenExams}
                  >
                    Дэлгэрэнгүй
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="w-full space-y-5 xl:w-[384px]">
        <button
          type="button"
          aria-label="Ахиц харах"
          className="relative h-[294px] w-full overflow-hidden rounded-[32px] border border-[#eef2ff] bg-white px-5 pb-4 pt-5 text-left shadow-[0_18px_42px_rgba(79,93,132,0.08)] transition hover:shadow-[0_24px_54px_rgba(79,93,132,0.12)]"
          onClick={onOpenProgress}
        >
          <div>
            <div>
              <h3 className="text-[1.9rem] font-semibold tracking-[-0.05em] text-[#111216]">
                Ахиц дэвшил
              </h3>
              <p className="mt-1.5 text-[0.9rem] font-medium text-[#aab4cc]">
                Сүүлийн шалгалтуудын дундаж
              </p>
            </div>
          </div>

          <div className="relative mt-4 h-[200px] overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)]">
            <div
              className="absolute z-20 w-[168px] -translate-x-[34%] -translate-y-1/2 rounded-[22px] bg-white px-5 py-3.5 shadow-[0_18px_34px_rgba(79,93,132,0.14)]"
              style={{
                left: `${progressChart.bubbleLeftPercent}%`,
                top: `${progressChart.bubbleTopPercent}%`,
              }}
            >
              <div className="absolute -left-1.5 top-[56%] h-4 w-4 -translate-y-1/2 rotate-45 bg-white shadow-[-6px_8px_16px_rgba(79,93,132,0.06)]" />
              <div className="relative text-[0.95rem] font-semibold tracking-[-0.03em] text-slate-800">
                <span className="text-[1.2rem]">{progressChart.latestValue}%</span>{" "}
                {progressChart.latestTitle}
              </div>
              <div className="relative mt-1 text-[0.82rem] text-[#b4b9c8]">
                {progressChart.latestDateLabel}
              </div>
            </div>

            <svg
              viewBox="0 0 100 52"
              preserveAspectRatio="none"
              className="absolute inset-x-0 bottom-0 h-[175px] w-full"
              aria-label="Сурагчийн ахицын график"
              role="img"
            >
              <defs>
                <linearGradient id="student-home-progress-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7d83ff" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d={progressChart.areaPath} fill="url(#student-home-progress-fill)" />
              <path
                d={progressChart.linePath}
                fill="none"
                stroke="#5f6ff7"
                strokeWidth="1.35"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx={progressChart.dotX}
                cy={progressChart.dotY}
                r="3.15"
                fill="#5f6ff7"
                stroke="white"
                strokeWidth="1.9"
              />
            </svg>
          </div>
        </button>

        <div className="rounded-[30px] border border-[#edf1ff] bg-white px-5 py-5 shadow-[0_18px_42px_rgba(79,93,132,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[1.1rem] font-semibold tracking-[-0.03em] text-slate-900">
                XP оноо
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Дараагийн level хүртэл {xpToNext} XP
              </p>
            </div>
            {currentRank ? (
              <span className="rounded-full bg-[#f3f5ff] px-3 py-1 text-xs font-semibold text-[#6772ff]">
                #{currentRank} / {studentCount}
              </span>
            ) : null}
          </div>

          <div className="mt-4 space-y-3">
            {xpRows.map((entry, index) => {
              const isCurrentUser = Boolean(currentUserId && entry.id === currentUserId);

              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 rounded-[20px] border px-3 py-3 shadow-[0_12px_30px_rgba(79,93,132,0.06)] ${
                    isCurrentUser
                      ? "border-[#bfcaff] bg-[#eef1ff]"
                      : "border-[#edf1ff] bg-white"
                  }`}
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f5f7ff] text-sm font-semibold text-slate-600">
                    {entry.rank}
                  </div>
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#fff8eb] text-lg">
                    {xpEmojis[index % xpEmojis.length]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {getDisplayName(entry.fullName)}
                      </div>
                      {isCurrentUser && (
                        <span className="rounded-full bg-[#5f70ff] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
                          you
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">Lvl {entry.level}</div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-[#f0a24d]">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m13 2-7 12h5l-1 8 8-13h-5l0-7Z" />
                    </svg>
                    {formatCompactXp(entry.xp)}
                  </div>
                </div>
              );
            })}

            {xpRows.length === 0 && (
              <div className="rounded-[20px] border border-dashed border-[#dfe5fb] bg-[#fbfcff] px-4 py-5 text-sm text-slate-400">
                XP leaderboard удахгүй харагдана.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
