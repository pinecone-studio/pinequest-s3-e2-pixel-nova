import { cardClass } from "../styles";
import { formatDateTime } from "../utils";
import type { Submission } from "../types";

type ResultsSubmissionsListProps = {
  submissions: Submission[];
  onSelect: (id: string) => void;
};

export default function ResultsSubmissionsList({
  submissions,
  onSelect,
}: ResultsSubmissionsListProps) {
  return (
    <div className={cardClass}>
      <h2 className="flex items-center gap-2 text-sm font-semibold">Сүүлийн дүн</h2>
      <div className="mt-4 space-y-3 text-sm">
        {submissions.length === 0 && (
          <div className="rounded-xl border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
            Одоогоор дүн алга.
          </div>
        )}
        {submissions.map((submission) => (
          <div
            key={submission.id}
            className="flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2"
          >
            <div>
              <div className="font-medium">{submission.studentName}</div>
              <div className="text-xs text-muted-foreground">
                {submission.percentage}% · {formatDateTime(submission.submittedAt)}
              </div>
              {submission.terminated && (
                <div className="text-xs text-red-500">⚠️ Шалгалт зогссон</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {submission.score}/{submission.totalPoints}
              </span>
              <button
                className="rounded-lg border border-border px-2 py-1 text-xs transition hover:bg-muted"
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
