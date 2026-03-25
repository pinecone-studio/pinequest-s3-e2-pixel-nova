import { cardClass } from "../styles";
import type { CheatStudent } from "../types";

type CheatMonitoringCardProps = {
  students: CheatStudent[];
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
        Хууран мэхлэлт хяналт
      </h2>
      <div className="mt-4 space-y-3 text-sm">
        {students.length === 0 && (
          <div className="rounded-xl border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
            Одоогоор сэжигтэй үйлдэл илрээгүй.
          </div>
        )}
        {students.map((student) => (
          <div
            key={student.id ?? student.name}
            className="flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2"
          >
            <div>
              <div className="font-medium">{student.name}</div>
              <div className="text-xs text-muted-foreground">
                Оноо: {student.score}% · Зөрчил: {student.events ?? 0}
              </div>
            </div>
            <span
              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                student.cheat === "Өндөр"
                  ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300"
                  : student.cheat === "Дунд"
                    ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300"
              }`}
            >
              {student.cheat}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
