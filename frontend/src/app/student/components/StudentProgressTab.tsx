import { useMemo, useState } from "react";
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
  getSubjectLabelAliases,
  localizeSubjectLabel,
  type SubjectInsightDetail,
} from "./student-progress-insights";
import { formatCompactStudentPoints } from "./student-ui-text";

type StudentHistoryItem = {
  examId: string;
  title: string;
  percentage: number;
  score?: number;
  totalPoints?: number;
  grade?: "A" | "B" | "C" | "D" | "F";
  date: string;
};

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
  studentHistory: StudentHistoryItem[];
};

const scoreColors = [
  "bg-[#59c58d]",
  "bg-[#5a68ef]",
  "bg-[#df5aa8]",
  "bg-[#4b82f1]",
  "bg-[#f3a339]",
] as const;

const progressTrackClass = "bg-[#edf2ff]";

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

  return "Бусад шалгалтаас арай доогуур тул тогтвортой давтлага нэмээрэй.";
};

const formatExamDate = (value: string) =>
  new Date(value).toLocaleDateString("sv-SE").replace(/-/g, ".");

const resolveGrade = (item: StudentHistoryItem) => {
  if (item.grade) return item.grade;
  if (item.percentage >= 90) return "A";
  if (item.percentage >= 80) return "B";
  if (item.percentage >= 70) return "C";
  if (item.percentage >= 60) return "D";
  return "F";
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
  subjectInsights: _subjectInsights = {},
  studentHistory,
}: StudentProgressTabProps) {
  const [selectedExamResult, setSelectedExamResult] =
    useState<StudentHistoryItem | null>(null);
  const [aiSummaryOpen, setAiSummaryOpen] = useState(false);

  const orderedHistory = useMemo(
    () =>
      [...studentHistory].sort(
        (left, right) =>
          new Date(right.date).getTime() - new Date(left.date).getTime(),
      ),
    [studentHistory],
  );

  const averageScore = average(studentHistory.map((item) => item.percentage));
  const xpToNext = Math.max(nextLevel.minXP - studentProgress.xp, 0);
  const aiSummaryLabel = `Хиймэл оюуны ерөнхий дүгнэлт. Дараагийн түвшин хүртэл ${xpToNext} оноо үлдсэн.`;

  const examResultCards = orderedHistory.map((item, index) => {
    const previousExam = orderedHistory[index + 1] ?? null;
    const delta = previousExam ? item.percentage - previousExam.percentage : null;

    return {
      ...item,
      grade: resolveGrade(item),
      delta,
    };
  });

  const bestExam = examResultCards[0]
    ? [...examResultCards].sort((left, right) => right.percentage - left.percentage)[0]
    : null;
  const weakestExam = examResultCards[0]
    ? [...examResultCards].sort((left, right) => left.percentage - right.percentage)[0]
    : null;

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
      name: `Түвшин ${currentLevel || levelInfo.level}`,
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

  const strongExams = [...examResultCards]
    .sort((left, right) => right.percentage - left.percentage)
    .slice(0, 3);
  const focusExams = [...examResultCards]
    .sort((left, right) => left.percentage - right.percentage)
    .slice(0, Math.min(2, examResultCards.length));

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
      message: bestExam
        ? `Таны хамгийн өндөр дүнтэй шалгалт ${bestExam.title} байна.`
        : "Таны онцгой сайн ахиц энд харагдана.",
      accent: "#8a63ff",
      borderColor: "#eadcff",
      iconStrokeWidth: 1.9,
    },
    {
      icon: Star,
      message: bestExam
        ? `${bestExam.title} дээр та ${bestExam.percentage}% авч хамгийн сайн үзүүлэлт гаргасан байна.`
        : "Хамгийн сайн үзүүлэлттэй шалгалт энд гарна.",
      accent: "#4d79ff",
      borderColor: "#d9e4ff",
      iconStrokeWidth: 2,
    },
    {
      icon: Target,
      message: weakestExam
        ? `${weakestExam.title} шалгалтын агуулга дээр илүү анхаарал тавиарай.`
        : "Дараагийн анхаарах шалгалтын зөвлөмж энд гарна.",
      accent: "#f1a12d",
      borderColor: "#f7e1bd",
      iconStrokeWidth: 2,
    },
  ] as const;

  const closeExamDetail = () => setSelectedExamResult(null);
  const closeAiSummary = () => setAiSummaryOpen(false);
  const resolveExamInsight = (examTitle: string, percentage: number) => {
    for (const alias of getSubjectLabelAliases(examTitle)) {
      const insight = _subjectInsights[alias];
      if (insight) {
        return insight;
      }
    }

    return buildFallbackSubjectInsightDetail(
      localizeSubjectLabel(examTitle),
      percentage,
    );
  };

  if (loading) {
    return (
      <section aria-label="student-progress-loading" className="space-y-4">
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
                    ТА
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  Түвшин {currentLevel || levelInfo.level}
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
                {formatCompactStudentPoints(currentXp)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-y-5 lg:grid-cols-2 lg:gap-x-7 xl:grid-cols-[616px_616px] xl:justify-between">
        <div className="w-full space-y-4 xl:w-[616px] xl:max-w-[616px]">
          <h3 className="text-[1.75rem] font-semibold tracking-[-0.045em] text-slate-900">
            Шалгалтын дүн
          </h3>

          {examResultCards.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-[#d9e4ff] bg-white px-5 py-8 text-sm text-slate-400">
              Одоогоор өгсөн шалгалтын дүнгийн мэдээлэл алга байна.
            </div>
          ) : (
            examResultCards.map((item, index) => (
              <button
                key={item.examId}
                type="button"
                onClick={() => setSelectedExamResult(item)}
                className="flex min-h-[102px] w-full flex-col justify-between rounded-[20px] border border-[#d9e4ff] bg-white px-4 py-4 text-left shadow-[0_10px_24px_-24px_rgba(79,93,132,0.2)] transition hover:border-[#c7d7ff] hover:shadow-[0_16px_32px_-28px_rgba(79,93,132,0.28)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[1rem] font-semibold text-slate-900">
                    {item.title}
                  </div>
                  <div className="flex items-center gap-1.5 text-[0.98rem] font-semibold text-slate-700">
                    {item.percentage}%
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 text-[0.86rem] text-slate-400">
                  <span>{formatExamDate(item.date)}</span>
                  <span>
                    {item.score ?? 0}/{item.totalPoints ?? 0} оноо
                  </span>
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
                Хиймэл оюуны ерөнхий дүгнэлт
              </span>
            </div>
            <ChevronRight
              className="h-5 w-5 shrink-0 text-[#3e6ef5]"
              strokeWidth={2.4}
            />
          </button>
        </div>
      </div>

      {selectedExamResult && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/40 px-4 py-8 backdrop-blur-sm"
              onClick={closeExamDetail}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="student-exam-result-title"
                className="mx-auto w-full max-w-[540px] overflow-hidden rounded-[30px] border border-[#d8defb] bg-white shadow-[0_28px_70px_rgba(32,40,68,0.28)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-4 bg-[#4568ed] px-6 py-6 text-white sm:px-7">
                  <h3
                    id="student-exam-result-title"
                    className="text-[2rem] font-semibold tracking-[-0.05em]"
                  >
                    {selectedExamResult.title}
                  </h3>

                  <button
                    type="button"
                    aria-label="Шалгалтын дүн popup хаах"
                    onClick={closeExamDetail}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition hover:bg-white/10"
                  >
                    <X className="h-7 w-7" strokeWidth={2.2} />
                  </button>
                </div>

                <div className="space-y-5 px-6 py-6 sm:px-7 sm:py-7">
                  {(() => {
                    const examInsight = resolveExamInsight(
                      selectedExamResult.title,
                      selectedExamResult.percentage,
                    );
                    const recentMistakes = examInsight.recentMistakes ?? [];
                    const recentStrengths = examInsight.recentStrengths ?? [];
                    const examMistakes =
                      recentMistakes.filter(
                        (item) => item.examTitle === selectedExamResult.title,
                      );
                    const visibleMistakes =
                      examMistakes.length > 0
                        ? examMistakes.slice(0, 2)
                        : recentMistakes.slice(0, 2);
                    const examStrengths =
                      recentStrengths.filter(
                        (item) => item.examTitle === selectedExamResult.title,
                      );
                    const visibleStrengths =
                      examStrengths.length > 0
                        ? examStrengths.slice(0, 2)
                        : recentStrengths.slice(0, 2);
                    const fallbackConcernRows = examInsight.concerns.slice(0, 2);
                    const fallbackStrengthRows = examInsight.strengths.slice(0, 2);

                    return (
                      <>
                        <div className="rounded-[18px] bg-[#f7f9ff] px-4 py-3 text-[0.96rem] text-slate-500">
                          <div className="sr-only">Хувийн дүн</div>
                          <div className="sr-only">Оноо</div>
                          <div className="sr-only">Үнэлгээ</div>
                          <div className="sr-only">Өгсөн огноо</div>
                          {formatExamDate(selectedExamResult.date)} · {selectedExamResult.score ?? 0}/
                          {selectedExamResult.totalPoints ?? 0} оноо · {selectedExamResult.percentage}% ·{" "}
                          {resolveGrade(selectedExamResult)}
                        </div>

                        <section className="rounded-[24px] border border-[#ffd6d3] bg-white px-6 py-5">
                          <div className="flex items-center gap-3 text-[1.02rem] font-semibold text-slate-900">
                            <CircleAlert className="h-5 w-5 text-[#ff4d4f]" />
                            Анхаарах хэрэгтэй
                          </div>
                          <div className="mt-5 space-y-4">
                            {visibleMistakes.length > 0 ? (
                              visibleMistakes.map((item) => (
                                <div
                                  key={`${item.examTitle}-${item.questionText}`}
                                  className="rounded-[18px] bg-[#fffafa] px-4 py-3"
                                >
                                  <p className="text-[1rem] leading-7 text-slate-600">
                                    {item.questionText}
                                  </p>
                                  {item.correctAnswer ? (
                                    <p className="mt-2 text-sm text-[#ef5d52]">
                                      Зөв хариу: {item.correctAnswer}
                                    </p>
                                  ) : null}
                                </div>
                              ))
                            ) : (
                              fallbackConcernRows.map((item) => (
                                <div
                                  key={item.label}
                                  className="flex items-center justify-between gap-4"
                                >
                                  <span className="text-[1rem] text-slate-500">{item.label}</span>
                                  <div className="flex items-center gap-3">
                                    <div className="h-3 w-[104px] overflow-hidden rounded-full bg-[#ffe2e1]">
                                      <div
                                        className="h-full rounded-full bg-[#ff4d4f]"
                                        style={{ width: `${Math.max(12, Math.min(item.score, 100))}%` }}
                                      />
                                    </div>
                                    <span className="w-12 text-right text-[1rem] font-medium text-[#ff4d4f]">
                                      {item.score}%
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </section>

                        <section className="rounded-[24px] border border-[#cef0da] bg-white px-6 py-5">
                          <div className="flex items-center gap-3 text-[1.02rem] font-semibold text-slate-900">
                            <CheckCircle2 className="h-5 w-5 text-[#22c55e]" />
                            Гүйцэтгэл өндөр сэдэв
                          </div>
                          <div className="mt-5 space-y-4">
                            {visibleStrengths.length > 0 ? (
                              visibleStrengths.map((item) => (
                                <div
                                  key={`${item.examTitle}-${item.questionText}`}
                                  className="rounded-[18px] bg-[#fbfffd] px-4 py-3 text-[1rem] leading-7 text-slate-600"
                                >
                                  {item.questionText}
                                </div>
                              ))
                            ) : (
                              fallbackStrengthRows.map((item) => (
                                <div
                                  key={item.label}
                                  className="flex items-center justify-between gap-4"
                                >
                                  <span className="text-[1rem] text-slate-500">{item.label}</span>
                                  <div className="flex items-center gap-3">
                                    <div className="h-3 w-[104px] overflow-hidden rounded-full bg-[#dbf7e6]">
                                      <div
                                        className="h-full rounded-full bg-[#22c55e]"
                                        style={{ width: `${Math.max(12, Math.min(item.score, 100))}%` }}
                                      />
                                    </div>
                                    <span className="w-12 text-right text-[1rem] font-medium text-[#22c55e]">
                                      {item.score}%
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </section>

                        <section className="rounded-[24px] border border-[#f7e7c3] bg-[#fff8eb] px-6 py-5">
                          <div className="flex items-center gap-3 text-[1.02rem] font-semibold text-slate-900">
                            <Lightbulb className="h-5 w-5 text-[#f0a63c]" />
                            Зөвлөгөө
                          </div>
                          <div className="mt-4 space-y-3 text-[1rem] leading-8 text-slate-500">
                            <div>
                              {selectedExamResult.percentage >= 85
                                ? "Энэ шалгалт дээр та маш сайн гүйцэтгэл үзүүлжээ."
                                : selectedExamResult.percentage >= 70
                                  ? "Энэ шалгалтын дүн тогтвортой байна. Алдсан хэсгээ дахин ажиллавал улам ахина."
                                  : "Энэ шалгалтын агуулгыг дахин давтаж, алдаа гарсан асуултууд дээрээ төвлөрөх хэрэгтэй."}
                            </div>
                            <div>
                              {(() => {
                                const selectedIndex = orderedHistory.findIndex(
                                  (item) => item.examId === selectedExamResult.examId,
                                );
                                const previous =
                                  selectedIndex >= 0
                                    ? orderedHistory[selectedIndex + 1]
                                    : null;
                                if (!previous) {
                                  return "Энэ нь таны хамгийн сүүлд өгсөн шалгалтын нэг байна.";
                                }
                                const delta =
                                  selectedExamResult.percentage - previous.percentage;
                                if (delta > 0) {
                                  return `Өмнөх шалгалтаас ${Math.abs(delta)}%-иар өссөн байна.`;
                                }
                                if (delta < 0) {
                                  return `Өмнөх шалгалтаас ${Math.abs(delta)}%-иар буурсан байна.`;
                                }
                                return "Өмнөх шалгалттай ижил түвшний дүн авсан байна.";
                              })()}
                            </div>
                            {examInsight.recommendations.slice(0, 3).map((item) => (
                              <div key={item} className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f0a63c]" />
                                <p>{item}</p>
                              </div>
                            ))}
                          </div>
                        </section>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {aiSummaryOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/45 px-4 py-8 backdrop-blur-sm"
              onClick={closeAiSummary}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="student-ai-summary-title"
                className="mx-auto w-full max-w-[520px] rounded-[34px] border border-[#dce5fb] bg-white px-7 pb-7 pt-7 shadow-[0_34px_90px_rgba(32,40,68,0.3)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 text-[#2f67ed]">
                    <Sparkles className="h-6 w-6" strokeWidth={2} />
                    <div>
                      <h3 id="student-ai-summary-title" className="sr-only">
                        Хиймэл оюуны ерөнхий дүгнэлт
                      </h3>
                      <div className="text-[1.05rem] font-semibold tracking-[-0.04em]">
                      AI-ийн ерөнхий дүгнэлт
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label="Хиймэл оюуны ерөнхий дүгнэлт popup хаах"
                    onClick={closeAiSummary}
                    className="grid h-11 w-11 place-items-center rounded-full text-slate-700 transition hover:bg-slate-50"
                  >
                    <X className="h-8 w-8" strokeWidth={2} />
                  </button>
                </div>

                <h4 className="mt-5 text-[1.95rem] font-semibold leading-[1.36] tracking-[-0.05em] text-slate-900">
                  {aiSnapshot.headline}
                </h4>

                <div className="mt-7 space-y-4">
                  <section className="rounded-[22px] border border-[#c8f1db] bg-[#fcfffd] px-5 py-5">
                    <div className="flex items-center gap-2 text-[1rem] font-semibold text-[#0a9d6f]">
                      <CheckCircle2 className="h-5 w-5" />
                      Сайн байгаа хэсэг
                    </div>
                    <div className="mt-3 space-y-2.5 text-[1rem] leading-8 text-[#0a8a67]">
                      {strongExams.length > 0 ? (
                        strongExams.map((item, index) => (
                          <div key={item.examId}>
                            <span className="font-semibold text-[#0a9d6f]">
                              {index + 1}. {item.title}
                            </span>{" "}
                            <span>{getStrengthRemark(item.percentage)}</span>
                          </div>
                        ))
                      ) : (
                        aiSnapshot.strengths.slice(0, 3).map((item, index) => (
                          <div key={item}>
                            <span className="font-semibold text-[#0a9d6f]">{index + 1}.</span>{" "}
                            <span>{item}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <section className="rounded-[22px] border border-[#ffe0b6] bg-[#fffdfa] px-5 py-5">
                    <div className="flex items-center gap-2 text-[1rem] font-semibold text-[#eb7a1f]">
                      <CircleAlert className="h-5 w-5" />
                      Анхаарах хэсэг
                    </div>
                    <div className="mt-3 space-y-2.5 text-[1rem] leading-8 text-[#d96510]">
                      {focusExams.length > 0 ? (
                        focusExams.map((item, index) => (
                          <div key={item.examId}>
                            <span className="font-semibold text-[#eb7a1f]">
                              {index + 1}. {item.title}
                            </span>{" "}
                            <span>{getFocusRemark(item.percentage)}</span>
                          </div>
                        ))
                      ) : (
                        aiSnapshot.focusAreas.slice(0, 2).map((item, index) => (
                          <div key={item}>
                            <span className="font-semibold text-[#eb7a1f]">{index + 1}.</span>{" "}
                            <span>{item}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[20px] border border-[#d9e8ff] bg-[#f8fbff] px-4 py-4 text-center">
                      <div className="text-[2rem] font-semibold tracking-[-0.04em] text-[#2f67ed]">
                        {aiSnapshot.stats.average}%
                      </div>
                      <div className="mt-1 text-[0.98rem] text-slate-500">Дундаж оноо</div>
                    </div>
                    <div className="rounded-[20px] border border-[#c8f1db] bg-[#fbfffc] px-4 py-4 text-center">
                      <div className="text-[2rem] font-semibold tracking-[-0.04em] text-[#0a9d6f]">
                        {aiSnapshot.stats.best}%
                      </div>
                      <div className="mt-1 text-[0.98rem] text-slate-500">Хамгийн өндөр</div>
                    </div>
                    <div className="rounded-[20px] border border-[#e9ddff] bg-[#fcfbff] px-4 py-4 text-center">
                      <div className="text-[2rem] font-semibold tracking-[-0.04em] text-[#7a3ef1]">
                        {aiSnapshot.stats.examCount}
                      </div>
                      <div className="mt-1 text-[0.98rem] text-slate-500">Өгсөн шалгалт</div>
                    </div>
                  </div>

                  <section className="rounded-[22px] border border-[#edf1f8] bg-[#fcfdff] px-5 py-5">
                    <div className="flex items-center gap-2 text-[1rem] font-semibold text-slate-700">
                      <TrendingUp className="h-5 w-5" />
                      Гүйцэтгэлийн явц
                    </div>
                    <p className="mt-3 text-[1rem] leading-8 text-slate-600">
                      {trendDelta < 0
                        ? "Сүүлийн үед гүйцэтгэл буурсан тул тогтмол давтлага хийх хэрэгтэй."
                        : trendDelta > 0
                          ? "Сүүлийн үед гүйцэтгэл өссөн тул энэ хурдаа хадгалаарай."
                          : "Гүйцэтгэл тогтвортой байна. Давтлагын хэмнэлээ хэвээр хадгалаарай."}
                    </p>
                  </section>

                  <section className="rounded-[22px] border border-[#d9e8ff] bg-[#f8fbff] px-5 py-5">
                    <div className="sr-only">Өнөөдрийн урам</div>
                    <div className="flex items-center gap-2 text-[1rem] font-semibold text-[#2f67ed]">
                      <Lightbulb className="h-5 w-5" />
                      Зөвлөгөө
                    </div>
                    <p className="mt-3 text-[1rem] leading-8 text-[#2f67ed]">
                      {aiSnapshot.encouragement}
                    </p>
                  </section>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={closeAiSummary}
                      className="rounded-[20px] border border-[#d9d9d9] bg-white px-6 py-4 text-[1.05rem] font-medium tracking-[-0.03em] text-slate-700 transition hover:bg-slate-50"
                    >
                      Ойлголоо
                    </button>
                    <button
                      type="button"
                      onClick={closeAiSummary}
                      className="rounded-[20px] bg-[#2f67ed] px-6 py-4 text-[1.05rem] font-medium tracking-[-0.03em] text-white shadow-[0_18px_40px_-18px_rgba(47,103,237,0.78)] transition hover:bg-[#255fe0]"
                    >
                      Давтлага эхлэх
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
