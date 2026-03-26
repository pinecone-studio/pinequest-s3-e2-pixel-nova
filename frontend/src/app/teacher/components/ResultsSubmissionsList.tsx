import { cardClass, sectionDescriptionClass } from "../styles";
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
      <h2 className="text-xl font-semibold text-slate-900">Сонгосон шалгалтын дүн</h2>
      <p className={`mt-2 ${sectionDescriptionClass}`}>
        Сурагч тус бүрийн илгээсэн оролт болон автоматаар бодогдсон дүн.
      </p>
      <div className="mt-6 space-y-3 text-sm">
        {submissions.length === 0 && (
          <div className="rounded-[24px] border border-dashed border-[#d5dfeb] bg-[#f8fafc] px-4 py-6 text-sm text-slate-500">
            Одоогоор дүн алга.
          </div>
        )}
        {submissions.map((submission, index) => (
          <div
            key={submission.id}
            className={`rounded-[24px] border px-4 py-4 transition ${
              selectedSubmissionId === submission.id
                ? "border-[#bfdbfe] bg-[#eff6ff]"
                : "border-[#dce5ef] bg-[#fbfdff]"
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
                <div className="mt-1 text-xs text-slate-500">
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
                <div className="text-[11px] text-slate-500">автомат үнэлгээ</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">
                Violation event:{" "}
                {Object.values(submission.violations ?? {}).reduce(
                  (sum, value) => sum + Number(value),
                  0,
                )}
              </span>
              <button
                className="rounded-xl border border-[#d5dfeb] bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-[#eff6ff]"
                onClick={() => onSelect(submission.id)}
                type="button"
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
