import { useEffect, useMemo, useState } from "react";
import {
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  FolderIcon,
  SearchIcon,
} from "lucide-react";
import { sectionDescriptionClass, contentCanvasClass } from "../styles";
import { formatDateTime } from "../utils";
import type { Exam } from "../types";

type ExamListCardProps = {
  exams: Exam[];
  onCopyCode: (code: string) => void;
  onCreateExam?: () => void;
  onOpenExam?: (examId: string) => void;
};

const getPrimaryFolder = (exam: Exam) => {
  const firstClass = exam.className
    ?.split(",")
    .map((item) => item.trim())
    .find(Boolean);

  if (!firstClass) return "Бусад";

  const match = firstClass.match(/^(\d+)/);
  if (!match) return firstClass;

  return `${match[1]}-р анги`;
};

const getStatus = (exam: Exam) => {
  const now = Date.now();
  if (exam.status === "active" || exam.status === "in_progress") {
    return { label: "Явагдаж буй", tone: "bg-amber-100 text-amber-700" };
  }
  if (exam.status === "scheduled") {
    return { label: "Товлосон", tone: "bg-blue-100 text-blue-700" };
  }
  if (exam.finishedAt || exam.status === "finished") {
    return { label: "Ашигласан", tone: "bg-emerald-100 text-emerald-700" };
  }
  if (exam.scheduledAt) {
    const scheduled = new Date(exam.scheduledAt).getTime();
    if (!Number.isNaN(scheduled) && scheduled > now) {
      return { label: "Товлосон", tone: "bg-blue-100 text-blue-700" };
    }
  }
  return { label: "Бэлэн сан", tone: "bg-slate-100 text-slate-600" };
};

export default function ExamListCard({
  exams,
  onCopyCode,
  onCreateExam,
  onOpenExam,
}: ExamListCardProps) {
  const [search, setSearch] = useState("");
  const folders = useMemo(() => {
    const grouped = exams.reduce<Record<string, number>>((acc, exam) => {
      const key = getPrimaryFolder(exam);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([left], [right]) => left.localeCompare(right, "mn"))
      .map(([label, count]) => ({ label, count }));
  }, [exams]);

  const [activeFolder, setActiveFolder] = useState<string>(
    folders[0]?.label ?? "Бусад",
  );

  const normalizedSearch = search.trim().toLowerCase();

  const visibleExams = useMemo(
    () =>
      [...exams]
        .filter((exam) => getPrimaryFolder(exam) === activeFolder)
        .filter((exam) => {
          if (!normalizedSearch) return true;
          return [exam.title, exam.description, exam.className, exam.roomCode]
            .filter(Boolean)
            .some((value) =>
              String(value).toLowerCase().includes(normalizedSearch),
            );
        })
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [activeFolder, exams, normalizedSearch],
  );

  const safeActiveFolder = folders.some(
    (folder) => folder.label === activeFolder,
  )
    ? activeFolder
    : (folders[0]?.label ?? "Бусад");

  useEffect(() => {
    if (safeActiveFolder !== activeFolder && folders.length > 0) {
      setActiveFolder(safeActiveFolder);
    }
  }, [activeFolder, folders.length, safeActiveFolder]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[1.65rem] font-semibold tracking-[-0.02em] text-slate-900">
            Шалгалтын сан
          </h2>
          <p className={`mt-1 ${sectionDescriptionClass}`}>
            Таны үүсгэсэн шалгалтын материалууд
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-2xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
          onClick={onCreateExam}
        >
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Шалгалт үүсгэх
        </button>
      </div>

      <div
        className={`grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] ${contentCanvasClass}`}
      >
        <aside className="space-y-4 border-b border-[#edf1f6] pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Хайх"
              className="h-11 w-full rounded-2xl border border-[#dce5ef] bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#dbeafe]"
            />
          </div>

          <div className="space-y-1">
            {folders.map((folder) => {
              const active = folder.label === safeActiveFolder;
              return (
                <button
                  key={folder.label}
                  type="button"
                  onClick={() => setActiveFolder(folder.label)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    active
                      ? "bg-white border border-black text-slate-900"
                      : "text-slate-600 hover:bg-[#f8fafc] hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FolderIcon className="size-4" />
                    <span>{folder.label}</span>
                  </span>
                  <span className="text-xs text-slate-400">{folder.count}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="space-y-3">
          {visibleExams.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[#dce5ef] px-5 py-12 text-center text-sm text-slate-400">
              Сонгосон ангилалд шалгалт олдсонгүй.
            </div>
          ) : (
            visibleExams.map((exam) => {
              const status = getStatus(exam);
              return (
                <div
                  key={exam.id}
                  className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 rounded-[24px] border border-[#edf1f6] bg-white px-5 py-4 transition hover:border-[#dbe4f0] hover:bg-white"
                >
                  <div className="flex size-11 items-center justify-center rounded-[16px] border border-[#e3e8ef] bg-white text-slate-400">
                    <svg
                      className="size-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14 2v6h6"
                      />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-semibold text-slate-900">
                      {exam.title}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="truncate">
                        {exam.description ||
                          `${exam.questions.length} асуулттай материал`}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.tone}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-slate-500">
                    <button
                      type="button"
                      className="transition hover:text-slate-800"
                      title="Дэлгэрэнгүй харах"
                      onClick={() => onOpenExam?.(exam.id)}
                    >
                      <EyeIcon className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="transition hover:text-slate-800"
                      title="Өрөөний код хуулах"
                      onClick={() => onCopyCode(exam.roomCode)}
                    >
                      <CopyIcon className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="transition hover:text-slate-800"
                      title="Татаж авах"
                    >
                      <DownloadIcon className="size-4" />
                    </button>
                    <span className="w-24 text-right text-xs text-slate-500">
                      {formatDateTime(exam.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
