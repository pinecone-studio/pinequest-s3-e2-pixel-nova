import { useEffect } from "react";
import type { Submission } from "../types";

type AnswerReportItem = {
  question: { id: string; text: string; correctAnswer: string };
  answer: string;
  correct: boolean;
};

type StudentResultViewProps = {
  lastSubmission: Submission | null;
  answerReport: AnswerReportItem[];
  onBack: () => void;
};

export default function StudentResultView({
  lastSubmission,
  answerReport,
  onBack,
}: StudentResultViewProps) {
  useEffect(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => null);
    }
    document.body.style.filter = "none";
  }, []);

  if (!lastSubmission) {
    return (
      <div className="min-h-screen bg-background text-foreground px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Дүн боловсруулж байна...</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Хэсэг хүлээнэ үү. Хэрэв энэ дэлгэц удаан үргэлжилбэл самбар руу
            буцаад дахин орж үзнэ үү.
          </p>
          <button
            className="mt-6 w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            onClick={onBack}
          >
            Самбар руу буцах
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-10">
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Дүнгийн хураангуй</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted p-4">
            <div className="text-xs text-muted-foreground">Оноо</div>
            <div className="mt-2 text-2xl font-semibold">
              {lastSubmission?.percentage ?? 0}%
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted p-4">
            <div className="text-xs text-muted-foreground">Зөв</div>
            <div className="mt-2 text-2xl font-semibold">
              {lastSubmission?.score ?? 0}/{lastSubmission?.totalPoints ?? 0}
            </div>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="text-sm font-semibold">Асуултын тайлан</h3>
          <div className="mt-3 space-y-2 text-sm">
            {answerReport.map((item, idx) => (
              <div
                key={item.question.id}
                className="rounded-xl border border-border bg-muted px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <span>
                    {idx + 1}. {item.question.text}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      item.correct
                        ? "text-emerald-600 dark:text-emerald-300"
                        : "text-red-600 dark:text-red-300"
                    }`}
                  >
                    {item.correct ? "Зөв" : "Буруу"}
                  </span>
                </div>
                {!item.correct && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Зөв хариулт: {item.question.correctAnswer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <button
          className="mt-6 w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          onClick={onBack}
        >
          Самбар руу буцах
        </button>
      </div>
    </div>
  );
}
