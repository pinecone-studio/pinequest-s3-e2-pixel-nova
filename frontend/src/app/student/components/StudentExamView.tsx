import { useEffect, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Clock3,
  ShieldCheck,
  X,
} from "lucide-react";
import MathText from "@/components/MathText";
import MongolianText from "@/components/MongolianText";
import { hasTraditionalMongolian } from "@/lib/mongolian-script";
import { formatTimer } from "../utils";
import type { Exam, Violations } from "../types";
import { localizeExamTitle } from "./student-exams-helpers";
import { localizeRiskLevel } from "./student-ui-text";

type StudentExamViewProps = {
  activeExam: Exam | null;
  warning: string | null;
  timeLeft: number;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (value: number) => void;
  violations: Violations;
  answers: Record<string, string>;
  onUpdateAnswer: (value: string, maybeValue?: string) => void;
  onSelectMcq: (value: string, maybeValue?: string) => void;
  onPrev: () => void;
  onNext: () => void;
  submitting?: boolean;
  onSubmit: () => void;
  onExit: () => void;
  cameraPanel?: ReactNode;
};

function ExamMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[18px] border border-[#e6ebf5] bg-[#f8faff] px-3 py-3">
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#a3afc6]">
        {label}
      </div>
      <div className="mt-1.5 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function QuestionBlock({
  question,
  questionNumber,
  value,
  onUpdateAnswer,
  onSelectMcq,
}: {
  question: NonNullable<Exam["questions"]>[number];
  questionNumber: number;
  value: string;
  onUpdateAnswer: (questionId: string, value: string) => void;
  onSelectMcq: (questionId: string, value: string) => void;
}) {
  return (
    <article className="rounded-[28px] border border-[#e3e9f4] bg-white px-4 py-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.18)] sm:px-5">
      <div className="text-sm font-semibold text-[#91a2c7]">
        Асуулт {questionNumber}
      </div>
      <div className="mt-3 text-[19px] font-semibold leading-8 text-slate-900">
        {hasTraditionalMongolian(question.text) ? (
          <MongolianText text={question.text} />
        ) : (
          <MathText text={question.text} />
        )}
      </div>

      {question.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={question.imageUrl}
          alt="Асуултын зураг"
          className="mt-5 w-full rounded-[22px] border border-[#dfe6f2] bg-[#f6f8fd] object-contain"
          style={{ maxHeight: 260 }}
        />
      )}

      {question.type === "open" ? (
        <textarea
          className="mt-5 h-36 w-full rounded-[20px] border border-[#dce4f2] bg-[#f7f9fd] px-4 py-4 text-sm text-slate-700 outline-none transition focus:border-[#5b7ef0] focus:ring-4 focus:ring-[#dbe5ff]"
          placeholder="Хариултаа энд бичнэ үү"
          value={value}
          onChange={(event) => onUpdateAnswer(question.id, event.target.value)}
        />
      ) : question.type === "mcq" ? (
        <div className="mt-5 space-y-2.5">
          {(question.options ?? []).map((option, optionIndex) => {
            const label = String.fromCharCode(65 + optionIndex);
            const isSelected = value === option || value === label;

            return (
              <button
                key={`${question.id}-${label}-${option}`}
                type="button"
                className={`w-full rounded-[18px] border px-4 py-3.5 text-left text-[16px] transition ${
                  isSelected
                    ? "border-[#7194ff] bg-[#d9e4ff] text-slate-900 shadow-[0_18px_30px_-24px_rgba(77,113,233,0.52)]"
                    : "border-[#e1e7f2] bg-[#f6f8fc] text-slate-800 hover:border-[#c7d5f2] hover:bg-[#f1f5fb]"
                }`}
                onClick={() => onSelectMcq(question.id, option)}
              >
                <div className="flex flex-wrap items-start gap-1">
                  <span>{label}.</span>
                  {hasTraditionalMongolian(option) ? (
                    <MongolianText text={option} className="flex-1" />
                  ) : (
                    <MathText text={option} className="flex-1" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <input
          className="mt-5 w-full rounded-[20px] border border-[#dce4f2] bg-[#f7f9fd] px-4 py-4 text-sm text-slate-700 outline-none transition focus:border-[#5b7ef0] focus:ring-4 focus:ring-[#dbe5ff]"
          placeholder="Хариултаа бичнэ үү"
          value={value}
          onChange={(event) => onUpdateAnswer(question.id, event.target.value)}
        />
      )}
    </article>
  );
}

export default function StudentExamView({
  activeExam,
  warning,
  timeLeft,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  violations,
  answers,
  onUpdateAnswer,
  onSelectMcq,
  onPrev,
  onNext,
  submitting = false,
  onSubmit,
  onExit,
  cameraPanel,
}: StudentExamViewProps) {
  const totalQuestions = activeExam?.questions.length || 0;
  const answeredCount = Object.values(answers).filter((value) =>
    value && value.trim().length > 0,
  ).length;
  const progressPercent =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  useEffect(() => {
    if (totalQuestions === 0 && currentQuestionIndex !== 0) {
      setCurrentQuestionIndex(0);
      return;
    }

    if (totalQuestions > 0 && currentQuestionIndex > totalQuestions - 1) {
      setCurrentQuestionIndex(totalQuestions - 1);
    }
  }, [currentQuestionIndex, setCurrentQuestionIndex, totalQuestions]);

  const currentQuestion =
    totalQuestions > 0 ? activeExam?.questions[currentQuestionIndex] ?? null : null;
  const isFirstQuestion = currentQuestionIndex <= 0;
  const isLastQuestion =
    totalQuestions > 0 && currentQuestionIndex >= totalQuestions - 1;
  const currentQuestionNumber =
    totalQuestions > 0 ? Math.min(currentQuestionIndex + 1, totalQuestions) : 0;
  const examTitle = activeExam
    ? localizeExamTitle(activeExam.title, activeExam.description)
    : "Шалгалтын өрөө";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eef4ff_0%,#f5f7fb_34%,#eef2f8_100%)] px-4 pb-10 pt-6 text-slate-900 sm:px-6">
      {warning && (
        <div className="fixed left-1/2 top-4 z-50 w-[min(92vw,390px)] -translate-x-1/2 sm:top-6">
          <div className="overflow-hidden rounded-[26px] border border-[#ffc9a8] bg-white shadow-[0_26px_64px_-30px_rgba(249,115,22,0.42)]">
            <div className="flex items-start gap-4 px-5 py-5">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#fff1e8] text-[#f97316]">
                <AlertTriangle className="size-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900">
                  Анхааруулга илэрлээ
                </p>
                <p className="mt-2 text-[15px] leading-7 text-slate-600">{warning}</p>
                <p className="mt-3 text-sm font-medium text-[#f97316]">
                  Дахин давтагдвал шалгалт автоматаар дуусна.
                </p>
              </div>
            </div>
            <div className="h-1.5 w-full bg-[#ffe4d4]">
              <div className="h-full w-3/4 bg-[#f97316]" />
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-[430px]">
        <div className="rounded-[34px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(243,247,255,0.88)_100%)] p-3 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.42)]">
          <div className="rounded-[30px] border border-[#e5eaf3] bg-white px-4 pb-5 pt-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] sm:px-5">
            <div className="flex items-center justify-between text-sm text-slate-900">
              <div className="text-[15px] font-semibold tracking-[-0.02em]">
                shalgalt
              </div>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-[#f5f7fb] hover:text-slate-800"
                onClick={onExit}
                aria-label="Шалгалтаас гарах"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-slate-900">
                  {examTitle}
                </h1>
                <p className="mt-1 text-[14px] leading-6 text-slate-400">
                  Асуултуудаа сайн уншиж танилцаад тайван бөглөөрэй.
                </p>
              </div>

              <div className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-[#dde4ef] bg-white px-3.5 py-2 text-[0.98rem] font-semibold text-slate-900 shadow-[0_10px_28px_-22px_rgba(15,23,42,0.45)]">
                <Clock3 className="h-[18px] w-[18px] text-slate-700" />
                {formatTimer(timeLeft)}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs font-medium text-[#93a0ba]">
              <div className="rounded-full bg-[#eef3ff] px-3 py-1 text-[#5874dd]">
                {currentQuestionNumber}/{Math.max(totalQuestions, 1)} асуулт
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-[#f4f7fb] px-3 py-1">
                <ShieldCheck className="h-[14px] w-[14px] text-[#5874dd]" />
                {localizeRiskLevel(violations.riskLevel)}
              </div>
            </div>

            <div className="mt-5">
              {currentQuestion ? (
                <QuestionBlock
                  question={currentQuestion}
                  questionNumber={currentQuestionNumber}
                  value={answers[currentQuestion.id] || ""}
                  onUpdateAnswer={onUpdateAnswer}
                  onSelectMcq={onSelectMcq}
                />
              ) : (
                <div className="rounded-[28px] border border-dashed border-[#d8e1f0] bg-white px-6 py-16 text-center text-sm text-slate-400">
                  Асуулт хараахан алга.
                </div>
              )}
            </div>

            <div className="mt-5 rounded-[24px] border border-[#e4eaf5] bg-[#fbfcff] px-4 py-4">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Явц</span>
                <span>
                  {answeredCount}/{totalQuestions} · {progressPercent}%
                </span>
              </div>
              <div className="mt-3 h-2.5 w-full rounded-full bg-[#ebeff6]">
                <div
                  className="h-2.5 rounded-full bg-[#9fb7f7] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <ExamMetric
                  label="Асуулт"
                  value={`${currentQuestionNumber}/${Math.max(totalQuestions, 1)}`}
                />
                <ExamMetric
                  label="Эрсдэл"
                  value={localizeRiskLevel(violations.riskLevel)}
                />
                <ExamMetric label="Таб" value={violations.tabSwitch} />
                <ExamMetric label="Хуулалт" value={violations.copyAttempt} />
              </div>
            </div>

            <div
              className={`mt-5 grid gap-3 ${
                isFirstQuestion ? "grid-cols-1" : "grid-cols-[56px_minmax(0,1fr)]"
              }`}
            >
              {!isFirstQuestion && (
                <button
                  type="button"
                  className="grid h-[56px] place-items-center rounded-[18px] border border-[#dbe3ef] bg-white text-[#5874dd] shadow-sm transition hover:bg-[#f8fbff]"
                  onClick={onPrev}
                  aria-label="Өмнөх асуулт"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <button
                type="button"
                className="h-[56px] rounded-[18px] bg-[#4b6fe8] px-5 text-base font-semibold text-white shadow-[0_20px_34px_-24px_rgba(75,111,232,0.6)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={isLastQuestion ? onSubmit : onNext}
                disabled={submitting || !currentQuestion}
              >
                {isLastQuestion
                  ? submitting
                    ? "Илгээж байна..."
                    : "Илгээх"
                  : "Үргэлжлүүлэх"}
              </button>
            </div>
          </div>
        </div>

        {cameraPanel && <div className="mt-4 space-y-4">{cameraPanel}</div>}
      </div>
    </div>
  );
}
