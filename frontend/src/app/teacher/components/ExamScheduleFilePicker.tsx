import type { Exam } from "../types";
import TeacherEmptyState from "./TeacherEmptyState";
import TeacherSelect from "./TeacherSelect";
import { FileSearch } from "lucide-react";

type ExamScheduleFilePickerProps = {
  selectableExams: Exam[];
  selectedScheduleExamId: string;
  setSelectedScheduleExamId: (value: string) => void;
};

export default function ExamScheduleFilePicker({
  selectableExams,
  selectedScheduleExamId,
  setSelectedScheduleExamId,
}: ExamScheduleFilePickerProps) {
  const selectedExam =
    selectableExams.find((exam) => exam.id === selectedScheduleExamId) ?? null;

  return (
    <div className="grid gap-3">
      <span className="text-[16px] font-semibold text-black">Шалгалтын файл</span>
      {selectableExams.length === 0 ? (
        <TeacherEmptyState
          icon={<FileSearch className="h-5 w-5" />}
          title="Сонгох материал алга"
          description="Эхлээд асуулттай шалгалт үүсгэ. Нэг материалыг хэдэн ч удаа шинэ хуваарьт ашиглаж болно."
        />
      ) : (
        <div className="grid gap-3">
          <TeacherSelect
            options={[
              { value: "", label: "Шалгалтын файл сонгоно уу." },
              ...selectableExams.map((exam) => ({
                value: exam.id,
                label: exam.title,
              })),
            ]}
            value={selectedScheduleExamId}
            onChange={(event) => setSelectedScheduleExamId(event.target.value)}
          />

          {selectedExam && (
            <div className="flex items-center gap-3 rounded-2xl border border-[#e5ecf3] bg-[#fafcff] px-4 py-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#dce5ef] bg-white">
                <svg
                  className="size-5 text-slate-500"
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
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-900">
                  {selectedExam.title}
                </div>
                <div className="mt-1 truncate text-xs text-slate-500">
                  {(selectedExam.questionCount ?? selectedExam.questions.length ?? 0)} асуулт
                  {selectedExam.description
                    ? ` · ${selectedExam.description}`
                    : ""}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
