import { useMemo } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock3,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import type { Exam } from "../types";

type StudentDashboardTabProps = {
  loading: boolean;
  currentUserName: string;
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
  onOpenExams: () => void;
  onOpenProgress: () => void;
};

const examAccentPalette = [
  {
    badge: "bg-[#4b5cff]",
    soft: "bg-[#eef1ff]",
    text: "text-[#4b5cff]",
  },
  {
    badge: "bg-[#c952ef]",
    soft: "bg-[#faedff]",
    text: "text-[#c952ef]",
  },
  {
    badge: "bg-[#4ab88f]",
    soft: "bg-[#eafaf4]",
    text: "text-[#2f8c6a]",
  },
] as const;

const weekLabels = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];

const toDayKey = (value: string | number | Date) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const formatExamDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { dateLabel: "Тодорхойгүй", timeLabel: "Дараа" };
  }

  return {
    dateLabel: date.toLocaleDateString("mn-MN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    timeLabel: date.toLocaleTimeString("mn-MN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

const buildLinePath = (values: number[]) => {
  const width = 100;
  const height = 34;
  const stepX = width / Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = index * stepX;
      const y = height - (value / 100) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
};

const buildAreaPath = (values: number[]) => {
  const line = buildLinePath(values);
  return `${line} L 100 34 L 0 34 Z`;
};

const getFirstName = (value: string) => value.trim().split(/\s+/)[0] || value;

export default function StudentDashboardTab({
  loading,
  currentUserName,
  selectedExam,
  levelInfo,
  studentProgress,
  nextLevel,
  currentRank,
  studentCount,
  studentHistory,
  onOpenExams,
  onOpenProgress,
}: StudentDashboardTabProps) {
  const overview = useMemo(() => {
    const displayItems = [];

    if (selectedExam) {
      displayItems.push({
        title: selectedExam.title,
        subtitle: "Эхлэхэд бэлэн",
        questions: selectedExam.questions.length || 0,
        date: selectedExam.createdAt,
      });
    }

    studentHistory.slice(0, 3).forEach((item) => {
      displayItems.push({
        title: item.title,
        subtitle: item.percentage >= 80 ? "Сайн үр дүн" : "Дахин давтах",
        questions: item.totalPoints ?? 25,
        date: item.date,
      });
    });

    return displayItems.slice(0, 3).map((item, index) => ({
      ...item,
      ...examAccentPalette[index % examAccentPalette.length],
      ...formatExamDate(item.date),
    }));
  }, [selectedExam, studentHistory]);

  const progressSeries = useMemo(() => {
    const recentValues = studentHistory
      .slice(0, 6)
      .reverse()
      .map((item) => Math.max(0, Math.min(100, item.percentage)));

    const values = recentValues.length === 0 ? [0] : recentValues;

    const points = values.map((value, index) => ({
      label: `#${index + 1}`,
      value,
    }));

    const latest = points[points.length - 1]?.value ?? 0;
    const previous = points[points.length - 2]?.value ?? latest;

    return {
      hasData: recentValues.length > 0,
      points,
      latest,
      delta: latest - previous,
      linePath: buildLinePath(values),
      areaPath: buildAreaPath(values),
    };
  }, [studentHistory]);

  const summaryStats = useMemo(() => {
    if (studentHistory.length === 0) return null;
    const total = studentHistory.length;
    const totalPercent = studentHistory.reduce(
      (sum, item) => sum + item.percentage,
      0,
    );
    const average = Math.round(totalPercent / Math.max(total, 1));
    const best = Math.max(...studentHistory.map((item) => item.percentage));
    const latest = studentHistory.reduce((prev, next) =>
      new Date(next.date).getTime() > new Date(prev.date).getTime()
        ? next
        : prev,
    );
    return {
      total,
      average,
      best,
      latestTitle: latest.title,
      latestDate: new Date(latest.date).toLocaleDateString("mn-MN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    };
  }, [studentHistory]);

  const streak = useMemo(() => {
    const historyDays = new Set(
      studentHistory
        .map((item) => toDayKey(item.date))
        .filter((value) => value.length > 0),
    );

    const sortedDays = [...historyDays].sort((left, right) =>
      right.localeCompare(left),
    );

    let days = 0;
    for (let index = 0; index < sortedDays.length; index += 1) {
      if (index === 0) {
        days = 1;
        continue;
      }

      const prev = new Date(sortedDays[index - 1]);
      const current = new Date(sortedDays[index]);
      const diff = Math.round(
        (prev.getTime() - current.getTime()) / 86400000,
      );

      if (diff === 1) {
        days += 1;
      } else {
        break;
      }
    }

    const week = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return historyDays.has(toDayKey(date));
    });

    return {
      days,
      week,
    };
  }, [studentHistory]);

  const xpToNext = Math.max(nextLevel.minXP - studentProgress.xp, 0);
  const firstName = getFirstName(currentUserName);

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-[28px] border border-[#eceaf7] bg-gradient-to-r from-[#eef3ff] via-[#f8f1ff] to-[#fff0f3] p-5 shadow-[0_18px_45px_rgba(78,93,132,0.08)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="text-[1.85rem] font-semibold tracking-[-0.03em] text-slate-900">
            Тавтай морил, {firstName}!
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Өнөөдрийн шалгалтаа амжилттай өгье.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-2xl bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
          <Sparkles className="h-4 w-4 text-[#b74bf6]" />
          {currentRank ? (
            <span>
              Чансаа #{currentRank}{" "}
              <span className="font-normal text-slate-400">
                / {studentCount || 1}
              </span>
            </span>
          ) : (
            <span className="text-slate-500">Чансаа удахгүй шинэчлэгдэнэ</span>
          )}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.85fr)_minmax(320px,0.85fr)]">
        <div className="rounded-[28px] border border-[#eceaf7] bg-white p-5 shadow-[0_18px_45px_rgba(78,93,132,0.08)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                Ирэх шалгалтууд
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Дараагийн шалгалтаа хурдан харах боломж.
              </p>
            </div>
            <button
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#5c6cff] transition hover:text-[#4052f7]"
              onClick={onOpenExams}
            >
              Бүгдийг харах
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {loading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[104px] animate-pulse rounded-[24px] border border-[#eceaf7] bg-[#f8f9ff]"
                  />
                ))
              : overview.length > 0
                ? overview.map((item, index) => (
                  <div
                    key={`${item.title}-${index}`}
                    className="flex flex-col gap-4 rounded-[24px] border border-[#eceaf7] bg-white p-4 shadow-[0_10px_30px_rgba(88,94,138,0.06)] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`grid h-14 w-14 place-items-center rounded-[20px] ${item.badge} text-white shadow-[0_14px_28px_rgba(76,92,145,0.18)]`}
                      >
                        <BookOpen className="h-5 w-5" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-base font-semibold text-slate-900">
                            {item.title}
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ${item.soft} ${item.text}`}
                          >
                            {item.subtitle}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4" />
                            {item.dateLabel}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 className="h-4 w-4" />
                            {item.timeLabel}
                          </span>
                          <span>{item.questions} асуулт</span>
                        </div>
                      </div>
                    </div>

                    <button
                      className="inline-flex items-center gap-2 self-start rounded-2xl bg-[#f5f4ff] px-4 py-2 text-sm font-semibold text-[#5c6cff] transition hover:bg-[#ece9ff] sm:self-center"
                      onClick={onOpenExams}
                    >
                      Нээх
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ))
                : (
                  <div className="rounded-[24px] border border-dashed border-[#eceaf7] bg-[#fbfbff] px-4 py-6 text-center text-sm text-slate-400">
                    Одоогоор харах шалгалт алга.
                  </div>
                )}
          </div>
        </div>

        <div className="rounded-[28px] border border-[#eceaf7] bg-white p-5 shadow-[0_18px_45px_rgba(78,93,132,0.08)] sm:p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-[#e8f8ef] text-[#42a873]">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                Сүүлийн үзүүлэлт
              </h3>
              <p className="text-sm text-slate-400">
                Таны бодит дүн дээр суурилсан хураангуй
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {!summaryStats ? (
              <div className="rounded-[22px] border border-dashed border-[#eceaf7] bg-[#fbfcff] px-4 py-5 text-sm text-slate-400">
                Одоогоор шалгалтын бодит мэдээлэл алга.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-[#eceaf7] bg-[#fbfcff] px-4 py-4">
                  <div className="text-xs text-slate-400">Нийт өгсөн</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">
                    {summaryStats.total}
                  </div>
                </div>
                <div className="rounded-[22px] border border-[#eceaf7] bg-[#fbfcff] px-4 py-4">
                  <div className="text-xs text-slate-400">Дундаж хувь</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">
                    {summaryStats.average}%
                  </div>
                </div>
                <div className="rounded-[22px] border border-[#eceaf7] bg-[#fbfcff] px-4 py-4">
                  <div className="text-xs text-slate-400">Хамгийн өндөр</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">
                    {summaryStats.best}%
                  </div>
                </div>
                <div className="rounded-[22px] border border-[#eceaf7] bg-[#fbfcff] px-4 py-4">
                  <div className="text-xs text-slate-400">Сүүлийн шалгалт</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">
                    {summaryStats.latestTitle}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {summaryStats.latestDate}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.85fr)_minmax(320px,0.85fr)]">
        <div className="rounded-[28px] border border-[#eceaf7] bg-white p-5 shadow-[0_18px_45px_rgba(78,93,132,0.08)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[#6a5cff] to-[#8d65ff] text-white">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  Ахицын тойм
                </h3>
                <p className="text-sm text-slate-400">
                  Сүүлийн шалгалтуудын дундаж
                </p>
              </div>
            </div>

            <button
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#5c6cff] transition hover:text-[#4052f7]"
              onClick={onOpenProgress}
            >
              Дэлгэрэнгүй
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-end gap-3">
            <div className="text-5xl font-semibold tracking-[-0.04em] text-slate-900">
              {progressSeries.latest}%
            </div>
            <div
              className={`mb-2 inline-flex items-center gap-1 text-sm font-semibold ${
                progressSeries.delta >= 0 ? "text-[#4ab88f]" : "text-[#ff7a59]"
              }`}
            >
              {progressSeries.delta >= 0 ? "+" : ""}
              {progressSeries.delta}% <TrendingUp className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[24px] bg-gradient-to-b from-[#f6f3ff] via-[#fcfbff] to-white p-4">
            {progressSeries.hasData ? (
              <>
                <svg
                  viewBox="0 0 100 34"
                  preserveAspectRatio="none"
                  className="h-40 w-full"
                  aria-label="Сурагчийн ахицын график"
                  role="img"
                >
                  <defs>
                    <linearGradient id="student-progress-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#b84df5" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  <path d={progressSeries.areaPath} fill="url(#student-progress-fill)" />
                  <path
                    d={progressSeries.linePath}
                    fill="none"
                    stroke="#7b61ff"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                  />
                </svg>

                <div className="mt-4 grid grid-cols-6 text-center text-xs text-slate-300">
                  {progressSeries.points.map((point) => (
                    <span key={point.label}>{point.label}</span>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-slate-400">
                Одоогоор ахицын мэдээлэл алга.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[28px] bg-[#f7762a] p-5 text-white shadow-[0_22px_50px_rgba(247,118,42,0.25)] sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm text-white/80">Тасралтгүй өдрүүд</div>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-[-0.04em]">
                  {streak.days}
                </span>
                <span className="pb-2 text-lg text-white/80">өдөр</span>
              </div>
            </div>

            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/18">
              <Flame className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-8">
            <div className="text-sm text-white/80">Энэ долоо хоног</div>
            <div className="mt-4 grid grid-cols-7 gap-2 text-center">
              {streak.week.map((active, index) => (
                <div key={`${weekLabels[index]}-${index}`}>
                  <div
                    className={`mx-auto grid h-8 w-8 place-items-center rounded-full border text-[11px] font-semibold ${
                      active
                        ? "border-white/25 bg-white text-[#f7762a]"
                        : "border-dashed border-white/50 bg-transparent text-white/80"
                    }`}
                  >
                    {active ? <Flame className="h-3.5 w-3.5" /> : ""}
                  </div>
                  <div className="mt-2 text-[11px] text-white/75">
                    {weekLabels[index]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-[20px] bg-white/14 px-4 py-3 text-center text-sm text-white/90">
            Сайн байна! {xpToNext > 0 ? `${xpToNext} XP` : "Та аль хэдийн"}
            {xpToNext > 0 ? " хэрэгтэй" : ""} байна. Дараагийн түвшин{" "}
            {levelInfo.level + (xpToNext > 0 ? 1 : 0)}.
          </div>
        </div>
      </section>
    </div>
  );
}
