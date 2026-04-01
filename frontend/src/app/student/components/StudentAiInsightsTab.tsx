"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Flame,
  Gauge,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import {
  buildStudentAiInsight,
  buildStudentAiInsightSignature,
  formatInsightRefreshCountdown,
  getMsUntilNextInsightRefresh,
  getStudentAiInsightBucket,
  type StudentAiInsightSnapshot,
} from "./student-ai-insights";

type StudentAiInsightsTabProps = {
  currentUserId: string | null;
  currentUserName: string;
  currentXp: number;
  currentRank: number | null;
  totalStudents: number;
  levelInfo: {
    level: number;
    name: string;
    minXP: number;
  };
  studentHistory: {
    examId: string;
    title: string;
    percentage: number;
    date: string;
  }[];
};

const STORAGE_PREFIX = "student-ai-insights-v1";

const cardClass =
  "rounded-[28px] border border-[#e8ecfb] bg-white p-5 shadow-[0_18px_45px_rgba(78,93,132,0.08)]";

const getStorageKey = (userId: string | null) => `${STORAGE_PREFIX}:${userId ?? "guest"}`;

export default function StudentAiInsightsTab({
  currentUserId,
  currentUserName,
  currentXp,
  currentRank,
  totalStudents,
  levelInfo,
  studentHistory,
}: StudentAiInsightsTabProps) {
  const [bucket, setBucket] = useState(() => getStudentAiInsightBucket());
  const [snapshot, setSnapshot] = useState<StudentAiInsightSnapshot | null>(null);
  const [refreshCountdown, setRefreshCountdown] = useState(() =>
    formatInsightRefreshCountdown(getMsUntilNextInsightRefresh()),
  );

  const signature = useMemo(
    () =>
      buildStudentAiInsightSignature({
        currentUserName,
        levelInfo,
        currentXp,
        currentRank,
        totalStudents,
        studentHistory,
      }),
    [currentUserName, levelInfo, currentRank, currentXp, studentHistory, totalStudents],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setBucket(getStudentAiInsightBucket());
    }, getMsUntilNextInsightRefresh());

    return () => window.clearTimeout(timeoutId);
  }, [bucket]);

  useEffect(() => {
    const updateCountdown = () => {
      setRefreshCountdown(
        formatInsightRefreshCountdown(getMsUntilNextInsightRefresh()),
      );
    };

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, [bucket]);

  useEffect(() => {
    const storageKey = getStorageKey(currentUserId);
    const cached = window.localStorage.getItem(storageKey);

    if (cached) {
      try {
        const parsed = JSON.parse(cached) as StudentAiInsightSnapshot;
        if (parsed.bucket === bucket && parsed.signature === signature) {
          setSnapshot(parsed);
          return;
        }
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }

    const nextSnapshot = buildStudentAiInsight({
      bucket,
      currentUserName,
      levelInfo,
      currentXp,
      currentRank,
      totalStudents,
      studentHistory,
    });

    setSnapshot(nextSnapshot);
    window.localStorage.setItem(storageKey, JSON.stringify(nextSnapshot));
  }, [bucket, currentRank, currentUserId, currentUserName, currentXp, levelInfo, signature, studentHistory, totalStudents]);

  if (!snapshot) {
    return (
      <section className="space-y-6">
        <div className="h-44 animate-pulse rounded-[32px] border border-[#e8ecfb] bg-white" />
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-[28px] border border-[#e8ecfb] bg-white" />
          <div className="h-72 animate-pulse rounded-[28px] border border-[#e8ecfb] bg-white" />
        </div>
      </section>
    );
  }

  const generatedDate = new Date(snapshot.generatedAt);
  const generatedLabel = Number.isNaN(generatedDate.getTime())
    ? "Саяхан"
    : generatedDate.toLocaleString("mn-MN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  const rankLabel =
    currentRank && totalStudents > 0
      ? `#${currentRank} / ${totalStudents}`
      : "Тооцогдож байна";

  const averageScore = snapshot.stats.average;
  const nextLevelXp = Math.max(levelInfo.minXP + 150 - currentXp, 0);
  const summaryCards = [
    {
      label: "Одоогийн түвшин",
      value: `Түвшин ${levelInfo.level}`,
      helper: levelInfo.name,
      icon: Trophy,
      tone: "text-[#5167f6] bg-[#eef2ff]",
    },
    {
      label: "XP эрэмбэ",
      value: rankLabel,
      helper: `${currentXp} XP цугларсан`,
      icon: Award,
      tone: "text-[#f08b3e] bg-[#fff3e7]",
    },
    {
      label: "Дундаж оноо",
      value: `${averageScore}%`,
      helper: snapshot.stats.trendLabel,
      icon: Gauge,
      tone: "text-[#0f9f77] bg-[#ebfbf5]",
    },
    {
      label: "Дараагийн зорилт",
      value: `${nextLevelXp} XP`,
      helper: "Дараагийн түвшин хүртэл",
      icon: Flame,
      tone: "text-[#d94f70] bg-[#fff0f4]",
    },
  ];

  const subjectStatusMeta = {
    strong: {
      label: "Давуу гүйцэтгэл",
      icon: CheckCircle2,
      chipClass: "bg-emerald-50 text-emerald-700",
      barClass: "bg-emerald-500",
      panelClass: "border-emerald-100 bg-[linear-gradient(180deg,#ffffff_0%,#f7fdf9_100%)]",
    },
    focus: {
      label: "Анхаарах шаардлагатай",
      icon: CircleAlert,
      chipClass: "bg-amber-50 text-amber-700",
      barClass: "bg-amber-500",
      panelClass: "border-amber-100 bg-[linear-gradient(180deg,#ffffff_0%,#fffaf4_100%)]",
    },
    steady: {
      label: "Тогтвортой түвшин",
      icon: BarChart3,
      chipClass: "bg-[#eef2ff] text-[#5167f6]",
      barClass: "bg-[#7b8cff]",
      panelClass: "border-[#edf1ff] bg-[#fbfcff]",
    },
  } as const;

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-[32px] border border-[#dfe4ff] bg-[linear-gradient(135deg,#ffffff_0%,#f7f9ff_54%,#eef4ff_100%)] px-5 py-6 shadow-[0_24px_60px_rgba(77,92,148,0.10)] sm:px-6 lg:px-8">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#dfe7ff] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-[#edf7ff] blur-3xl" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#5167f6]">
              <BrainCircuit className="h-3.5 w-3.5" />
              AI дүгнэлт
            </div>
            <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-slate-900">
              Чиний суралцах явцын зөвлөмж
            </h2>
            <p className="mt-2 text-base text-slate-500">
              Энэ хэсэг нь чиний дүн, XP, сүүлийн оролдлогууд дээр тулгуурлан
              анхаарах сэдэв, давуу тал, дараагийн алхмыг санал болгоно.
            </p>
          </div>

          <div className="w-full max-w-[320px] rounded-[24px] border border-[#d9e2ff] bg-white/90 p-4 shadow-[0_18px_34px_rgba(79,93,132,0.08)]">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Сүүлд шинэчлэгдсэн
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{generatedLabel}</div>
            <div className="mt-2 text-sm text-slate-500">
              Энэ дүгнэлт 5 цаг тутам шинэчлэгдэж, ижил өгөгдөлтэй үед ч өөр өнцгөөс зөвлөмж өгнө.
            </div>
            <div className="mt-3 rounded-2xl border border-[#e8ecfb] bg-[#fbfcff] px-3 py-2 text-sm font-medium text-slate-600">
              Дараагийн шинэчлэлт: <span className="text-slate-900">{refreshCountdown}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-[26px] border border-[#e8ecfb] bg-white/95 px-5 py-5 shadow-[0_18px_40px_rgba(78,93,132,0.07)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {item.label}
                  </div>
                  <div className="mt-3 text-[1.55rem] font-semibold tracking-[-0.04em] text-slate-900">
                    {item.value}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">{item.helper}</div>
                </div>
                <div className={`grid h-12 w-12 place-items-center rounded-2xl ${item.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div className={`${cardClass} relative overflow-hidden`}>
          <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[#eef4ff] blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#5167f6]">
              <Sparkles className="h-4 w-4" />
              AI-ийн ерөнхий дүгнэлт
            </div>
            <h3 className="mt-4 text-[1.6rem] font-semibold tracking-[-0.04em] text-slate-900">
              {snapshot.headline}
            </h3>
            <p className="mt-3 text-base leading-8 text-slate-600">{snapshot.summary}</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[22px] border border-[#e8ecfb] bg-[#fbfcff] px-4 py-4">
                <div className="text-xs text-slate-400">Дундаж оноо</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {snapshot.stats.average}%
                </div>
              </div>
              <div className="rounded-[22px] border border-[#e8ecfb] bg-[#fbfcff] px-4 py-4">
                <div className="text-xs text-slate-400">Хамгийн өндөр</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {snapshot.stats.best}%
                </div>
              </div>
              <div className="rounded-[22px] border border-[#e8ecfb] bg-[#fbfcff] px-4 py-4">
                <div className="text-xs text-slate-400">Шалгалтын тоо</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {snapshot.stats.examCount}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-[#e8ecfb] bg-white px-4 py-4">
                <div className="text-xs text-slate-400">XP эрэмбэ</div>
                <div className="mt-2 text-xl font-semibold text-slate-900">{rankLabel}</div>
                <div className="mt-1 text-xs text-slate-500">
                  Одоогийн түвшин: {levelInfo.name}
                </div>
              </div>
              <div className="rounded-[22px] border border-[#e8ecfb] bg-white px-4 py-4">
                <div className="text-xs text-slate-400">Явцын төлөв</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">
                  {snapshot.stats.trendLabel}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {snapshot.stats.consistencyLabel}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-[#e8ecfb] bg-[#fffaf2] px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#c88412]">
                <Lightbulb className="h-4 w-4" />
                Өнөөдрийн урам
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-700">{snapshot.encouragement}</p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className={`${cardClass} bg-[linear-gradient(180deg,#ffffff_0%,#fbfdfb_100%)]`}>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#31a16b]">
              <TrendingUp className="h-4 w-4" />
              Давуу тал
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
              {snapshot.strengths.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-[18px] border border-emerald-100 bg-[#f7fbf8] px-4 py-3"
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>{item}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className={`${cardClass} bg-[linear-gradient(180deg,#ffffff_0%,#fffaf4_100%)]`}>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#ef8c46]">
              <CircleAlert className="h-4 w-4" />
              Анхаарах зүйл
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
              {snapshot.focusAreas.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-[18px] border border-amber-100 bg-[#fff9f4] px-4 py-3"
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <div>{item}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className={`${cardClass} bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_100%)]`}>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <BarChart3 className="h-4 w-4 text-[#5167f6]" />
            Сэдвийн ажиглалт
          </div>
          <div className="mt-1 text-sm text-slate-500">
            Аль сэдэв дээр тогтвортой, аль хэсэг дээр илүү ажиллах хэрэгтэйг харуулна.
          </div>
          <div className="mt-4 space-y-3">
            {snapshot.subjectSignals.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-[#dfe5fb] bg-[#fbfcff] px-4 py-5 text-sm text-slate-400">
                Илүү олон шалгалтын дараа сэдэв тус бүрийн зөвлөмж энд гарч ирнэ.
              </div>
            ) : (
              snapshot.subjectSignals.map((subject) => (
                <div
                  key={subject.subject}
                  className={`rounded-[20px] border px-4 py-4 ${subjectStatusMeta[subject.status].panelClass}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white shadow-[0_10px_24px_rgba(59,78,111,0.08)]">
                        {(() => {
                          const Icon = subjectStatusMeta[subject.status].icon;
                          return <Icon className="h-4 w-4 text-slate-700" />;
                        })()}
                      </div>
                      <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {subject.subject}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {subjectStatusMeta[subject.status].label}
                      </div>
                    </div>
                    </div>
                    <div
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${subjectStatusMeta[subject.status].chipClass}`}
                    >
                      {subject.average}%
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e8eefc]">
                    <div
                      className={`h-full rounded-full ${subjectStatusMeta[subject.status].barClass}`}
                      style={{ width: `${Math.min(100, Math.max(0, subject.average))}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`${cardClass} bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]`}>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Target className="h-4 w-4 text-[#5167f6]" />
            Дараагийн алхам
          </div>
          <div className="mt-2 text-sm text-slate-500">
            Энэ 3 алхмыг дарааллаар нь хийвэл дараагийн шалгалтад илүү тогтвортой өсөлт гарна.
          </div>
          <div className="mt-5 space-y-4">
            {snapshot.actionPlan.map((item, index) => (
              <div
                key={item}
                className="flex gap-4 rounded-[22px] border border-[#e8ecfb] bg-white px-4 py-4 shadow-[0_14px_30px_rgba(77,92,148,0.06)]"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#eef2ff] text-sm font-semibold text-[#5167f6]">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Clock3 className="h-4 w-4 text-[#5167f6]" />
                    Алхам {index + 1}
                  </div>
                  <div className="mt-1 text-sm leading-7 text-slate-700">{item}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
