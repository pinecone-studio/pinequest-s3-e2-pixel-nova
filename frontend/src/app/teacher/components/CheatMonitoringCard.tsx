import { cardClass } from "../styles";
import type { CheatStudent } from "../types";

type CheatMonitoringCardProps = {
  students: CheatStudent[];
};

const toneClassByRisk: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-emerald-100 text-emerald-700",
};

export default function CheatMonitoringCard({ students }: CheatMonitoringCardProps) {
  return (
    <div className={cardClass}>
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <svg
          className="h-4 w-4 text-muted-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3l8 4v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        Cheat monitoring
      </h2>
      <div className="mt-4 space-y-3 text-sm">
        {students.length === 0 && (
          <div className="rounded-2xl border border-[#dce5ef] bg-[#f8fafc] px-3 py-3 text-xs text-slate-500">
            No suspicious activity has been recorded yet.
          </div>
        )}
        {students.map((student, idx) => (
          <div
            key={`${student.studentId ?? student.id ?? student.name}-${student.examTitle ?? "exam"}-${idx}`}
            className="rounded-2xl border border-[#dce5ef] bg-[#fbfdff] px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{student.name}</div>
                <div className="text-xs text-muted-foreground">
                  {student.examTitle} · {student.events ?? 0} events
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Latest reason: {student.reason ?? student.latestEventLabel ?? "Unknown"}
                </div>
                {student.lastViolationAt && (
                  <div className="mt-1 text-xs text-slate-400">
                    Last flagged {new Date(student.lastViolationAt).toLocaleString()}
                  </div>
                )}
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  toneClassByRisk[student.riskLevel ?? "low"] ?? toneClassByRisk.low
                }`}
              >
                {student.riskLevel ?? student.cheat}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-xl border border-[#dce5ef] bg-white px-3 py-2">
                Score: {student.score}%
              </span>
              <span className="rounded-xl border border-[#dce5ef] bg-white px-3 py-2">
                Violation score: {student.violationScore ?? 0}
              </span>
              <span className="rounded-xl border border-[#dce5ef] bg-white px-3 py-2">
                Flags: {student.flagCount ?? 0}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
