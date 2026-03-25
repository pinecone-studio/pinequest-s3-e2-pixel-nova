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
  onUpdateAnswer: (value: string) => void;
  onSelectMcq: (value: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onExit: () => void;
};

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
  onSubmit,
  onExit,
}: StudentExamViewProps) {
  const currentQuestion = activeExam?.questions[currentQuestionIndex];
  const totalQuestions = activeExam?.questions.length || 0;
  const answeredCount = Object.values(answers).filter((value) =>
    value && value.trim().length > 0,
  ).length;
  const progressPercent =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  return (
    <div className="min-h-screen bg-background px-6 py-8 text-foreground">
      {warning && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-[min(92vw,460px)] overflow-hidden rounded-3xl border border-red-400/40 bg-card/90 px-6 py-5 text-center shadow-[0_20px_60px_rgba(239,68,68,0.25)]">
            <div className="absolute inset-0 bg-linear-to-br from-red-500/15 via-transparent to-transparent" />
            <div className="relative flex items-center justify-center gap-2 text-sm font-semibold text-foreground">
              <span className="grid h-8 w-8 place-items-center rounded-2xl bg-red-500/15 text-red-500">
                ⚠️
              </span>
              <span>{warning}</span>
            </div>
            <div className="relative mt-2 text-xs text-muted-foreground">
              Энэ үйлдэл дахин давтагдвал шалгалт автоматаар дуусна.
            </div>
          </div>
        </div>
      )}
      <header className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
        <div className="font-semibold">
          {activeExam ? activeExam.title : "Шалгалтын өрөө"}
        </div>
        <div className="text-lg font-semibold">{formatTimer(timeLeft)}</div>
        <div className="text-sm text-muted-foreground">
          {currentQuestionIndex + 1}/{activeExam ? activeExam.questions.length || 1 : 1}
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded-full border border-border bg-muted px-2 py-1 text-muted-foreground">
            Таб: {violations.tabSwitch}
          </span>
          <span className="rounded-full border border-border bg-muted px-2 py-1 text-muted-foreground">
            Хуулалт: {violations.copyAttempt}
          </span>
        </div>
      </header>
      <div className="mx-auto mt-3 w-full max-w-5xl rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
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

      <div className="mx-auto mt-6 grid w-full max-w-5xl gap-4 lg:grid-cols-[1fr_140px]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="text-lg font-semibold">
            {currentQuestion ? currentQuestion.text : "Асуулт хараахан алга"}
          </div>
          {currentQuestion?.type === "open" ? (
            <textarea
              className="mt-4 h-32 w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Хариултаа энд бичнэ үү"
              value={currentQuestion ? answers[currentQuestion.id] || "" : ""}
              onChange={(event) => onUpdateAnswer(event.target.value)}
            />
          ) : currentQuestion?.type === "mcq" ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(currentQuestion.options ?? []).map((option, idx) => {
                const label = String.fromCharCode(65 + idx);
                const currentAnswer = currentQuestion
                  ? answers[currentQuestion.id] || ""
                  : "";
                const isSelected = currentAnswer === option || currentAnswer === label;
                return (
                  <button
                    key={`${label}-${option}`}
                    className={`rounded-xl border border-border px-4 py-3 text-left text-sm transition ${
                      isSelected
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                        : "bg-muted hover:bg-muted/70"
                    }`}
                    onClick={() => onSelectMcq(option)}
                  >
                    {label}. {option}
                  </button>
                );
              })}
            </div>
          ) : (
            <input
              className="mt-4 w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Хариултаа бичнэ үү"
              value={currentQuestion ? answers[currentQuestion.id] || "" : ""}
              onChange={(event) => onUpdateAnswer(event.target.value)}
            />
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="text-xs text-muted-foreground">Явц</div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {Array.from({ length: activeExam?.questions.length || 6 }).map(
              (_, idx) => (
                <button
                  key={idx}
                  className={`grid h-8 place-items-center rounded-lg border border-border text-xs ${
                    idx === currentQuestionIndex ? "bg-primary/10" : "bg-muted"
                  }`}
                  onClick={() => setCurrentQuestionIndex(idx)}
                >
                  {idx + 1}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 flex w-full max-w-5xl flex-wrap justify-between gap-3">
        <button
          className="rounded-xl border border-border bg-muted px-4 py-2 text-sm transition hover:bg-muted/70"
          onClick={onExit}
        >
          Гарах
        </button>
        <div className="flex gap-2">
          <button
            className="rounded-xl border border-border bg-muted px-4 py-2 text-sm transition hover:bg-muted/70"
            onClick={onPrev}
            disabled={currentQuestionIndex === 0}
          >
            Өмнөх
          </button>
          <button
            className="rounded-xl border border-border bg-muted px-4 py-2 text-sm transition hover:bg-muted/70"
            onClick={onNext}
            disabled={!activeExam || currentQuestionIndex >= activeExam.questions.length - 1}
          >
            Дараах
          </button>
          <button
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            onClick={onSubmit}
          >
            Илгээх
          </button>
        </div>
      </div>
    </div>
  );
}
