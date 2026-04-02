import { useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Lightbulb,
  Medal,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { buildStudentAiInsight } from "./student-ai-insights";
import {
  average,
  buildFallbackSubjectInsightDetail,
  type SubjectInsightDetail,
  toSubjectLabel,
} from "./student-progress-insights";

type StudentProgressTabProps = {
  loading?: boolean;
  currentUserName: string;
  currentRank: number | null;
  currentXp: number;
  currentLevel: number;
  levelInfo: { level: number; minXP: number };
  studentProgress: { xp: number };
  nextLevel: { minXP: number };
  progressSegments: number;
  subjectInsights?: Record<string, SubjectInsightDetail>;
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

const scoreColors = [
  "bg-[#59c58d]",
  "bg-[#5a68ef]",
  "bg-[#df5aa8]",
  "bg-[#4b82f1]",
  "bg-[#f3a339]",
] as const;

const progressTrackClass = "bg-[#edf2ff]";

const formatCompactXp = (value: number) => {
  if (value >= 1000) {
    const compact =
      value >= 10000 ? Math.round(value / 1000) : Math.round(value / 100) / 10;
    return `${compact.toString().replace(/\.0$/, "")}k`;
  }

  return value.toLocaleString();
};

const getDisplayName = (value: string) => value.trim().split(/\s+/)[0] || value;

const getStrengthRemark = (score: number) => {
  if (score >= 90) {
    return "Маш сайн гүйцэтгэл үзүүлж байна. Ойлголт баттай байна.";
  }

  if (score >= 80) {
    return "Тогтвортой өндөр оноо авч байгаа нь сайн суурьтайг харуулж байна.";
  }

  return "Дундажаас дээш гүйцэтгэлтэй, бага зэрэг сайжруулбал илүү ахиц гарна.";
};

const getFocusRemark = (score: number) => {
  if (score < 70) {
    return "Хамгийн сул үзүүлэлттэй байна, илүү анхаарч ажиллах шаардлагатай.";
  }

  if (score < 80) {
    return "Зарим ойлголт дээр алдаа гарч байгаа тул давтлага хэрэгтэй.";
  }

  return "Бусад сэдвээс арай доогуур тул тогтвортой давтлага нэмээрэй.";
};

export default function StudentProgressTab({
  loading = false,
  currentUserName,
  currentRank,
  currentXp,
  currentLevel,
  levelInfo,
  studentProgress,
  nextLevel,
  progressSegments,
  subjectInsights = {},
  studentHistory,
}: StudentProgressTabProps) {
  const [selectedSubject, setSelectedSubject] = useState<SubjectInsightDetail | null>(null);
  const [aiSummaryOpen, setAiSummaryOpen] = useState(false);
  const orderedHistory = [...studentHistory].sort(
    (left, right) =>
      new Date(right.date).getTime() - new Date(left.date).getTime(),
  );

  const averageScore = average(studentHistory.map((item) => item.percentage));
  const xpToNext = Math.max(nextLevel.minXP - studentProgress.xp, 0);
  const aiSummaryLabel = `AI-ийн ерөнхий дүгнэлт. Дараагийн түвшин хүртэл ${xpToNext} XP үлдсэн.`;

  const subjectSummaries = Array.from(
    orderedHistory.reduce(
      (map, item) => {
        const key = toSubjectLabel(item.title);
        const current = map.get(key) ?? [];
        current.push(item.percentage);
        map.set(key, current);
        return map;
      },
      new Map<string, number[]>(),
    ),
  )
    .map(([subject, scores]) => ({
      subject,
      percentage: average(scores),
    }))
    .sort((left, right) => right.percentage - left.percentage)
    .slice(0, 5);

  const bestSubject = subjectSummaries[0] ?? null;
  const weakestSubject = subjectSummaries[subjectSummaries.length - 1] ?? null;
  const recentAverage = average(
    orderedHistory.slice(0, 2).map((item) => item.percentage),
  );
  const previousAverage = average(
    orderedHistory.slice(2, 4).map((item) => item.percentage),
  );
  const trendDelta =
    orderedHistory.length >= 4 ? recentAverage - previousAverage : 0;
  const stableAverage = averageScore || recentAverage || previousAverage;
  const aiSnapshot = buildStudentAiInsight({
    currentUserName,
    levelInfo: {
      level: currentLevel || levelInfo.level,
      name: `Level ${currentLevel || levelInfo.level}`,
      minXP: levelInfo.minXP,
    },
    currentXp,
    currentRank,
    totalStudents: 0,
    studentHistory: orderedHistory.map((item) => ({
      examId: item.examId,
      title: item.title,
      percentage: item.percentage,
      date: item.date,
    })),
  });
  const strongSubjects = subjectSummaries.slice(0, 3);
  const focusSubjects = [...subjectSummaries]
    .sort((left, right) => left.percentage - right.percentage)
    .slice(0, Math.min(2, subjectSummaries.length));

  const insightCards = [
    {
      icon: TrendingUp,
      message:
        trendDelta > 0
          ? `Таны дундаж дүн өмнөх шалгалтуудаас ${Math.abs(trendDelta)}% өссөн байна.`
          : trendDelta < 0
            ? `Таны дундаж дүн өмнөх шалгалтуудаас ${Math.abs(trendDelta)}% буурсан байна.`
            : `Таны дундаж дүн тогтвортой ${stableAverage}% байна.`,
      accent: "#57c773",
      borderColor: "#d7f0de",
      iconStrokeWidth: 2.1,
    },
    {
      icon: Medal,
      message: bestSubject
        ? `Энэ улиралд та ${bestSubject.subject}-ийн хичээл дээр шилдэг үзүүлэлттэй байна.`
        : "Таны онцгой сайн ахиц энд харагдана.",
      accent: "#8a63ff",
      borderColor: "#eadcff",
      iconStrokeWidth: 1.9,
    },
    {
      icon: Star,
      message: bestSubject
        ? `Таны хамгийн сайн хичээл ${bestSubject.subject} байна.`
        : "Хамгийн сайн үзүүлэлттэй хичээл энд гарна.",
      accent: "#4d79ff",
      borderColor: "#d9e4ff",
      iconStrokeWidth: 2,
    },
    {
      icon: Target,
      message: weakestSubject
        ? `${weakestSubject.subject} хичээлд илүү анхаарал тавиарай.`
        : "Дараагийн анхаарах хичээлийн зөвлөмж энд гарна.",
      accent: "#f1a12d",
      borderColor: "#f7e1bd",
      iconStrokeWidth: 2,
    },
  ] as const;

  const closeSubjectDetail = () => setSelectedSubject(null);
  const closeAiSummary = () => setAiSummaryOpen(false);

  if (loading) {
    return (
      <section
        aria-label="student-progress-loading"
        className="space-y-4"
      >
        <div className="rounded-[28px] border border-[#dfe4ff] bg-white px-6 py-5 shadow-[0_18px_44px_rgba(77,93,138,0.08)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="h-9 w-40 animate-pulse rounded-full bg-[#e4e7f0]" />
              <div className="mt-2 h-5 w-60 animate-pulse rounded-full bg-[#eef2fb]" />
            </div>
            <div className="w-full max-w-[276px] rounded-[20px] border border-[#d9e4ff] bg-[#fbfcff] px-4 py-2.5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 animate-pulse rounded-full bg-[#dfe5fb]" />
                <div className="h-8 w-8 animate-pulse rounded-full bg-[#f4f5fb]" />
                <div className="min-w-0 flex-1">
                  <div className="h-4 w-24 animate-pulse rounded-full bg-[#e4e7f0]" />
                  <div className="mt-2 h-3 w-12 animate-pulse rounded-full bg-[#eef2fb]" />
                </div>
                <div className="h-4 w-12 animate-pulse rounded-full bg-[#e4e7f0]" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-3.5">
            <div className="h-8 w-44 animate-pulse rounded-full bg-[#e4e7f0]" />
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="rounded-[20px] border border-[#d9e4ff] bg-white px-4 py-3.5 shadow-[0_10px_24px_-24px_rgba(79,93,132,0.2)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="h-5 w-24 animate-pulse rounded-full bg-[#e4e7f0]" />
                  <div className="h-5 w-12 animate-pulse rounded-full bg-[#e4e7f0]" />
                </div>
                <div className="mt-3 h-2.5 rounded-full bg-[#eef2fb]">
                  <div className="h-full w-4/5 animate-pulse rounded-full bg-[#dfe5fb]" />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3.5">
            <div className="h-8 w-36 animate-pulse rounded-full bg-[#e4e7f0]" />
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-[58px] animate-pulse rounded-[18px] bg-[#eef2fb]"
              />
            ))}
            <div className="h-[58px] rounded-[18px] border border-[#d9e4ff] bg-white shadow-[0_10px_24px_-24px_rgba(79,93,132,0.2)]">
              <div className="flex h-full items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-[#eef2fb]" />
                  <div className="h-5 w-44 animate-pulse rounded-full bg-[#e4e7f0]" />
                </div>
                <div className="h-5 w-5 animate-pulse rounded-full bg-[#eef2fb]" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-[28px] border border-[#dfe4ff] bg-white px-6 py-4 shadow-[0_18px_44px_rgba(77,93,138,0.08)]">
        <div className="flex min-h-[88px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[1.92rem] font-semibold tracking-[-0.04em] text-slate-900">
              Миний ахиц
            </h2>
            <p className="mt-0.5 text-[1rem] text-slate-400">
              Суралцах явцаа нэг дороос хянаарай
            </p>
            <p className="sr-only">Прогрессийн шат {progressSegments} / 10</p>
          </div>

          <div className="w-full max-w-[326px] rounded-[20px] border border-[#d9e4ff] bg-[#fbfcff] px-5 py-[11px] shadow-[0_12px_28px_-24px_rgba(79,93,132,0.2)]">
            <div className="flex items-center gap-3.5">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[#4f69ef] text-xl font-semibold text-white">
                {currentRank ?? "-"}
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-full bg-[#fff8eb] text-[1.45rem]">
                🧑‍🎓
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="truncate text-[15px] font-semibold text-[#4965ee]">
                    {getDisplayName(currentUserName)}
                  </div>
                  <span className="rounded-full bg-[#5f70ff] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
                    YOU
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  Lvl {currentLevel || levelInfo.level}
                </div>
              </div>
              <div className="flex items-center gap-1 text-[14px] font-semibold text-[#4a66ef]">
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
                {formatCompactXp(currentXp)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-y-5 lg:grid-cols-2 lg:gap-x-7 xl:grid-cols-[616px_616px] xl:justify-between">
        <div className="w-full space-y-4 xl:w-[616px] xl:max-w-[616px]">
          <h3 className="text-[1.75rem] font-semibold tracking-[-0.045em] text-slate-900">
            Хичээлийн дүн
          </h3>

          {subjectSummaries.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-[#d9e4ff] bg-white px-5 py-8 text-sm text-slate-400">
              Одоогоор хичээлийн дүнгийн мэдээлэл алга байна.
            </div>
          ) : (
            subjectSummaries.map((item, index) => (
              <button
                key={item.subject}
                type="button"
                onClick={() =>
                  setSelectedSubject(
                    subjectInsights[item.subject] ??
                      buildFallbackSubjectInsightDetail(
                        item.subject,
                        item.percentage,
                      ),
                  )
                }
                className="flex h-[87px] w-full flex-col justify-between rounded-[20px] border border-[#d9e4ff] bg-white px-4 py-4 text-left shadow-[0_10px_24px_-24px_rgba(79,93,132,0.2)] transition hover:border-[#c7d7ff] hover:shadow-[0_16px_32px_-28px_rgba(79,93,132,0.28)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[1rem] font-semibold text-slate-900">
                    {item.subject}
                  </div>
                  <div className="flex items-center gap-1.5 text-[0.98rem] font-semibold text-slate-700">
                    {item.percentage}%
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
                <div className={`h-2 rounded-full ${progressTrackClass}`}>
                  <div
                    className={`h-full rounded-full ${scoreColors[index % scoreColors.length]}`}
                    style={{ width: `${Math.max(8, Math.min(item.percentage, 100))}%` }}
                  />
                </div>
              </button>
            ))
          )}
        </div>

        <div className="w-full space-y-4 xl:w-[616px] xl:max-w-[616px] xl:justify-self-end">
          <h3 className="flex items-center gap-3 text-[1.88rem] font-semibold tracking-[-0.05em] text-slate-900">
            <Lightbulb className="h-6 w-6 text-[#f0a63c]" strokeWidth={1.9} />
            Дүгнэлт
          </h3>

          {insightCards.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.message}
                className="flex min-h-[75px] items-center gap-3 rounded-[20px] border bg-white px-4 py-[14px] text-[1rem] font-medium leading-[1.32] tracking-[-0.02em] transition-colors"
                style={{
                  borderColor: item.borderColor,
                  color: item.accent,
                }}
              >
                <Icon
                  className="h-5 w-5 shrink-0"
                  strokeWidth={item.iconStrokeWidth}
                />
                <div className="flex-1">{item.message}</div>
              </div>
            );
          })}

          <button
            type="button"
            aria-label={aiSummaryLabel}
            onClick={() => setAiSummaryOpen(true)}
            className="flex min-h-[58px] w-full items-center justify-between rounded-[18px] border border-[#d8e2ff] bg-white px-4 py-[14px] text-left transition-colors hover:border-[#c9d8ff] hover:bg-[#fbfcff]"
          >
            <div className="flex items-center gap-3 text-[#3e6ef5]">
              <Sparkles className="h-5 w-5 shrink-0" strokeWidth={2} />
              <span className="text-[1rem] font-medium leading-6 tracking-[-0.02em]">
                AI-ийн ерөнхий дүгнэлт
              </span>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-[#3e6ef5]" strokeWidth={2.4} />
          </button>
        </div>
      </div>

      {selectedSubject && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/40 px-4 py-8 backdrop-blur-sm"
              onClick={closeSubjectDetail}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="student-subject-ai-title"
                className="mx-auto w-full max-w-[610px] overflow-hidden rounded-[34px] border border-[#d8defb] bg-white shadow-[0_34px_90px_rgba(32,40,68,0.3)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-4 bg-[#4568ed] px-6 py-6 text-white sm:px-7">
                  <h3
                    id="student-subject-ai-title"
                    className="text-[2rem] font-semibold tracking-[-0.05em]"
                  >
                    {selectedSubject.subject}
                  </h3>

                  <button
                    type="button"
                    aria-label="Хичээлийн дүн popup хаах"
                    onClick={closeSubjectDetail}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition hover:bg-white/10"
                  >
                    <X className="h-7 w-7" strokeWidth={2.2} />
                  </button>
                </div>

                <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
                  <section className="rounded-[24px] border border-[#ffd9d5] bg-white px-5 py-5">
                    <div className="flex items-center gap-2 text-[1.02rem] font-semibold text-slate-900">
                      <CircleAlert className="h-5 w-5 text-[#ef5d52]" />
                      Анхаарах хэрэгтэй
                    </div>
                    <div className="mt-5 space-y-4">
                      {selectedSubject.concerns.map((item) => (
                        <div key={item.label} className="space-y-2.5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-[1rem] font-medium text-slate-600">
                              {item.label}
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="h-2.5 w-[96px] overflow-hidden rounded-full bg-[#f7d8d7]">
                                <div
                                  className="h-full rounded-full bg-[#ef5d52]"
                                  style={{ width: `${item.score}%` }}
                                />
                              </div>
                              <div className="min-w-[52px] text-right text-[1rem] font-semibold text-[#ef5d52]">
                                {item.score}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[24px] border border-[#d8f2e5] bg-white px-5 py-5">
                    <div className="flex items-center gap-2 text-[1.02rem] font-semibold text-slate-900">
                      <CheckCircle2 className="h-5 w-5 text-[#47be85]" />
                      Гүйцэтгэл өндөр сэдэв
                    </div>
                    <div className="mt-5 space-y-4">
                      {selectedSubject.strengths.map((item) => (
                        <div key={item.label} className="space-y-2.5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-[1rem] font-medium text-slate-600">
                              {item.label}
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="h-2.5 w-[96px] overflow-hidden rounded-full bg-[#cfeede]">
                                <div
                                  className="h-full rounded-full bg-[#47be85]"
                                  style={{ width: `${item.score}%` }}
                                />
                              </div>
                              <div className="min-w-[52px] text-right text-[1rem] font-semibold text-[#47be85]">
                                {item.score}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[24px] border border-[#f7e7c3] bg-[#fff8eb] px-5 py-5">
                    <div className="flex items-center gap-2 text-[1.02rem] font-semibold text-slate-900">
                      <Lightbulb className="h-5 w-5 text-[#f0a63c]" />
                      Зөвлөгөө
                    </div>
                    <div className="mt-4 space-y-3 text-[1rem] leading-8 text-slate-500">
                      {selectedSubject.recommendations.map((item) => (
                        <div key={item} className="flex items-start gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f0a63c]" />
                          <p>{item}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {aiSummaryOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/50 px-4 py-8 backdrop-blur-sm"
              onClick={closeAiSummary}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="student-ai-summary-title"
                className="mx-auto w-full max-w-[620px] rounded-[34px] border border-[#dde3ff] bg-white p-6 shadow-[0_34px_90px_rgba(32,40,68,0.3)] sm:p-8"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 text-[#4869ef]">
                    <Sparkles className="h-6 w-6" strokeWidth={2} />
                    <h3
                      id="student-ai-summary-title"
                      className="text-[1.1rem] font-semibold tracking-[-0.04em]"
                    >
                      AI-ийн ерөнхий дүгнэлт
                    </h3>
                  </div>

                  <button
                    type="button"
                    aria-label="AI-ийн ерөнхий дүгнэлт popup хаах"
                    onClick={closeAiSummary}
                    className="grid h-11 w-11 place-items-center rounded-full text-slate-700 transition hover:bg-slate-50"
                  >
                    <X className="h-8 w-8" strokeWidth={2} />
                  </button>
                </div>

                <h4 className="mt-5 text-[2rem] font-semibold leading-[1.32] tracking-[-0.05em] text-slate-900">
                  {aiSnapshot.headline}
                </h4>

                <div className="mt-6 space-y-4">
                  <section className="rounded-[24px] border border-[#cfeeda] bg-[#fbfffc] px-5 py-5">
                    <div className="flex items-center gap-2 text-[1.05rem] font-semibold text-[#58c47b]">
                      <CheckCircle2 className="h-5 w-5" />
                      Сайн байгаа хэсэг
                    </div>
                    <div className="mt-4 space-y-2.5 text-[1rem] leading-8 text-slate-700">
                      {strongSubjects.length > 0 ? (
                        strongSubjects.map((item, index) => (
                          <div key={item.subject}>
                            <span className="font-semibold text-[#58c47b]">
                              {index + 1}. {item.subject} ({item.percentage}%)
                            </span>{" "}
                            <span>{getStrengthRemark(item.percentage)}</span>
                          </div>
                        ))
                      ) : (
                        aiSnapshot.strengths.slice(0, 3).map((item, index) => (
                          <div key={item}>
                            <span className="font-semibold text-[#58c47b]">{index + 1}.</span>{" "}
                            <span>{item}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <section className="rounded-[24px] border border-[#f8ddb0] bg-[#fffdf8] px-5 py-5">
                    <div className="flex items-center gap-2 text-[1.05rem] font-semibold text-[#f0a63c]">
                      <CircleAlert className="h-5 w-5" />
                      Анхаарах хэсэг
                    </div>
                    <div className="mt-4 space-y-2.5 text-[1rem] leading-8 text-slate-700">
                      {focusSubjects.length > 0 ? (
                        focusSubjects.map((item, index) => (
                          <div key={item.subject}>
                            <span className="font-semibold text-[#f0a63c]">
                              {index + 1}. {item.subject} ({item.percentage}%)
                            </span>{" "}
                            <span>{getFocusRemark(item.percentage)}</span>
                          </div>
                        ))
                      ) : (
                        aiSnapshot.focusAreas.slice(0, 2).map((item, index) => (
                          <div key={item}>
                            <span className="font-semibold text-[#f0a63c]">{index + 1}.</span>{" "}
                            <span>{item}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[20px] border border-[#d9e4ff] bg-white px-4 py-4 text-center shadow-[0_10px_24px_-26px_rgba(79,93,132,0.22)]">
                      <div className="text-[2rem] font-semibold tracking-[-0.04em] text-[#4965ee]">
                        {aiSnapshot.stats.average}%
                      </div>
                      <div className="mt-1 text-[0.98rem] text-slate-400">Дундаж оноо</div>
                    </div>
                    <div className="rounded-[20px] border border-[#d9e4ff] bg-white px-4 py-4 text-center shadow-[0_10px_24px_-26px_rgba(79,93,132,0.22)]">
                      <div className="text-[2rem] font-semibold tracking-[-0.04em] text-[#4965ee]">
                        {aiSnapshot.stats.best}%
                      </div>
                      <div className="mt-1 text-[0.98rem] text-slate-400">Хамгийн өндөр</div>
                    </div>
                    <div className="rounded-[20px] border border-[#d9e4ff] bg-white px-4 py-4 text-center shadow-[0_10px_24px_-26px_rgba(79,93,132,0.22)]">
                      <div className="text-[2rem] font-semibold tracking-[-0.04em] text-[#4965ee]">
                        {aiSnapshot.stats.examCount}
                      </div>
                      <div className="mt-1 text-[0.98rem] text-slate-400">Өгсөн шалгалт</div>
                    </div>
                  </div>

                  <section className="rounded-[22px] border border-[#d9e4ff] bg-white px-5 py-5 shadow-[0_10px_24px_-26px_rgba(79,93,132,0.18)]">
                    <div className="flex items-center gap-2 text-[1.02rem] font-semibold text-[#4965ee]">
                      <Lightbulb className="h-5 w-5" />
                      Өнөөдрийн урам
                    </div>
                    <p className="mt-3 text-[1rem] leading-8 text-[#5c75d9]">
                      {aiSnapshot.encouragement}
                    </p>
                  </section>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
