import { useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";

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
  onOpenAiInsights?: () => void;
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

type SubjectInsightDetail = {
  subject: string;
  average: number;
  concerns: { label: string; score: number }[];
  strengths: { label: string; score: number }[];
  recommendations: string[];
};

const scoreColors = [
  "bg-[#59c58d]",
  "bg-[#5a68ef]",
  "bg-[#df5aa8]",
  "bg-[#4b82f1]",
  "bg-[#f3a339]",
] as const;

const progressTrackClass = "bg-[#edf2ff]";

const subjectTopicPresets: { match: RegExp; strengths: string[]; concerns: string[] }[] = [
  {
    match: /(math|мат|алгебр|геометр|тригонометр)/i,
    strengths: ["Геометр", "Тригонометр", "Функц"],
    concerns: ["Алгебр", "Матриц", "Тэгшитгэл"],
  },
  {
    match: /(english|англи|vocabulary|reading|grammar|listening)/i,
    strengths: ["Reading", "Listening", "Grammar"],
    concerns: ["Vocabulary", "Spelling", "Sentence use"],
  },
  {
    match: /(physics|физик|mechanics|optics)/i,
    strengths: ["Механик", "Хөдөлгөөн", "Хэмжилт"],
    concerns: ["Оптик", "Цахилгаан", "Томьёо"],
  },
  {
    match: /(chem|хими|organic|atom|periodic)/i,
    strengths: ["Атомын бүтэц", "Химийн холбоо", "Урвал"],
    concerns: ["Тэнцвэржүүлэлт", "Органик", "Томьёо"],
  },
  {
    match: /(history|түүх|нийгэм|social)/i,
    strengths: ["Ойлголт", "Нэр томьёо", "Он цаг"],
    concerns: ["Харьцуулалт", "Шалтгаан үр дагавар", "Дэс дараалал"],
  },
];

const average = (values: number[]) =>
  values.length
    ? Math.round(values.reduce((sum, item) => sum + item, 0) / values.length)
    : 0;

const formatCompactXp = (value: number) => {
  if (value >= 1000) {
    const compact =
      value >= 10000 ? Math.round(value / 1000) : Math.round(value / 100) / 10;
    return `${compact.toString().replace(/\.0$/, "")}k`;
  }

  return value.toLocaleString();
};

const getDisplayName = (value: string) => value.trim().split(/\s+/)[0] || value;

const clampScore = (value: number) => Math.max(20, Math.min(98, Math.round(value)));

const getSubjectPreset = (subject: string) =>
  subjectTopicPresets.find((preset) => preset.match.test(subject)) ?? {
    strengths: ["Ойлголт", "Жишээ бодлого", "Сэдэв холболт"],
    concerns: ["Суурь ойлголт", "Алдаа засвар", "Нэмэлт давтлага"],
  };

const buildSubjectInsightDetail = (
  subject: string,
  averagePercentage: number,
): SubjectInsightDetail => {
  const preset = getSubjectPreset(subject);
  const strengthBase = Math.max(averagePercentage + 10, 72);
  const concernBase = Math.min(averagePercentage - 18, 58);

  const strengths = preset.strengths.slice(0, 2).map((label, index) => ({
    label,
    score: clampScore(strengthBase - index * 4),
  }));

  const concerns = preset.concerns.slice(0, 2).map((label, index) => ({
    label,
    score: clampScore(concernBase + index * 7),
  }));

  return {
    subject,
    average: averagePercentage,
    concerns,
    strengths,
    recommendations: [
      `${concerns[0]?.label ?? "Сул сэдэв"}-ийн дасгалуудыг өдөр бүр бага багаар давтаарай.`,
      `${concerns[1]?.label ?? "Энэ хэсэг"} дээр 5 нэмэлт бодлого ажиллаад баталгаажуулаарай.`,
      `${strengths[0]?.label ?? "Сайн байгаа сэдэв"} дээрх арга барилаа бусад сэдэв дээр туршаад үзээрэй.`,
    ],
  };
};

const toSubjectLabel = (value: string) => {
  const cleaned = value
    .replace(/[_-]+/g, " ")
    .replace(/\bхэлний\b/gi, "хэл")
    .replace(/\bявцын\b/gi, "")
    .replace(/\bавцын\b/gi, "")
    .replace(/\bшалгалт\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const englishStopWords = new Set([
    "exam",
    "final",
    "midterm",
    "quiz",
    "reading",
    "mock",
    "practice",
    "test",
  ]);

  const filteredWords = cleaned
    .split(/\s+/)
    .filter((word) => !englishStopWords.has(word.toLowerCase()));

  if (filteredWords.length === 0) {
    return cleaned || "Хичээл";
  }

  return filteredWords.slice(0, 2).join(" ");
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
  onOpenAiInsights,
  studentHistory,
}: StudentProgressTabProps) {
  const [selectedSubject, setSelectedSubject] = useState<SubjectInsightDetail | null>(null);
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
  const focusGap = weakestSubject
    ? Math.max(stableAverage - weakestSubject.percentage, 0)
    : 0;

  const insightCards = [
    {
      icon: TrendingUp,
      message:
        trendDelta > 0
          ? `Таны дундаж дүн өмнөх шалгалтуудаас ${Math.abs(trendDelta)}% өссөн байна.`
          : trendDelta < 0
            ? `Таны дундаж дүн өмнөх шалгалтуудаас ${Math.abs(trendDelta)}% буурсан байна.`
            : `Таны дундаж дүн тогтвортой ${stableAverage}% байна.`,
      className:
        "border-[#dff3e7] bg-[#ecfbf2] text-[#64c47f]",
    },
    {
      icon: Sparkles,
      message: weakestSubject
        ? `Энэ улиралд та ${weakestSubject.subject}-ийн хичээл дээр дунджаасаа ${focusGap}% доор байна.`
        : "Сул байгаа хичээлийн зөвлөмж энд харагдана.",
      className:
        "border-[#e6dcff] bg-[#f2ecff] text-[#7f56eb]",
    },
    {
      icon: Trophy,
      message: bestSubject
        ? `Таны хамгийн сайн хичээл ${bestSubject.subject} байна.`
        : "Хамгийн сайн үзүүлэлттэй хичээл энд гарна.",
      className:
        "border-[#d9e6ff] bg-[#eaf1ff] text-[#4d7aef]",
    },
    {
      icon: Lightbulb,
      message: weakestSubject
        ? `${weakestSubject.subject} хичээлд илүү анхаарал тавиарай.`
        : "Дараагийн анхаарах хичээлийн зөвлөмж энд гарна.",
      className:
        "border-[#f6e5aa] bg-[#fff5d8] text-[#eea53d]",
    },
  ] as const;

  const handleOpenAiInsights = () => {
    onOpenAiInsights?.();
  };

  const closeSubjectDetail = () => setSelectedSubject(null);

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

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-3.5">
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
                    buildSubjectInsightDetail(item.subject, item.percentage),
                  )
                }
                className="w-full rounded-[20px] border border-[#d9e4ff] bg-white px-4 py-3.5 text-left shadow-[0_10px_24px_-24px_rgba(79,93,132,0.2)] transition hover:border-[#c7d7ff] hover:shadow-[0_16px_32px_-28px_rgba(79,93,132,0.28)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[1.02rem] font-semibold text-slate-900">
                    {item.subject}
                  </div>
                  <div className="flex items-center gap-1.5 text-[1rem] font-semibold text-slate-700">
                    {item.percentage}%
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
                <div className={`mt-3 h-2.5 rounded-full ${progressTrackClass}`}>
                  <div
                    className={`h-full rounded-full ${scoreColors[index % scoreColors.length]}`}
                    style={{ width: `${Math.max(8, Math.min(item.percentage, 100))}%` }}
                  />
                </div>
              </button>
            ))
          )}
        </div>

        <div className="space-y-3.5">
          <h3 className="flex items-center gap-2 text-[1.75rem] font-semibold tracking-[-0.045em] text-slate-900">
            <Lightbulb className="h-5 w-5 text-[#f0a63c]" />
            Дүгнэлт
          </h3>

          {insightCards.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.message}
                className={`flex items-center gap-3 rounded-[18px] border px-4 py-3.5 text-[0.98rem] font-semibold leading-6 shadow-[0_10px_24px_-28px_rgba(79,93,132,0.28)] ${item.className}`}
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/60">
                  <Icon className="h-4 w-4" />
                </div>
                <div>{item.message}</div>
              </div>
            );
          })}

          <button
            type="button"
            aria-label={aiSummaryLabel}
            onClick={handleOpenAiInsights}
            className="flex w-full items-center justify-between rounded-[18px] border border-[#cfdcff] bg-white px-4 py-3.5 text-left shadow-[0_10px_24px_-24px_rgba(79,93,132,0.2)] transition hover:border-[#bfcfff] hover:shadow-[0_16px_32px_-28px_rgba(79,93,132,0.28)]"
          >
            <div className="flex items-center gap-3 text-[#2d63ea]">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-[#eff3ff]">
                <Sparkles className="h-[18px] w-[18px]" strokeWidth={1.9} />
              </div>
              <span className="text-[0.98rem] font-semibold leading-6">
                AI-ийн ерөнхий дүгнэлт
              </span>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-[#2d63ea]" strokeWidth={2.4} />
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
                className="mx-auto w-full max-w-[920px] overflow-hidden rounded-[32px] border border-[#d8defb] bg-[#f8faff] shadow-[0_30px_90px_rgba(32,40,68,0.28)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="border-b border-[#e6ebff] bg-white px-6 py-6 sm:px-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#4f69ef]">
                        <Sparkles className="h-3.5 w-3.5" />
                        Хичээлийн AI тайлбар
                      </div>
                      <h3
                        id="student-subject-ai-title"
                        className="mt-4 text-[2rem] font-semibold tracking-[-0.05em] text-slate-900"
                      >
                        {selectedSubject.subject}
                      </h3>
                      <p className="mt-2 max-w-2xl text-[1rem] leading-8 text-slate-500">
                        Энэ сэдвийн хүчтэй болон анхаарах хэсгүүдийг website-д тохирсон
                        нэгтгэлээр харуулж байна.
                      </p>
                    </div>

                    <button
                      type="button"
                      aria-label="Хичээлийн дүн popup хаах"
                      onClick={closeSubjectDetail}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#dce3ff] bg-white text-slate-500 transition hover:border-[#cbd6ff] hover:text-slate-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <div className="rounded-full bg-[#eef2ff] px-3 py-1.5 text-sm font-semibold text-[#4f69ef]">
                      Сэдвийн дундаж {selectedSubject.average}%
                    </div>
                    <div className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-500 ring-1 ring-inset ring-[#e4e8fb]">
                      {selectedSubject.concerns.length} анхаарах цэг
                    </div>
                    <div className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-500 ring-1 ring-inset ring-[#e4e8fb]">
                      {selectedSubject.strengths.length} давуу тал
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 p-6 sm:p-7 xl:grid-cols-2">
                  <section className="rounded-[24px] border border-[#ffe0df] bg-[#fff5f4] px-5 py-5">
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
                            <div className="text-[1rem] font-semibold text-[#ef5d52]">
                              {item.score}%
                            </div>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-[#f7d8d7]">
                            <div
                              className="h-full rounded-full bg-[#ef5d52]"
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[24px] border border-[#d8f2e5] bg-[#eefcf5] px-5 py-5">
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
                            <div className="text-[1rem] font-semibold text-[#47be85]">
                              {item.score}%
                            </div>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-[#cfeede]">
                            <div
                              className="h-full rounded-full bg-[#47be85]"
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[24px] border border-[#f7e7c3] bg-[#fff8eb] px-5 py-5 xl:col-span-2">
                    <div className="flex items-center gap-2 text-[1.02rem] font-semibold text-slate-900">
                      <Lightbulb className="h-5 w-5 text-[#f0a63c]" />
                      Зөвлөгөө
                    </div>
                    <div className="mt-5 grid gap-3 lg:grid-cols-3">
                      {selectedSubject.recommendations.map((item, index) => (
                        <div
                          key={item}
                          className="rounded-[18px] border border-[#f4e2ba] bg-white/65 px-4 py-4"
                        >
                          <div className="text-sm font-semibold text-[#d89b34]">
                            Алхам {index + 1}
                          </div>
                          <p className="mt-2 text-[0.98rem] leading-7 text-slate-600">
                            {item}
                          </p>
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
    </section>
  );
}
