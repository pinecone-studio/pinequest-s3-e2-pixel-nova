import { cardClass } from "../styles";
import { formatDateTime } from "../utils";
import type { Submission } from "../types";

type ResultsSubmissionsListProps = {
  submissions: Submission[];
  onSelect: (id: string) => void;
  selectedSubmissionId: string | null;
};

export default function ResultsSubmissionsList({
  submissions,
  onSelect,
  selectedSubmissionId,
}: ResultsSubmissionsListProps) {
  return (
    <div className={cardClass}>
      <h2 className="flex items-center gap-2 text-sm font-semibold">Сонгосон шалгалтын дүн</h2>
      <div className="mt-4 space-y-3 text-sm">
        {submissions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/60 px-4 py-6 text-sm text-muted-foreground">
            Одоогоор дүн алга.
          </div>
        )}
        {submissions.map((submission, index) => (
          <div
            key={submission.id}
            className={`rounded-2xl border px-4 py-3 transition ${
              selectedSubmissionId === submission.id
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-muted/60"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                    #{index + 1}
                  </span>
                  <div className="font-medium">{submission.studentName}</div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {submission.percentage}% · {formatDateTime(submission.submittedAt)}
                </div>
                {submission.terminated && (
                  <div className="mt-1 text-xs text-red-500">Шалгалт зогссон</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">
                  {submission.score}/{submission.totalPoints}
                </div>
                <div className="text-[11px] text-muted-foreground">автомат үнэлгээ</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                Violation event:{" "}
                {Object.values(submission.violations ?? {}).reduce(
                  (sum, value) => sum + Number(value),
                  0,
                )}
              </span>
              <button
                className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium transition hover:bg-card"
                onClick={() => onSelect(submission.id)}
              >
                Дэлгэрэнгүй
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
