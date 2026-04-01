import { useEffect, useMemo, useState } from "react";
import {
  ChevronRightIcon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  FolderIcon,
  FolderSearch,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import type { Exam } from "../types";
import type { CopyCodeHandler } from "./RoomCodeCopyButton";
import TeacherEmptyState from "./TeacherEmptyState";

type ExamListCardProps = {
  exams: Exam[];
  onCopyCode: CopyCodeHandler;
  onCreateExam?: () => void;
  onOpenExam?: (examId: string) => void;
  onDownloadExam?: (examId: string) => void;
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

const getFolderSortValue = (label: string) => {
  const match = label.match(/^(\d+)/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]);
};

const compareFolders = (left: string, right: string) => {
  const leftValue = getFolderSortValue(left);
  const rightValue = getFolderSortValue(right);

  if (leftValue !== rightValue) return leftValue - rightValue;
  return left.localeCompare(right, "mn");
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

const getFileLabel = (exam: Exam) =>
  exam.description?.trim() ||
  `${exam.questionCount ?? exam.questions.length} асуулттай материал`;

export default function ExamListCard({
  exams,
  onCreateExam,
  onOpenExam,
  onDownloadExam,
}: Omit<ExamListCardProps, "onCopyCode"> & Pick<ExamListCardProps, "onCopyCode">) {
  const [search, setSearch] = useState("");

  const folders = useMemo(() => {
    const grouped = exams.reduce<Record<string, number>>((acc, exam) => {
      const key = getPrimaryFolder(exam);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return Object.keys(grouped)
      .sort(compareFolders)
      .map((label) => ({ label }));
  }, [exams]);

  const [activeFolder, setActiveFolder] = useState<string>(
    folders[0]?.label ?? "Бусад",
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

  const normalizedSearch = search.trim().toLowerCase();

  const visibleExams = useMemo(
    () =>
      [...exams]
        .filter((exam) => getPrimaryFolder(exam) === safeActiveFolder)
        .filter((exam) => {
          if (!normalizedSearch) return true;
          return [exam.title, exam.description, exam.className]
            .filter(Boolean)
            .some((value) =>
              String(value).toLowerCase().includes(normalizedSearch),
            );
        })
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [exams, normalizedSearch, safeActiveFolder],
  );

  return (
    <section className="grid w-full gap-0 bg-white xl:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="min-h-[calc(100vh-59px)] border-r border-[#ececec] bg-white pr-[12px] pt-[16px]">
        <div className="relative mx-[12px] flex h-[42px] items-center rounded-[10px] border border-[#e5e7eb] bg-white px-[14px]">
          <SearchIcon className="size-[18px] text-[#a3a3a3]" strokeWidth={2} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Хайх"
            className="ml-[10px] h-full w-full border-0 bg-transparent text-[14px] leading-5 text-[#6d6d6d] outline-none placeholder:text-[#a9a9a9]"
          />
        </div>

        <div className="mt-[12px] space-y-[4px] px-[12px]">
          {folders.map((folder) => {
            const isActive = folder.label === safeActiveFolder;
            return (
              <button
                key={folder.label}
                type="button"
                onClick={() => setActiveFolder(folder.label)}
                className={`flex h-[36px] w-full items-center gap-[6px] rounded-[8px] px-[10px] text-left text-[14px] leading-5 transition ${
                  isActive
                    ? "bg-[#f0f2f5] text-[#1b1b1b]"
                    : "text-[#616161] hover:bg-[#f5f5f5] hover:text-[#1b1b1b]"
                }`}
              >
                <ChevronRightIcon className="size-[16px] shrink-0 text-[#666666]" />
                <FolderIcon
                  className="size-[18px] shrink-0"
                  strokeWidth={1.8}
                />
                <span className="truncate">{folder.label}</span>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="min-w-0">
        <div className="w-full max-w-[1260px] px-[16px] pt-[28px] xl:px-[18px]">
          <div className="flex min-h-[65px] items-start justify-between gap-6">
            <div className="min-w-0 flex-1 pt-[2px]">
              <h2 className="text-[24px] font-semibold leading-[33px] tracking-[-0.02em] text-[#101010]">
                Шалгалтын сан
              </h2>
              <p className="mt-[3px] text-[16px] leading-6 text-[#a3a3a3]">
                Таны үүсгэсэн шалгалтын материалууд
              </p>
            </div>

            <button
              type="button"
              className="inline-flex h-[54px] w-[214px] shrink-0 items-center justify-center gap-[12px] whitespace-nowrap rounded-[16px] bg-[linear-gradient(180deg,#3f78ff_0%,#2f66ef_100%)] px-[20px] text-[18px] font-semibold leading-6 text-white shadow-[0_16px_28px_-22px_rgba(37,99,235,0.82)] transition hover:brightness-[1.03]"
              onClick={onCreateExam}
            >
              <PlusIcon className="h-6 w-6 shrink-0" strokeWidth={2.3} />
              Шалгалт үүсгэх
            </button>
          </div>

          <div className="mt-[16px] overflow-hidden rounded-[24px] border border-[#ededed] bg-white shadow-[0_12px_28px_-34px_rgba(15,23,42,0.12)]">
            {visibleExams.length === 0 ? (
              <div className="p-8">
                <TeacherEmptyState
                  icon={<FolderSearch className="size-5" />}
                  title="Шалгалт олдсонгүй"
                  description="Сонгосон ангилал эсвэл хайлтад тохирох шалгалт алга байна."
                  actionLabel={onCreateExam ? "Шалгалт үүсгэх" : undefined}
                  onAction={onCreateExam}
                />
              </div>
            ) : (
              visibleExams.map((exam, index) => (
                <div
                  key={exam.id}
                  className={`px-[18px] py-[16px] ${
                    index !== visibleExams.length - 1
                      ? "border-b border-[#ececec]"
                      : ""
                  }`}
                >
                  <div className="flex min-h-[48px] items-center justify-between gap-8">
                    <div className="flex min-w-0 flex-1 items-center gap-[14px]">
                      <div className="grid size-[38px] shrink-0 place-items-center rounded-[14px] border border-[#dfdfdf] text-[#5f6670]">
                        <FileTextIcon className="size-[18px]" strokeWidth={1.8} />
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col justify-center">
                        <button
                          type="button"
                          onClick={() => onOpenExam?.(exam.id)}
                          className="truncate text-left text-[16px] font-semibold leading-6 text-[#1d1d1d] transition hover:text-[#1d1d1d]"
                        >
                          {exam.title}
                        </button>
                        <div className="truncate text-[13px] leading-5 text-[#a1a1aa]">
                          {getFileLabel(exam)}
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 flex shrink-0 items-center gap-[24px]">
                      <button
                        type="button"
                        aria-label={`${exam.title} харах`}
                        className="text-[#2b2b2b] transition hover:text-black"
                        onClick={() => onOpenExam?.(exam.id)}
                      >
                        <EyeIcon className="size-[18px]" strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        aria-label={`${exam.title} татах`}
                        className="text-[#2b2b2b] transition hover:text-black"
                        onClick={() => onDownloadExam?.(exam.id)}
                      >
                        <DownloadIcon className="size-[18px]" strokeWidth={2} />
                      </button>
                      <span className="w-[108px] text-right text-[14px] leading-5 text-[#2b2b2b]">
                        {formatCreatedDate(exam.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
