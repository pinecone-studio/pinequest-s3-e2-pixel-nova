import { useMemo } from "react";
import {
  ArrowUpRight,
  BarChart3,
  GraduationCap,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import StudentResultsTab from "./StudentResultsTab";

type StudentProgressTabProps = {
  levelInfo: { level: number; minXP: number };
  studentProgress: { xp: number };
  nextLevel: { minXP: number };
  progressSegments: number;
  studentHistory: {
    examId: string;
    title: string;
    percentage: number;
    score?: number;
    totalPoints?: number;
    grade?: "A" | "B" | "C" | "D" | "F";
    date: string;
  }[];
};

type HistoryItem = StudentProgressTabProps["studentHistory"][number];

type SubjectScore = {
  label: string;
  short: string;
  value: number;
  color: string;
  soft: string;
  text: string;
  match: RegExp;
};

const chartGuides = [100, 80, 65, 50];
const fallbackTrend = [68, 83, 64, 91, 87, 96, 80];
const subjectBlueprints: SubjectScore[] = [
  {
    label: "Math",
    short: "Ma",
    value: 88,
    color: "#6A6FF5",
    soft: "#EEF0FF",
    text: "#6A6FF5",
    match: /math|mathematics|algebra|geometry|мат|алгебр|геометр/i,
  },
  {
    label: "Physics",
    short: "Ph",
    value: 74,
    color: "#5B8CFF",
    soft: "#EEF4FF",
    text: "#5B8CFF",
    match: /physics|physic|физик/i,
  },
  {
    label: "English",
    short: "En",
    value: 92,
    color: "#50BE82",
    soft: "#ECFBF2",
    text: "#34A969",
    match: /english|англи|language|reading|writing/i,
  },
  {
    label: "History",
    short: "Hi",
    value: 65,
    color: "#F4A338",
    soft: "#FFF5E8",
    text: "#F4A338",
    match: /history|historic|түүх/i,
  },
  {
    label: "Science",
    short: "Sc",
    value: 79,
    color: "#DD5A9E",
    soft: "#FFF0F7",
    text: "#D54D96",
    match: /science|biology|chemistry|scientific|шинжлэх|биологи|хими/i,
  },
];

const clampScore = (value: number, min = 50, max = 100) =>
  Math.max(min, Math.min(max, Math.round(value)));

const formatMonthLabel = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short" });
};

const buildLeadingMonthLabels = (count: number, anchor?: string) => {
  const anchorDate = new Date(anchor ?? Date.now());
  const safeAnchor = Number.isNaN(anchorDate.getTime()) ? new Date() : anchorDate;

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(safeAnchor);
    date.setMonth(safeAnchor.getMonth() - (count - index));
    return date.toLocaleDateString("en-US", { month: "short" });
  });
};

const buildLinePath = (points: { x: number; y: number }[]) =>
  points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ");

const average = (values: number[]) =>
  values.length
    ? Math.round(values.reduce((sum, item) => sum + item, 0) / values.length)
    : 0;

const inferSubjectScores = (
  history: HistoryItem[],
  averageScore: number,
): SubjectScore[] => {
  const offsets = [5, -7, 10, -12, -2];

  return subjectBlueprints.map((subject, index) => {
    const matches = history.filter((item) => subject.match.test(item.title));
    const value =
      matches.length > 0
        ? clampScore(
            average(matches.map((item) => item.percentage)),
            55,
            98,
          )
        : history.length > 0
          ? clampScore(averageScore + offsets[index], 55, 96)
          : subject.value;

    return {
      ...subject,
      value,
    };
  });
};

