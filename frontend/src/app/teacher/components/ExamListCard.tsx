import { sectionDescriptionClass, contentCanvasClass } from "../styles";
import { formatDateTime } from "../utils";
import type { Exam } from "../types";
import { CopyIcon, DownloadIcon } from "lucide-react";

type ExamListCardProps = {
  exams: Exam[];
  onCopyCode: (code: string) => void;
  onCreateExam?: () => void;
};

export default function ExamListCard({
  exams,
  onCopyCode,
  onCreateExam,
}: ExamListCardProps) {
  const sortedExams = [...exams].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[1.65rem] font-semibold tracking-[-0.02em] text-slate-900 ">
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

      <div className={contentCanvasClass}>
        {sortedExams.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Одоогоор шалгалт байхгүй байна.
          </div>
        ) : (
          <ul>
            {sortedExams.map((exam, index) => (
              <li
                key={exam.id}
                className={`flex items-center gap-4 py-4 ${
                  index !== sortedExams.length - 1
                    ? "border-b border-[#f0f4f9]"
                    : ""
                }`}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#dce5ef] bg-[#f8fafc]">
                  <svg
                    className="size-5 text-slate-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.7}
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

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-900">
                    {exam.title}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-400">
                    {exam.roomCode}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    className="flex size-8 items-center justify-center rounded-full hover:bg-[#f0f4f9]"
                    onClick={() => onCopyCode(exam.roomCode)}
                    title="Room code хуулах"
                  >
                    <CopyIcon className="w-4 h-4"/>
                  </button>
                  <button
                    type="button"
                    className="flex size-8 items-center justify-center rounded-full hover:bg-[#f0f4f9]"
                    title="Татаж авах"
                  >
                    <DownloadIcon className="w-4 h-4"/>
                  </button>
                  <span className="w-24 text-right text-xs text-slate-400">
                    {formatDateTime(exam.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
