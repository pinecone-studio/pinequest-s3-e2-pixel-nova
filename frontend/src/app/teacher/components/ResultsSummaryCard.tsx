import {
  AlertTriangleIcon,
  BadgePercentIcon,
  CheckCircle2Icon,
  UsersIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Exam, ExamStatsSummary, QuestionInsight } from "../types";
import TeacherSelect from "./TeacherSelect";
import { badgeClass, cardClass, emptyStateClass } from "../styles";

type ResultsSummaryCardProps = {
  examOptions: Exam[];
  activeExamId: string | null;
  onSelectExam: (value: string) => void;
  examStats: ExamStatsSummary | null;
};

const clampPercent = (value: number) =>
  Math.max(0, Math.min(100, Math.round(value)));

const useAnimatedNumber = (target: number, duration = 700) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(target * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    setDisplayValue(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return displayValue;
};

const getSummaryHeadline = (average: number, passRate: number) => {
  if (average >= 80 && passRate >= 80) return "маш сайн ахицтай явж байна";
  if (average >= 60 && passRate >= 60) {
    return "суурь ойлголттой ч бэхжүүлэх сэдэв байна";
  }
  return "нэмэлт тайлбар, чиглүүлэг хэрэгтэй байна";
};

const getFocusText = (
  examStats: ExamStatsSummary,
  atRiskCount: number,
  passCount: number,
) => {
  if (atRiskCount > 0 && examStats.mostMissed[0]) {
    return `"${examStats.mostMissed[0].text}" асуултаас эхэлж тайлбарлавал хамгийн үр дүнтэй.`;
  }
  if (examStats.passRate < 70) {
    return `${examStats.submissionCount - passCount} сурагчид богино давтлага эсвэл нэмэлт дасгал хэрэгтэй байна.`;
  }
  return "Одоогийн дүн тогтвортой тул дараагийн хичээлдээ ахисан түвшний даалгавар нэмж болно.";
};

const FancyTooltip = ({ text }: { text: string }) => (
  <div className="pointer-events-none absolute left-1/2 top-0 z-20 w-max max-w-[220px] -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.8)] transition duration-200 group-hover:opacity-100">
    {text}
    <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-slate-900" />
  </div>
);

const CircleChart = ({
  label,
  value,
  helper,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  helper: string;
  icon: typeof UsersIcon;
  color: string;
}) => {
  const percent = clampPercent(value);
  const animatedValue = useAnimatedNumber(percent);

  return (
    <div className="rounded-[24px] border border-[#dfe7f3] bg-white px-5 py-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.2)]">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          {label}
        </div>
        <div className="grid size-9 place-items-center rounded-xl border border-[#d9e4f7] bg-[#f3f7ff] text-[#4f7cff]">
          <Icon className="size-4" />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-5">
        <div
          className="grid size-[112px] shrink-0 place-items-center rounded-full transition-all duration-500 ease-out hover:scale-[1.03]"
          style={{
            background: `conic-gradient(${color} 0 ${animatedValue}%, #e8eef8 ${animatedValue}% 100%)`,
            boxShadow: `0 18px 38px -28px ${color}`,
          }}
        >
          <div className="grid size-[78px] place-items-center rounded-full bg-white shadow-[0_10px_28px_-24px_rgba(15,23,42,0.35)] ring-1 ring-[#edf2fb]">
            <div className="text-center">
              <div className="text-2xl font-semibold text-slate-900">
                {animatedValue}%
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Үзүүлэлт
              </div>
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1 text-sm leading-6 text-slate-500">
          {helper}
        </div>
      </div>
    </div>
  );
};

const BarDistributionChart = ({
  examStats,
}: {
  examStats: ExamStatsSummary;
}) => {
  const maxCount = Math.max(
    ...examStats.performanceBands.map((band) => band.count),
    1,
  );

  return (
    <div className="rounded-[24px] border border-[#dfe7f3] bg-white px-5 py-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.2)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Онооны тархалт
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-500">
            Сурагчид аль онооны бүсэд байгааг баганан диаграммаар харуулна.
          </div>
        </div>
        <div className="rounded-full border border-[#d9e4f7] bg-[#f7faff] px-3 py-1 text-xs font-semibold text-slate-500">
          {examStats.submissionCount} илгээлт
        </div>
      </div>

      <div className="mt-6 flex min-h-[220px] items-end gap-4 rounded-[20px] border border-[#eef2f8] bg-[linear-gradient(180deg,#fbfdff_0%,#f7faff_100%)] px-4 py-5">
        {examStats.performanceBands.map((band, index) => {
          const height = Math.max(
            (band.count / maxCount) * 100,
            band.count > 0 ? 12 : 4,
          );
          return (
            <div
              key={band.label}
              className="group relative flex flex-1 flex-col items-center justify-end gap-3"
            >
              <FancyTooltip
                text={`${band.label} бүсэд ${band.count} сурагч байна`}
              />
              <div className="text-xs font-semibold text-slate-500">
                {band.count}
              </div>
              <div className="flex h-[150px] w-full items-end justify-center">
                <div
                  className="w-full max-w-[72px] rounded-t-[18px] shadow-[0_18px_28px_-24px_rgba(79,124,255,0.75)] transition-all duration-500 hover:brightness-105"
                  style={{
                    height: `${height}%`,
                    background: `linear-gradient(180deg, ${band.color || "#4f7cff"} 0%, #4f7cff 100%)`,
                    animation: `result-bar-rise 650ms ${index * 90}ms both`,
                  }}
                />
              </div>
              <div className="text-center text-xs font-semibold text-slate-600">
                {band.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const QuestionCard = ({
  title,
  questions,
  icon: Icon,
  tone,
  emptyText,
}: {
  title: string;
  questions: QuestionInsight[];
  icon: typeof CheckCircle2Icon;
  tone: "good" | "warn";
  emptyText: string;
}) => {
  const toneClasses =
    tone === "good"
      ? {
          border: "border-green-500",
          bg: "bg-[#f8fcf9]",
          badge: "border-[#d6eadb] bg-[#eefaf1] text-[#2f7d56]",
          icon: "text-[#2f7d56]",
        }
      : {
          border: "border-red-500",
          bg: "bg-[#fdfaf7]",
          badge: "border-[#eddccf] bg-[#fbf2ea] text-[#a16228]",
          icon: "text-[#a16228]",
        };

  return (
    <div
      className={`rounded-[24px] border ${toneClasses.border} ${toneClasses.bg} px-5 py-5`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`size-4 ${toneClasses.icon}`} />
        <div className="text-sm font-semibold text-slate-900">{title}</div>
      </div>

      <div className="mt-4 space-y-3">
        {questions.length > 0 ? (
          questions.map((question, index) => (
            <div
              key={`${question.id}-${index}`}
              className="rounded-[18px] border border-white/80 bg-white px-4 py-4 shadow-[0_14px_32px_-30px_rgba(15,23,42,0.28)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Асуулт {index + 1}
                  </div>
                  <div
                    className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-900"
                    title={question.text}
                  >
                    {question.text}
                  </div>
                </div>
                <div className="group relative">
                  <FancyTooltip
                    text={`Зөв хийсэн хувь: ${question.correctRate}%`}
                  />
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses.badge}`}
                  >
                    {question.correctRate}%
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>
                  {question.correctCount}/{question.total} сурагч зөв хийсэн
                </span>
                <span>{question.missCount} буруу</span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[18px] border border-dashed border-[#d9e4f0] bg-white/70 px-4 py-6 text-sm text-slate-400">
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );
};

export default function ResultsSummaryCard({
  examOptions,
  activeExamId,
  onSelectExam,
  examStats,
}: ResultsSummaryCardProps) {
  const atRiskCount = examStats
    ? examStats.questionStats.filter((q) => q.correctRate < 45).length
    : 0;
  const passCount = examStats
    ? Math.round((examStats.submissionCount * examStats.passRate) / 100)
    : 0;
  const attendanceRate = examStats
    ? examStats.cohortSize > 0
      ? (examStats.submissionCount / examStats.cohortSize) * 100
      : 0
    : 0;

  const chartStyles = useMemo(
    () => (
      <style>{`
        @keyframes result-bar-rise {
          from { transform: scaleY(0.2); transform-origin: bottom; opacity: 0.35; }
          to { transform: scaleY(1); transform-origin: bottom; opacity: 1; }
        }
      `}</style>
    ),
    [],
  );

  return (
    <div className={`${cardClass} overflow-hidden`}>
      {chartStyles}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className={badgeClass}>1. Дүнгийн хураангуй</span>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
            Дүнгийн хураангуй
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Ангийн дундаж, ирц, онооны тархалт болон онцлох асуултуудыг нэг дор
            харуулна.
          </p>
        </div>
        <div className="w-full max-w-xs">
          <TeacherSelect
            label="Шалгалт"
            helperText="Дүн харах шалгалтаа сонгоно уу."
            value={activeExamId ?? ""}
            onChange={(e) => onSelectExam(e.target.value)}
            options={
              examOptions.length === 0
                ? [{ value: "", label: "Шалгалт байхгүй", disabled: true }]
                : examOptions.map((exam) => ({
                    value: exam.id,
                    label: exam.title,
                  }))
            }
          />
        </div>
      </div>

      {!examStats && (
        <div className={`mt-6 ${emptyStateClass}`}>
          Дууссан шалгалт сонгоход энд ангийн дундаж, анхаарах асуултууд,
          сурагчдын тайлан харагдана.
        </div>
      )}

      {examStats && (
        <>
          <div className="mt-6 rounded-[24px] border border-[#e3e8ef] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Товч дүгнэлт
                </div>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Анги нийтээрээ{" "}
                  {getSummaryHeadline(examStats.average, examStats.passRate)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {examStats.submissionCount} сурагчийн дүн дээр үндэслэн энэ
                  шалгалтын ерөнхий зургийг нэгтгэлээ.
                </p>
              </div>
              <div className="rounded-[18px] border border-[#e8edf4] bg-white px-4 py-3 text-sm leading-6 text-slate-600 lg:max-w-[320px]">
                <span className="font-semibold text-slate-900">
                  Гол анхаарах зүйл:
                </span>{" "}
                {getFocusText(examStats, atRiskCount, passCount)}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_0.9fr_1.2fr]">
            <CircleChart
              label="Ангийн дундаж"
              value={examStats.average}
              helper="Шалгалт өгсөн сурагчдын нийт дундаж үзүүлэлт."
              icon={BadgePercentIcon}
              color="#4f7cff"
            />
            <CircleChart
              label="Ирц"
              value={attendanceRate}
              helper={`${examStats.submissionCount}/${examStats.cohortSize} сурагч шалгалтаа өгсөн.`}
              icon={UsersIcon}
              color="#22c55e"
            />
            <BarDistributionChart examStats={examStats} />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[22px] border border-[#dbe4ff] bg-[linear-gradient(180deg,#eef4ff_0%,#f8fbff_100%)] px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#1d4ed8]">
                Тэнцсэн сурагч
              </div>
              <div className="mt-2 text-3xl font-semibold text-slate-900">
                {passCount}/{examStats.submissionCount}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {clampPercent(examStats.passRate)}% нь босго давсан
              </div>
            </div>
            <div className="rounded-[22px] border border-[#d9ece7] bg-[linear-gradient(180deg,#eefbf5_0%,#f8fdfb_100%)] px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#1f8f6a]">
                Ирцийн дүн
              </div>
              <div className="mt-2 text-3xl font-semibold text-slate-900">
                {examStats.submissionCount}/{examStats.cohortSize}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Хүлээгдэж буй нийт сурагчийн тоотой харьцуулав
              </div>
            </div>
            <div className="rounded-[22px] border border-[#f0dfc8] bg-[linear-gradient(180deg,#fff6ea_0%,#fffaf3_100%)] px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-amber-600">
                Анхаарах асуулт
              </div>
              <div className="mt-2 text-3xl font-semibold text-slate-900">
                {atRiskCount}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Дахин тайлбарлах шаардлагатай
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <QuestionCard
              title="Хамгийн зөв хийсэн 2 асуулт"
              questions={examStats.mostCorrect
                .filter((item) => item.correctCount > 0)
                .slice(0, 2)}
              icon={CheckCircle2Icon}
              tone="good"
              emptyText="Одоогоор онцолж харуулах зөв гүйцэтгэлтэй асуулт алга байна."
            />
            <QuestionCard
              title="Хамгийн их буруу хийсэн 2 асуулт"
              questions={examStats.mostMissed
                .filter((item) => item.missCount > 0)
                .slice(0, 2)}
              icon={AlertTriangleIcon}
              tone="warn"
              emptyText="Одоогоор онцгой алдаа төвлөрсөн асуулт алга байна."
            />
          </div>
        </>
      )}
    </div>
  );
}
