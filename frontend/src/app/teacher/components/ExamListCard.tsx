import { cardClass } from "../styles";
import { formatDateTime } from "../utils";
import type { Exam } from "../types";

type ExamListCardProps = {
  exams: Exam[];
  onCopyCode: (code: string) => void;
};

export default function ExamListCard({ exams, onCopyCode }: ExamListCardProps) {
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
          <path d="M8 6h13" />
          <path d="M8 12h13" />
          <path d="M8 18h13" />
          <path d="M3 6h.01" />
          <path d="M3 12h.01" />
          <path d="M3 18h.01" />
        </svg>
        Шалгалтын жагсаалт
      </h2>
      <div className="mt-4 space-y-3 text-sm">
        {exams.length === 0 && (
          <div className="rounded-xl border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
            Одоогоор шалгалт байхгүй байна.
          </div>
        )}
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted px-3 py-2"
          >
            <div>
              <div className="font-medium">{exam.title}</div>
              <div className="text-xs text-muted-foreground">
                Код: {exam.roomCode} · {exam.questions.length} асуулт
              </div>
              <div className="text-xs text-muted-foreground">
                Хугацаа: {exam.duration ?? 45} мин · Товлосон:{" "}
                {formatDateTime(exam.scheduledAt)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-border px-2 py-1 text-xs">
                {exam.scheduledAt ? "Товлосон" : "Бэлэн"}
              </span>
              <button
                className="rounded-lg border border-border px-2 py-1 text-xs transition hover:bg-muted"
                onClick={() => onCopyCode(exam.roomCode)}
              >
                Хуулах
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
