import { cardClass } from "../styles";
import { formatDate } from "../utils";
import { mockHistory } from "../constants";

type StudentResultsTabProps = {
  studentHistory: { examId: string; percentage: number; date: string }[];
};

export default function StudentResultsTab({
  studentHistory,
}: StudentResultsTabProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
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
            <path d="M4 19V5" />
            <path d="M4 19h16" />
            <path d="M8 15v-4" />
            <path d="M12 15V9" />
            <path d="M16 15v-6" />
          </svg>
          Сүүлийн дүн
        </h2>
        <div className="mt-4 space-y-3 text-sm">
          {studentHistory.length === 0
            ? mockHistory.map((exam) => (
                <div
                  key={exam.title}
                  className="flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2"
                >
                  <div>
                    <div className="font-medium">{exam.title}</div>
                    <div className="text-xs text-muted-foreground">{exam.date}</div>
                  </div>
                  <div className="text-xs font-semibold text-foreground">{exam.score}</div>
                </div>
              ))
            : studentHistory.map((exam) => (
                <div
                  key={`${exam.examId}-${exam.date}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2"
                >
                  <div>
                    <div className="font-medium">Шалгалт #{exam.examId.slice(-4)}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(exam.date)}</div>
                  </div>
                  <div className="text-xs font-semibold text-foreground">{exam.percentage}%</div>
                </div>
              ))}
        </div>
      </div>
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
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
            <path d="M21 12a9 9 0 1 0-9 9" />
          </svg>
          AI санал
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Ерөнхий гүйцэтгэл сайн байна. Хугацаагаа зөв хуваарилж,
          олон алхамтай бодлогод тооцоогоо дахин нягтлаарай.
        </p>
        <div className="mt-4 rounded-xl border border-border bg-muted px-3 py-2 text-xs">
          Дундаж дүн: 85%
        </div>
      </div>
    </section>
  );
}
