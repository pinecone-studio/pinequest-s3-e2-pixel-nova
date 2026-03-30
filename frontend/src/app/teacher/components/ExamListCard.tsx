import { useEffect, useMemo, useState } from "react";
import {
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  FolderSearch,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { sectionDescriptionClass } from "../styles";
import type { Exam } from "../types";
import type { CopyCodeHandler } from "./RoomCodeCopyButton";
import TeacherEmptyState from "./TeacherEmptyState";
import { Input } from "@/components/ui/input";

type ExamListCardProps = {
  exams: Exam[];
  onCopyCode: CopyCodeHandler;
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
    return { label: "Дууссан", tone: "bg-emerald-100 text-emerald-700" };
  }
  if (exam.scheduledAt) {
    const scheduled = new Date(exam.scheduledAt).getTime();
    if (!Number.isNaN(scheduled) && scheduled > now) {
      return { label: "Товлосон", tone: "bg-blue-100 text-blue-700" };
    }
  }
  return { label: "Бэлэн сан", tone: "bg-slate-100 text-slate-600" };
};

const formatCreatedDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replace(/-/g, "/");
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
    <section className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)]  max-w-[1480px]">
      <aside className="h-screen border border-[#e6e9ef] bg-white/90 p-3 w-[250px]">
        <div className="relative rounded-[8px] border border-[#e5e7eb] bg-white flex items-center px-2 justify-start h-10">
          <SearchIcon className="text-[#a3a9b6] text-xs" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Хайх"
            className="outline-none border-none bg-transparent text-xs"
          />
        </div>

        <div className="mt-4 space-y-1">
          {folders.map((folder) => {
            const active = folder.label === safeActiveFolder;
            return (
              <button
                key={folder.label}
                type="button"
                onClick={() => setActiveFolder(folder.label)}
                className={`flex w-full items-center justify-between rounded-[8px] px-2.5 py-2 text-left text-xs transition ${
                  active
                    ? "bg-[#f1f3f5] text-slate-900"
                    : "text-slate-600 hover:bg-[#f8fafc] hover:text-slate-900"
                }`}>
                <span className="flex min-w-0 items-center gap-1.5">
                  <ChevronRightIcon className="size-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{folder.label}</span>
                </span>
                <span className="shrink-0 text-[11px] text-slate-400">
                  {folder.count}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="overflow-hidden p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#edf1f6] px-4 py-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Шалгалтын сан
            </h2>
            <p
              className={`mt-0.5 text-xl font-normal ${sectionDescriptionClass}`}>
              Таны үүсгэсэн шалгалтын материалууд
            </p>
          </div>

          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-[#2563eb] px-3 text-xs font-medium text-white transition hover:bg-[#1d4ed8]"
            onClick={onCreateExam}>
            <PlusIcon className="size-3.5" />
            Шалгалт үүсгэх
          </button>
        </div>

        <div className="divide-y divide-[#edf1f6]">
          {visibleExams.length === 0 ? (
            <div className="p-6">
              <TeacherEmptyState
                icon={<FolderSearch className="size-5" />}
                title="Шалгалт олдсонгүй"
                description="Сонгосон ангилал эсвэл хайлтад тохирох шалгалт алга байна."
                actionLabel={onCreateExam ? "Шалгалт үүсгэх" : undefined}
                onAction={onCreateExam}
              />
            </div>
          ) : (
            visibleExams.map((exam) => {
              const status = getStatus(exam);
              return (
                <div
                  key={exam.id}
                  className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4">
                  <div className="flex size-8 items-center justify-center rounded-full border border-[#d8dde6] text-[#9aa4b2]">
                    <FileTextIcon className="size-4" strokeWidth={1.7} />
                  </div>

                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onOpenExam?.(exam.id)}
                      className="truncate text-left text-[13px] font-medium text-slate-800 transition hover:text-[#2563eb]">
                      {exam.title}
                    </button>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span className="truncate">
                        {exam.description ||
                          `${exam.questionCount ?? exam.questions.length} асуулттай материал`}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold ${status.tone}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[#4b5563]">
                    <button
                      type="button"
                      className="transition hover:text-slate-900"
                      title="Дэлгэрэнгүй харах"
                      onClick={() => onOpenExam?.(exam.id)}>
                      <EyeIcon className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="transition hover:text-slate-900"
                      title="Код хуулах"
                      onClick={() => onCopyCode(exam.roomCode)}>
                      <CopyIcon className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="transition hover:text-slate-900"
                      title="Татаж авах">
                      <DownloadIcon className="size-3.5" />
                    </button>
                    <span className="w-20 text-right text-[11px] text-slate-500">
                      {formatCreatedDate(exam.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
