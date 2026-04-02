import { LineChart, Sparkles, Zap } from "lucide-react";
import TeacherCardSkeleton from "./TeacherCardSkeleton";
import TeacherEmptyState from "./TeacherEmptyState";
import type { TeacherDashboardAnalytics } from "../types";

type TeacherAnalyticsDashboardTabProps = {
  loading: boolean;
  analytics: TeacherDashboardAnalytics | null;
};

const chartHeight = 300;
const chartWidth = 860;

const buildPolyline = (
  values: number[],
  maxValue: number,
  height: number,
  width: number,
) => {
  if (values.length === 0) return "";
  const step = values.length > 1 ? width / (values.length - 1) : width;

  return values
    .map((value, index) => {
      const x = Math.round(index * step);
      const normalized = maxValue > 0 ? value / maxValue : 0;
      const y = Math.round(height - normalized * (height - 46) - 24);
      return `${x},${y}`;
    })
    .join(" ");
};

const buildAreaPath = (polyline: string, height: number, width: number) => {
  if (!polyline) return "";
  return `M ${polyline} L ${width},${height} L 0,${height} Z`;
};

export default function TeacherAnalyticsDashboardTab({
  loading,
  analytics,
}: TeacherAnalyticsDashboardTabProps) {
  if (loading) {
    return (
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_470px]">
        <TeacherCardSkeleton className="min-h-[620px]" rows={7} />
        <TeacherCardSkeleton className="min-h-[620px]" rows={7} />
      </section>
    );
  }

  if (!analytics) {
    return (
      <section className="rounded-[28px] border border-dashed border-[#d8e0ea] bg-white px-6 py-16 text-center text-sm text-slate-400">
        Аналитикийн өгөгдөл одоогоор бэлэн биш байна.
      </section>
    );
  }

  const trend = Array.isArray(analytics.scoreTrend) ? analytics.scoreTrend : [];
  const xpLeaderboard = Array.isArray(analytics.xpLeaderboard)
    ? analytics.xpLeaderboard.slice(0, 3)
    : [];
  const aiInsight = analytics.aiInsight ?? {
    title: "Гол анхаарах зүйл",
    summary: "AI дүгнэлт одоогоор бэлэн биш байна.",
    source: "fallback" as const,
  };

  const scorePoints = trend.map((item) => item.averageScore);
  const xpPoints = trend.map((item) => item.averageXp);
  const maxValue = Math.max(...scorePoints, ...xpPoints, 100);
  const scorePolyline = buildPolyline(
    scorePoints,
    maxValue,
    chartHeight,
    chartWidth,
  );
  const xpPolyline = buildPolyline(xpPoints, maxValue, chartHeight, chartWidth);
  const scoreArea = buildAreaPath(scorePolyline, chartHeight, chartWidth);
  const xpArea = buildAreaPath(xpPolyline, chartHeight, chartWidth);
  const latestScore = scorePoints[scorePoints.length - 1] ?? 0;
  const previousScore = scorePoints[scorePoints.length - 2] ?? latestScore;
  const latestXp = xpPoints[xpPoints.length - 1] ?? 0;
  const previousXp = xpPoints[xpPoints.length - 2] ?? latestXp;
  const scoreDelta = Math.round((latestScore - previousScore) * 10) / 10;
  const xpDelta = Math.round((latestXp - previousXp) * 10) / 10;
  const highlightedIndex =
    trend.length > 0 ? Math.min(4, trend.length - 1) : -1;
  const highlightedPoint =
    highlightedIndex >= 0
      ? {
          x:
            trend.length > 1
              ? Math.round((chartWidth / (trend.length - 1)) * highlightedIndex)
              : Math.round(chartWidth / 2),
          y:
            chartHeight -
            ((trend[highlightedIndex]?.averageXp ?? 0) / maxValue) *
              (chartHeight - 46) -
            24,
          value: trend[highlightedIndex]?.averageXp ?? 0,
          label: trend[highlightedIndex]?.label ?? "",
        }
      : null;

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_470px]">
      <div className="space-y-5">
        <div className="rounded-[34px] border border-[#e6ebf2] bg-white px-6 py-7 shadow-[0_26px_60px_-48px_rgba(15,23,42,0.28)] sm:px-7">
          <h2 className="text-[24px] font-semibold tracking-[-0.04em] text-slate-950">
            Шалгалтын аналитик
          </h2>
          <p className="mt-3 text-[18px] leading-8 text-slate-400">
            Таны хамгийн сүүлийн шалгалтын дундаж оноо болон анхаарах
            шаардлагатай зөвлөгөө.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Нийт ордог анги", value: analytics.totalClasses ?? 0 },
              { label: "Нийт сурагчид", value: analytics.totalStudents ?? 0 },
              {
                label: "7 хоног орох",
                value: analytics.lastSevenDaysSubmissions ?? 0,
              },
              { label: "Нийт оролт", value: analytics.totalSubmissions ?? 0 },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[26px] border border-[#e7ebf2] w-[190px] bg-white px-6 py-6 shadow-[0_16px_36px_-34px_rgba(15,23,42,0.2)]"
              >
                <div className="text-[18px] text-slate-500">{item.label}</div>
                <div className="mt-7 text-[30px] font-semibold tracking-[-0.05em] text-black">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[34px] border border-[#e6ebf2] bg-white px-6 py-8 shadow-[0_26px_60px_-48px_rgba(15,23,42,0.28)] sm:px-7">
          <h3 className="text-[18px] font-bold tracking-[-0.04em] text-slate-950">
            Шалгалтын дундаж өсөлт, бууралт
          </h3>

          {trend.length === 0 ? (
            <div className="mt-8">
              <TeacherEmptyState
                icon={<LineChart className="size-5" />}
                title="Графикийн өгөгдөл хүлээгдэж байна"
                description="Хангалттай submission цуглармагц график энд харагдана."
                className="px-6 py-16"
              />
            </div>
          ) : (
            <div className="mt-8 overflow-hidden rounded-[28px] border border-[#edf1f6] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf1f6] px-6 py-4">
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#f5f7ff] px-3 py-1.5">
                    <span className="size-2.5 rounded-full bg-[#5f82ff]" />
                    Дундаж оноо
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#f3fff9] px-3 py-1.5">
                    <span className="size-2.5 rounded-full bg-[#77ebb9]" />
                    Дундаж XP
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full border border-[#d9e4ff] bg-[#f5f7ff] px-3 py-1.5 text-[#4f6ed9]">
                    Оноо {scoreDelta >= 0 ? "+" : ""}{scoreDelta}
                  </span>
                  <span className="rounded-full border border-[#d6f4e6] bg-[#f3fff9] px-3 py-1.5 text-[#2e9466]">
                    XP {xpDelta >= 0 ? "+" : ""}{xpDelta}
                  </span>
                </div>
              </div>
              <div className="px-4 pt-5 sm:px-6">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="h-[360px] w-full"
                  aria-label={`Teacher analytics chart. Latest score ${latestScore} percent, latest xp ${latestXp}.`}
                  role="img"
                >
                  <defs>
                    <linearGradient
                      id="scoreAreaGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#6f8cff"
                        stopOpacity="0.16"
                      />
                      <stop
                        offset="100%"
                        stopColor="#6f8cff"
                        stopOpacity="0.02"
                      />
                    </linearGradient>
                    <linearGradient
                      id="xpAreaGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#76edbb"
                        stopOpacity="0.18"
                      />
                      <stop
                        offset="100%"
                        stopColor="#76edbb"
                        stopOpacity="0.03"
                      />
                    </linearGradient>
                    <filter id="pointGlow">
                      <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {[0, 1, 2, 3, 4, 5].map((index) => {
                    const y = Math.round((chartHeight / 5) * index + 4);
                    return (
                      <line
                        key={`h-${index}`}
                        x1="0"
                        x2={chartWidth}
                        y1={y}
                        y2={y}
                        stroke="#edf2f8"
                      />
                    );
                  })}

                  {trend.map((item, index) => {
                    const x =
                      trend.length > 1
                        ? Math.round((chartWidth / (trend.length - 1)) * index)
                        : 0;
                    return (
                      <line
                        key={`v-${item.label}-${index}`}
                        x1={x}
                        x2={x}
                        y1="0"
                        y2={chartHeight}
                        stroke="#e8eef6"
                        strokeDasharray="7 8"
                      />
                    );
                  })}

                  {scoreArea ? (
                    <path d={scoreArea} fill="url(#scoreAreaGradient)" />
                  ) : null}
                  {xpArea ? (
                    <path d={xpArea} fill="url(#xpAreaGradient)" />
                  ) : null}

                  <polyline
                    fill="none"
                    stroke="#5f82ff"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={scorePolyline}
                  />
                  <polyline
                    fill="none"
                    stroke="#77ebb9"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={xpPolyline}
                  />

                  {highlightedPoint ? (
                    <>
                      <circle
                        cx={highlightedPoint.x}
                        cy={highlightedPoint.y}
                        r="12"
                        fill="#77ebb9"
                        opacity="0.25"
                        filter="url(#pointGlow)"
                      />
                      <circle
                        cx={highlightedPoint.x}
                        cy={highlightedPoint.y}
                        r="7"
                        fill="#77ebb9"
                        stroke="#cff8e7"
                        strokeWidth="3"
                      />
                      <foreignObject
                        x={Math.min(highlightedPoint.x + 22, chartWidth - 170)}
                        y={Math.max(highlightedPoint.y - 24, 20)}
                        width="160"
                        height="72"
                      >
                        <div className="rounded-[18px] border border-[#eef2f7] bg-white px-4 py-3 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.28)]">
                          <div className="text-[14px] text-[#8891bf]">
                            Одоогийн дундаж
                          </div>
                          <div className="mt-1 text-[18px] font-semibold text-slate-900">
                            {highlightedPoint.value}%
                          </div>
                        </div>
                      </foreignObject>
                    </>
                  ) : null}
                </svg>
              </div>

              <div className="grid grid-cols-2 gap-y-4 px-8 pb-6 pt-3 text-center text-[15px] text-slate-600 sm:grid-cols-4 lg:grid-cols-6">
                {trend.map((item) => (
                  <div key={item.label}>{item.label}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-[34px] border border-[#e6ebf2] bg-white px-6 py-7 shadow-[0_26px_60px_-48px_rgba(15,23,42,0.28)]">
          <h3 className="text-[20px] font-semibold tracking-[-0.04em] text-slate-950">
            Сурагчдын XP оноо
          </h3>

          <div className="mt-5 space-y-3">
            {xpLeaderboard.length === 0 ? (
              <TeacherEmptyState
                icon={<Zap className="size-5" />}
                title="XP мэдээлэл алга"
                description="XP мэдээлэл одоогоор алга."
                className="px-4 py-12"
              />
            ) : (
              xpLeaderboard.map((student, index) => (
                <div
                  key={student.studentId}
                  className="flex items-center gap-4 rounded-[18px] border border-[#e5eaf1] bg-white px-4 py-4 shadow-[0_14px_30px_-28px_rgba(15,23,42,0.2)]"
                >
                  <div
                    className={`grid size-11 shrink-0 place-items-center rounded-full text-[1.3rem] font-semibold ${
                      index === 0
                        ? "bg-[#ffa617] text-white"
                        : "bg-[#eaf1ff] text-[#5f6f8d]"
                    }`}
                  >
                    {student.rank}
                  </div>
                  <div className="grid size-11 shrink-0 place-items-center rounded-full bg-[#edf4ff] text-[1.4rem]">
                    👩‍🎓
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[1.4rem] font-semibold leading-none text-slate-900">
                      Сурагч
                    </div>
                    <div className="mt-1 text-[1rem] text-[#7482a0]">
                      Lvl {student.level}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[1.5rem] font-semibold text-[#ef9a13]">
                    <Zap className="size-4.5" />
                    {student.xp >= 1000
                      ? `${(student.xp / 1000).toFixed(1)}k`
                      : student.xp.toString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[34px] border border-[#f2a437] bg-white px-6 py-7 shadow-[0_26px_60px_-48px_rgba(245,158,11,0.26)]">
          <div className="flex items-start gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-full border border-[#ffd69d] bg-[#fff7e8] text-[#f0a420]">
              <Sparkles className="size-4.5" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold tracking-[-0.04em] text-slate-950">
                Гол анхаарах зүйл
              </h3>
            </div>
          </div>
          <p className="mt-6 text-[18px] font-bold leading-10 text-slate-900">
            {aiInsight.summary}
          </p>
        </div>
      </div>
    </section>
  );
}