export default function StudentProgressTab({
  levelInfo,
  studentProgress,
  nextLevel,
  progressSegments,
  studentHistory,
}: StudentProgressTabProps) {
  const averageScore = useMemo(
    () => average(studentHistory.map((item) => item.percentage)),
    [studentHistory],
  );

  const trendPoints = useMemo(() => {
    const sorted = [...studentHistory].sort((left, right) =>
      left.date.localeCompare(right.date),
    );
    const recent = sorted.slice(-7).map((item) => ({
      label: formatMonthLabel(item.date),
      value: clampScore(item.percentage),
      date: item.date,
    }));

    if (recent.length === 0) {
      return buildLeadingMonthLabels(7).map((label, index) => ({
        label,
        value: fallbackTrend[index],
      }));
    }

    if (recent.length < 7) {
      const padCount = 7 - recent.length;
      const padLabels = buildLeadingMonthLabels(padCount, recent[0]?.date);
      const paddedValues = fallbackTrend.slice(0, padCount).map((value, index) =>
        clampScore(
          studentHistory.length > 0
            ? Math.round((value + Math.max(averageScore, 62)) / 2) - index
            : value,
        ),
      );

      return [
        ...padLabels.map((label, index) => ({
          label,
          value: paddedValues[index],
        })),
        ...recent,
      ];
    }

    return recent;
  }, [studentHistory, averageScore]);

  const chartData = useMemo(() => {
    const chartWidth = 640;
    const chartHeight = 260;
    const padding = {
      top: 22,
      right: 18,
      bottom: 38,
      left: 44,
    };
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;
    const stepX = innerWidth / Math.max(trendPoints.length - 1, 1);

    const points = trendPoints.map((point, index) => {
      const normalized = (100 - point.value) / 50;
      return {
        ...point,
        x: padding.left + index * stepX,
        y: padding.top + normalized * innerHeight,
      };
    });

    const linePath = buildLinePath(points);
    const baseline = chartHeight - padding.bottom;
    const areaPath = points.length
      ? `${linePath} L ${points[points.length - 1]?.x.toFixed(2)} ${baseline} L ${
          points[0]?.x.toFixed(2)
        } ${baseline} Z`
      : "";

    const yGuides = chartGuides.map((value) => ({
      label: value,
      y:
        padding.top +
        ((100 - value) / 50) * innerHeight,
    }));

    return {
      chartWidth,
      chartHeight,
      baseline,
      points,
      linePath,
      areaPath,
      yGuides,
    };
  }, [trendPoints]);

  const trendDelta = useMemo(() => {
    if (trendPoints.length < 2) return 12;
    return trendPoints[trendPoints.length - 1].value - trendPoints[0].value;
  }, [trendPoints]);

  const topMonthIndex = useMemo(() => {
    if (!chartData.points.length) return -1;
    let bestIndex = 0;
    chartData.points.forEach((point, index) => {
      if (point.value >= chartData.points[bestIndex].value) {
        bestIndex = index;
      }
    });
    return bestIndex;
  }, [chartData.points]);

  const subjectScores = useMemo(
    () => inferSubjectScores(studentHistory, averageScore),
    [studentHistory, averageScore],
  );

  const xpToNext = Math.max(nextLevel.minXP - studentProgress.xp, 0);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-[#dfe4ff] bg-[linear-gradient(135deg,#ffffff_0%,#f6f8ff_52%,#eef4ff_100%)] px-5 py-6 shadow-[0_24px_60px_rgba(77,92,148,0.10)] sm:px-6 lg:px-8">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#dfe7ff] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-[#edf7ff] blur-3xl" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-900">
              Your Progress
            </h2>
            <p className="mt-1 text-base text-slate-500">
              Track your learning journey
            </p>
          </div>

          <div className="inline-flex min-h-[54px] w-full items-center justify-center rounded-full border border-[#d9e0ff] bg-white/90 px-5 text-base font-semibold text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:w-[260px]">
            This Week
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <div className="rounded-[28px] border border-[#e3e7ff] bg-white p-5 shadow-[0_18px_45px_rgba(78,93,132,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-slate-400">Current level</div>
              <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-900">
                {levelInfo.level}
              </div>
              <div className="mt-2 text-sm text-slate-500">
                Consistent work is pushing you toward the next milestone.
              </div>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eef1ff] text-[#5f6df6]">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#e3e7ff] bg-white p-5 shadow-[0_18px_45px_rgba(78,93,132,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-slate-400">Total XP</div>
              <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-900">
                {studentProgress.xp.toLocaleString()}
              </div>
              <div className="mt-2 text-sm text-slate-500">
                {xpToNext} XP remaining to unlock level {levelInfo.level + 1}.
              </div>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff4eb] text-[#ff923f]">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-10 gap-1">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full ${
                  index < progressSegments ? "bg-[#6a6ff5]" : "bg-[#edf0fa]"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-[#e3e7ff] bg-white p-5 shadow-[0_18px_45px_rgba(78,93,132,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-slate-400">Average score</div>
              <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-900">
                {averageScore || 83}%
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-[#2fb36a]">
                <TrendingUp className="h-4 w-4" />
                {trendDelta >= 0 ? "+" : ""}
                {trendDelta}% from the visible trend
              </div>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ecfbf2] text-[#32af69]">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <div className="rounded-[30px] border border-[#dfe4ff] bg-white p-5 shadow-[0_22px_55px_rgba(77,92,148,0.08)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-[1.35rem] font-semibold tracking-[-0.03em] text-slate-900">
                Score Trend
              </div>
              <div className="mt-1 text-sm text-slate-400">
                Avg: {averageScore || 83}%
              </div>
            </div>

            <div className="inline-flex items-center gap-1 rounded-full bg-[#e9fbf0] px-3 py-1.5 text-sm font-semibold text-[#38b46e]">
              <ArrowUpRight className="h-4 w-4" />
              {trendDelta >= 0 ? "+" : ""}
              {trendDelta}%
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-dashed border-[#dfe4ff] bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] px-3 py-4 sm:px-4">
            <svg
              viewBox={`0 0 ${chartData.chartWidth} ${chartData.chartHeight}`}
              className="h-[280px] w-full"
              role="img"
              aria-label="Progress score trend chart"
            >
              <defs>
                <linearGradient id="student-progress-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#6A6FF5" stopOpacity="0.26" />
                  <stop offset="100%" stopColor="#6A6FF5" stopOpacity="0.03" />
                </linearGradient>
              </defs>

              {chartData.yGuides.map((guide) => (
                <g key={guide.label}>
                  <line
                    x1="44"
                    x2={chartData.chartWidth - 18}
                    y1={guide.y}
                    y2={guide.y}
                    stroke="#dfe4ff"
                    strokeDasharray="5 6"
                  />
                  <text
                    x="0"
                    y={guide.y + 4}
                    fill="#9aa5bf"
                    fontSize="13"
                    fontWeight="500"
                  >
                    {guide.label}
                  </text>
                </g>
              ))}

              {chartData.points.map((point) => (
                <line
                  key={`${point.label}-${point.x}`}
                  x1={point.x}
                  x2={point.x}
                  y1="22"
                  y2={chartData.baseline}
                  stroke="#edf1ff"
                  strokeDasharray="4 6"
                />
              ))}

              <path d={chartData.areaPath} fill="url(#student-progress-fill)" />
              <path
                d={chartData.linePath}
                fill="none"
                stroke="#6A6FF5"
                strokeOpacity="0.18"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={chartData.linePath}
                fill="none"
                stroke="#6A6FF5"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {chartData.points.map((point, index) => {
                const isTopMonth = index === topMonthIndex;
                return (
                  <g key={`${point.label}-${point.value}-${index}`}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={isTopMonth ? 6 : 4.5}
                      fill="#ffffff"
                      stroke="#6A6FF5"
                      strokeWidth={isTopMonth ? 4 : 3}
                    />
                    <text
                      x={point.x}
                      y={chartData.chartHeight - 8}
                      textAnchor="middle"
                      fill={isTopMonth ? "#6A6FF5" : "#9aa5bf"}
                      fontSize="13"
                      fontWeight={isTopMonth ? "700" : "500"}
                    >
                      {point.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="rounded-[30px] border border-[#dfe4ff] bg-white p-5 shadow-[0_22px_55px_rgba(77,92,148,0.08)] sm:p-6">
          <div className="text-[1.35rem] font-semibold tracking-[-0.03em] text-slate-900">
            Subject Scores
          </div>

          <div className="mt-6 space-y-4">
            {subjectScores.map((subject) => (
              <div key={subject.label} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
                <div
                  className="grid h-10 w-10 place-items-center rounded-full text-sm font-semibold"
                  style={{
                    backgroundColor: subject.soft,
                    color: subject.text,
                  }}
                >
                  {subject.short}
                </div>

                <div className="min-w-0">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="truncate text-base font-semibold text-slate-800">
                      {subject.label}
                    </div>
                    <div className="text-sm font-semibold" style={{ color: subject.text }}>
                      {subject.value}%
                    </div>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-[#edf1fa]">
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{
                        width: `${subject.value}%`,
                        backgroundColor: subject.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[22px] border border-[#edf1ff] bg-[#fbfcff] px-4 py-4">
            <div className="text-sm font-semibold text-slate-800">Focus this week</div>
            <div className="mt-2 text-sm leading-6 text-slate-500">
              Keep the momentum in your strongest topic and revisit the lowest bar once
              more to smooth out the overall trend.
            </div>
          </div>
        </div>
      </section>

      <StudentResultsTab studentHistory={studentHistory} />
    </div>
  );
}
