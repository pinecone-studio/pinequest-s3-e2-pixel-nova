import { useMemo, useState } from "react";
import { cardClass } from "../styles";
import { formatDateTime } from "../utils";
import type { Exam } from "../types";

type ExamListCardProps = {
  exams: Exam[];
  onCopyCode: (code: string) => void;
};

export default function ExamListCard({ exams, onCopyCode }: ExamListCardProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "saved" | "draft">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "scheduled">("newest");

  const sortedExams = useMemo(() => {
    const filtered = exams.filter((exam) => {
      const matchesText = search
        ? exam.title.toLowerCase().includes(search.toLowerCase()) ||
          exam.roomCode.toLowerCase().includes(search.toLowerCase())
        : true;
      const isSaved = exam.questions.length > 0;
      const isScheduled = Boolean(exam.scheduledAt);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "scheduled" && isScheduled) ||
        (statusFilter === "saved" && isSaved) ||
        (statusFilter === "draft" && !isSaved && !isScheduled);
      return matchesText && matchesStatus;
    });

    const sorted = [...filtered].sort((left, right) => {
      if (sortBy === "oldest") return left.createdAt.localeCompare(right.createdAt);
      if (sortBy === "scheduled") {
        const leftTime = left.scheduledAt ? new Date(left.scheduledAt).getTime() : 0;
        const rightTime = right.scheduledAt ? new Date(right.scheduledAt).getTime() : 0;
        return rightTime - leftTime;
      }
      return right.createdAt.localeCompare(left.createdAt);
    });
    return sorted;
  }, [exams, search, statusFilter, sortBy]);
  const savedExams = exams.filter((exam) => exam.questions.length > 0).length;
  const scheduledExams = exams.filter((exam) => Boolean(exam.scheduledAt)).length;

  return (
    <div className={`${cardClass} overflow-hidden`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
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
            Хадгалсан шалгалтууд
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Draft, товлолт, room code бүгдийг нэг сангаас харна
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-semibold text-primary">
            Сан: {savedExams}
          </span>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-600 dark:text-emerald-300">
            Товлолт: {scheduledExams}
          </span>
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm">
        <div className="grid gap-2 md:grid-cols-[1.4fr_160px_160px]">
          <input
            className="w-full rounded-xl border border-border bg-muted/60 px-3 py-2 text-sm outline-none transition focus:border-primary"
            placeholder="Шалгах: нэр эсвэл room код"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="w-full rounded-xl border border-border bg-muted/60 px-3 py-2 text-sm outline-none transition focus:border-primary"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as typeof statusFilter)
            }
          >
            <option value="all">Бүгд</option>
            <option value="scheduled">Товлосон</option>
            <option value="saved">Санд хадгалсан</option>
            <option value="draft">Ноорог</option>
          </select>
          <select
            className="w-full rounded-xl border border-border bg-muted/60 px-3 py-2 text-sm outline-none transition focus:border-primary"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
          >
            <option value="newest">Сүүлд үүссэн</option>
            <option value="oldest">Эртний</option>
            <option value="scheduled">Товлосон огноо</option>
          </select>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        {sortedExams.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/60 px-4 py-8 text-center text-sm text-muted-foreground">
            Одоогоор шалгалт байхгүй байна.
          </div>
        )}
        {sortedExams.map((exam) => {
          const isSaved = exam.questions.length > 0;
          const statusLabel = exam.scheduledAt
            ? "Товлосон"
            : isSaved
              ? "Санд хадгалсан"
              : "Ноорог";
          const statusClass = exam.scheduledAt
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
            : isSaved
              ? "border-primary/20 bg-primary/10 text-primary"
              : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300";

          return (
            <div
              key={exam.id}
              className="rounded-2xl border border-border bg-muted/60 px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium">{exam.title}</div>
                    <span
                      className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${statusClass}`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Код: {exam.roomCode} · {exam.questions.length} асуулт · {exam.duration ?? 45} мин
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Үүсгэсэн: {formatDateTime(exam.createdAt)} · Товлосон:{" "}
                    {formatDateTime(exam.scheduledAt)}
                  </div>
                </div>
                <button
                  className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium transition hover:bg-card"
                  onClick={() => onCopyCode(exam.roomCode)}
                >
                  Room code хуулах
                </button>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-background px-3 py-2 text-xs">
                  <div className="text-muted-foreground">Хадгалалтын төлөв</div>
                  <div className="mt-1 font-semibold">
                    {isSaved ? "Асуулттай" : "Зөвхөн room"}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-background px-3 py-2 text-xs">
                  <div className="text-muted-foreground">Ашиглах үе</div>
                  <div className="mt-1 font-semibold">
                    {exam.scheduledAt ? "Хуваарьтай" : "Дахин ашиглахад бэлэн"}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-background px-3 py-2 text-xs">
                  <div className="text-muted-foreground">Шалгалтын түлхүүр</div>
                  <div className="mt-1 font-semibold">{exam.roomCode}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
