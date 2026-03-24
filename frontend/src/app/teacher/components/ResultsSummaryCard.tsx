import { cardClass, selectClass } from "../styles";
import type { Exam } from "../types";

type ResultsSummaryCardProps = {
  examOptions: Exam[];
  activeExamId: string | null;
  onSelectExam: (value: string) => void;
  examStats: {
    average: number;
    mostMissed?: { text: string };
    mostCorrect?: { text: string };
  } | null;
};

export default function ResultsSummaryCard({
  examOptions,
  activeExamId,
  onSelectExam,
  examStats,
}: ResultsSummaryCardProps) {
  return (
    <div className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Шалгалтын дэлгэрэнгүй</h2>
          <p className="text-xs text-muted-foreground">
            Анги дундаж, хамгийн их алдсан/зөв асуулт
          </p>
        </div>
        <select
          className={selectClass}
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
      {examStats && (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-muted px-3 py-2 text-xs">
            Анги дундаж: <span className="font-semibold">{examStats.average}%</span>
          </div>
          <div className="rounded-xl border border-border bg-muted px-3 py-2 text-xs">
            Хамгийн их алдсан:{" "}
            <span className="font-semibold">{examStats.mostMissed?.text ?? "—"}</span>
          </div>
          <div className="rounded-xl border border-border bg-muted px-3 py-2 text-xs">
            Хамгийн их зөв:{" "}
            <span className="font-semibold">{examStats.mostCorrect?.text ?? "—"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
