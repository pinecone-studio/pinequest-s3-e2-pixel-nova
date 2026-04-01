import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import MathText from "@/components/MathText";
import MongolianText from "@/components/MongolianText";
import { hasTraditionalMongolian } from "@/lib/mongolian-script";
import { formatTimer } from "../utils";
import type { Exam, Violations } from "../types";

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
  onSubmit: () => void;
  onExit: () => void;
  cameraPanel?: ReactNode;
};

function QuestionBlock({
  question,
  index,
  value,
  onUpdateAnswer,
  onSelectMcq,
}: {
  question: NonNullable<Exam["questions"]>[number];
  index: number;
  value: string;
  onUpdateAnswer: (questionId: string, value: string) => void;
  onSelectMcq: (questionId: string, value: string) => void;
}) {
  return (
    <article
      id={`question-${question.id}`}
      className="rounded-[28px] border border-[#d8e1f0] bg-white p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.25)]"
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#edf3ff] text-sm font-semibold text-[#355cde]">
          {index + 1}
        </div>
        <div className="pt-1 text-[18px] font-semibold leading-8 text-slate-900 sm:text-[20px]">
          {hasTraditionalMongolian(question.text) ? (
            <MongolianText text={question.text} />
          ) : (
            <MathText text={question.text} />
          )}
        </div>
      </div>

      {question.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={question.imageUrl}
          alt="Асуултын зураг"
          className="mb-5 w-full rounded-3xl border border-[#d8e1f0] bg-[#f7faff] object-contain"
          style={{ maxHeight: 320 }}
        />
      )}

      {question.type === "open" ? (
        <textarea
          className="h-36 w-full rounded-[22px] border border-[#d8e1f0] bg-[#f7faff] px-5 py-4 text-sm text-slate-700 outline-none transition focus:border-[#355cde] focus:ring-4 focus:ring-[#dbe6ff]"
          placeholder="Хариултаа энд бичнэ үү"
          value={value}
          onChange={(event) => onUpdateAnswer(question.id, event.target.value)}
        />
      ) : question.type === "mcq" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {(question.options ?? []).map((option, optionIndex) => {
            const label = String.fromCharCode(65 + optionIndex);
            const isSelected = value === option || value === label;

            return (
              <button
                key={`${question.id}-${label}-${option}`}
                type="button"
                className={`rounded-[22px] border px-6 py-5 text-left text-[16px] transition ${
                  isSelected
                    ? "border-[#9edec2] bg-[#eefcf3] text-[#069668]"
                    : "border-[#d8e1f0] bg-[#f7faff] text-slate-800 hover:border-[#b6c8ea] hover:bg-[#f1f6ff]"
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
          className="w-full rounded-[22px] border border-[#d8e1f0] bg-[#f7faff] px-5 py-4 text-sm text-slate-700 outline-none transition focus:border-[#355cde] focus:ring-4 focus:ring-[#dbe6ff]"
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
  onSubmit,
  onExit,
  cameraPanel,
}: StudentExamViewProps) {
  const questionRefs = useRef<Record<string, HTMLElement | null>>({});

  const totalQuestions = activeExam?.questions.length || 0;
  const answeredCount = Object.values(answers).filter((value) =>
    value && value.trim().length > 0,
  ).length;
  const progressPercent =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const questionIds = useMemo(
    () => (activeExam?.questions ?? []).map((question) => question.id),
    [activeExam],
  );

  useEffect(() => {
    if (!questionIds.length || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (!visible) return;
        const nextIndex = questionIds.findIndex(
          (questionId) => questionRefs.current[questionId] === visible.target,
        );
        if (nextIndex >= 0 && nextIndex !== currentQuestionIndex) {
          setCurrentQuestionIndex(nextIndex);
        }
      },
      {
        threshold: [0.35, 0.6, 0.9],
        rootMargin: "-10% 0px -35% 0px",
      },
    );

    questionIds.forEach((questionId) => {
      const node = questionRefs.current[questionId];
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [currentQuestionIndex, questionIds, setCurrentQuestionIndex]);

  const scrollToQuestion = (index: number) => {
    const question = activeExam?.questions[index];
    if (!question) return;
    setCurrentQuestionIndex(index);
    questionRefs.current[question.id]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="min-h-screen bg-background px-6 py-8 text-foreground">
      {warning && (
        <div className="fixed right-6 top-6 z-50 max-w-[360px]">
          <div className="overflow-hidden rounded-[24px] border border-[#ffcfb8] bg-white shadow-[0_24px_48px_-28px_rgba(249,115,22,0.35)]">
            <div className="flex items-start gap-3 px-4 py-4">
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#fff4ed] text-[#f97316]">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Анхааруулга илэрлээ
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{warning}</p>
                <p className="mt-2 text-xs text-[#f97316]">
                  Дахин давтагдвал шалгалт автоматаар дуусна.
                </p>
              </div>
            </div>
            <div className="h-1 w-full bg-[#ffe4d4]">
              <div className="h-full w-2/3 bg-[#f97316]" />
            </div>
          </div>
        </div>
      )}

      <header className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
        <div className="font-semibold">
          {activeExam ? activeExam.title : "Шалгалтын өрөө"}
        </div>
        <div className="text-lg font-semibold">{formatTimer(timeLeft)}</div>
        <div className="text-sm text-muted-foreground">
          {Math.min(currentQuestionIndex + 1, Math.max(totalQuestions, 1))}/
          {Math.max(totalQuestions, 1)}
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded-full border border-border bg-muted px-2 py-1 text-muted-foreground">
            Эрсдэл: {violations.riskLevel ?? "low"}
          </span>
          <span className="rounded-full border border-border bg-muted px-2 py-1 text-muted-foreground">
            Таб: {violations.tabSwitch}
          </span>
          <span className="rounded-full border border-border bg-muted px-2 py-1 text-muted-foreground">
            Хуулалт: {violations.copyAttempt}
          </span>
        </div>
      </header>

      <div className="mt-3 w-full rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Явц</span>
          <span>
            {answeredCount}/{totalQuestions} · {progressPercent}%
          </span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-6 grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-5">
          {(activeExam?.questions ?? []).map((question, index) => (
            <div
              key={question.id}
              ref={(node) => {
                questionRefs.current[question.id] = node;
              }}
            >
              <QuestionBlock
                question={question}
                index={index}
                value={answers[question.id] || ""}
                onUpdateAnswer={onUpdateAnswer}
                onSelectMcq={onSelectMcq}
              />
            </div>
          ))}

          {!activeExam?.questions.length && (
            <div className="rounded-[28px] border border-dashed border-[#d8e1f0] bg-white px-6 py-16 text-center text-sm text-slate-400">
              Асуулт хараахан алга.
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {cameraPanel}

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="text-xs text-muted-foreground">Явц</div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {Array.from({ length: totalQuestions || 6 }).map((_, idx) => {
                const question = activeExam?.questions[idx];
                const isAnswered = question ? Boolean(answers[question.id]?.trim()) : false;
                const isCurrent = idx === currentQuestionIndex;

                return (
                  <button
                    key={idx}
                    type="button"
                    className={`grid h-10 place-items-center rounded-xl border text-sm transition ${
                      isCurrent
                        ? "border-[#355cde] bg-[#edf3ff] text-[#355cde]"
                        : isAnswered
                          ? "border-[#9edec2] bg-[#eefcf3] text-[#069668]"
                          : "border-border bg-muted text-slate-700 hover:bg-muted/70"
                    }`}
                    onClick={() => scrollToQuestion(idx)}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-6 flex w-full flex-wrap justify-between gap-3">
        <button
          className="rounded-xl border border-border bg-muted px-4 py-2 text-sm transition hover:bg-muted/70"
          onClick={onExit}
        >
          Гарах
        </button>
        <button
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          onClick={onSubmit}
        >
          Илгээх
        </button>
      </div>
    </div>
  );
}
