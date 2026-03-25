import { cardClass, selectClass } from "../styles";
import type { Exam, ExamStatsSummary } from "../types";

type ResultsSummaryCardProps = {
  examOptions: Exam[];
  activeExamId: string | null;
  onSelectExam: (value: string) => void;
  examStats: ExamStatsSummary | null;
};

export default function ResultsSummaryCard({
  examOptions,
  activeExamId,
  onSelectExam,
  examStats,
}: ResultsSummaryCardProps) {
  return (
    <div className={`${cardClass} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Дүнгийн AI summary</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Дундаж оноо, pass rate, хамгийн их алдсан болон зөв асуултууд
          </p>
        </div>
        <select
          className={`${selectClass} max-w-xs`}
          value={activeExamId ?? ""}
          onChange={(event) => onSelectExam(event.target.value)}
        >
          {examOptions.length === 0 && (
            <option value="">Шалгалт байхгүй</option>
          )}
          {examOptions.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.title}
            </option>
          ))}
        </select>
      </div>

      {!examStats && (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/60 px-4 py-8 text-sm text-muted-foreground">
          Дүнтэй шалгалт сонгогдоогүй байна.
        </div>
      )}

      {examStats && (
        <>
          <div className="mt-5 grid gap-4 xl:grid-cols-[260px_1fr]">
            <div className="rounded-[28px] border border-primary/15 bg-linear-to-br from-primary/10 via-background to-background p-5">
              <div className="text-[11px] uppercase tracking-[0.24em] text-primary/80">
                Class Average
              </div>
              <div className="mt-4 flex items-center justify-center">
                <div
                  className="grid h-40 w-40 place-items-center rounded-full"
                  style={{
                    background: `conic-gradient(hsl(var(--primary)) ${examStats.average * 3.6}deg, hsl(var(--muted)) 0deg)`,
                  }}
                >
                  <div className="grid h-28 w-28 place-items-center rounded-full border border-border bg-card shadow-sm">
                    <div className="text-center">
                      <div className="text-3xl font-semibold">{examStats.average}%</div>
                      <div className="text-[11px] text-muted-foreground">анги дундаж</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-primary/80">
                  Pass Rate
                </div>
                <div className="mt-2 text-3xl font-semibold">{examStats.passRate}%</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  60%-иас дээш өгсөн сурагчид
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">
                  Submissions
                </div>
                <div className="mt-2 text-3xl font-semibold">{examStats.submissionCount}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Автоматаар үнэлэгдсэн оролт
                </div>
              </div>
              <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-amber-600 dark:text-amber-300">
                  Question Load
                </div>
                <div className="mt-2 text-3xl font-semibold">{examStats.totalPoints}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Нэг сурагчид ногдох асуулт
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-red-500/10 bg-red-500/5 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-red-600 dark:text-red-300">
                Most Missed
              </div>
              <div className="mt-2 text-sm font-semibold">
                {examStats.mostMissed[0]?.text ?? "—"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {examStats.mostMissed[0]
                  ? `${examStats.mostMissed[0].missCount} сурагч алдсан`
                  : "Алдагдсан асуулт алга"}
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">
                Most Correct
              </div>
              <div className="mt-2 text-sm font-semibold">
                {examStats.mostCorrect[0]?.text ?? "—"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {examStats.mostCorrect[0]
                  ? `${examStats.mostCorrect[0].correctCount} сурагч зөв хийсэн`
                  : "Зөв хариултын өгөгдөл алга"}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
