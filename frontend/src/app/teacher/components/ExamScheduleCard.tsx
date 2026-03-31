import { useMemo, useState } from "react";
import type { Exam } from "../types";
import { buttonPrimary, cardClass } from "../styles";
import ExamScheduleTypeSelector from "./ExamScheduleTypeSelector";
import ExamScheduleMetaFields from "./ExamScheduleMetaFields";
import ExamScheduleDatePicker from "./ExamScheduleDatePicker";
import ExamScheduleDuration from "./ExamScheduleDuration";
import ExamScheduleFilePicker from "./ExamScheduleFilePicker";

type ExamScheduleCardProps = {
  exams: Exam[];
  selectedScheduleExamId: string;
  setSelectedScheduleExamId: (value: string) => void;
  scheduleDate: string;
  setScheduleDate: (value: string) => void;
  scheduleExamType: string;
  setScheduleExamType: (value: string) => void;
  scheduleClassName: string;
  setScheduleClassName: (value: string) => void;
  scheduleGroupName: string;
  setScheduleGroupName: (value: string) => void;
  scheduleSubjectName: string;
  setScheduleSubjectName: (value: string) => void;
  scheduleDescription: string;
  setScheduleDescription: (value: string) => void;
  durationMinutes: number;
  setDurationMinutes: (value: number) => void;
  onSchedule: () => void;
  onClose?: () => void;
};

export default function ExamScheduleCard({
  exams,
  selectedScheduleExamId,
  setSelectedScheduleExamId,
  scheduleDate,
  setScheduleDate,
  scheduleExamType,
  setScheduleExamType,
  scheduleClassName,
  setScheduleClassName,
  scheduleGroupName,
  setScheduleGroupName,
  scheduleSubjectName,
  setScheduleSubjectName,
  scheduleDescription,
  setScheduleDescription,
  durationMinutes,
  setDurationMinutes,
  onSchedule,
  onClose,
}: ExamScheduleCardProps) {
  const [seconds, setSeconds] = useState("00");
  const selectableExams = useMemo(
    () =>
      exams
        .filter((exam) => Boolean(exam.id) && Boolean(exam.title?.trim()))
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [exams],
  );

  return (
    <div
      className={`${cardClass} max-h-[calc(100vh-32px)] w-full max-w-101 overflow-auto p-5 font-sans sm:p-6`}
    >
      <div className="grid gap-6">
        <div className="flex items-center justify-between">
          <span className="text-[18px] font-semibold text-black">
            Шалгалтын хуваарь
          </span>
          {onClose && (
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100"
              onClick={onClose}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        <div className="grid gap-5">
          <ExamScheduleTypeSelector
            scheduleExamType={scheduleExamType}
            setScheduleExamType={setScheduleExamType}
          />
          <ExamScheduleMetaFields
            scheduleClassName={scheduleClassName}
            setScheduleClassName={setScheduleClassName}
            scheduleDescription={scheduleDescription}
            setScheduleDescription={setScheduleDescription}
            scheduleSubjectName={scheduleSubjectName}
            setScheduleSubjectName={setScheduleSubjectName}
          />
          <ExamScheduleFilePicker
            selectableExams={selectableExams}
            selectedScheduleExamId={selectedScheduleExamId}
            setSelectedScheduleExamId={setSelectedScheduleExamId}
          />
          <ExamScheduleDatePicker
            scheduleDate={scheduleDate}
            setScheduleDate={setScheduleDate}
          />
          <ExamScheduleDuration
            durationMinutes={durationMinutes}
            setDurationMinutes={setDurationMinutes}
            seconds={seconds}
            setSeconds={setSeconds}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          {onClose && (
            <button
              className="min-w-20.5 rounded-[14px] border border-[#dfdfdf] bg-white px-4 py-2.5 text-[14px] font-medium text-[#5b6068] transition hover:bg-[#f8fafc]"
              onClick={onClose}
              type="button"
            >
              Болих
            </button>
          )}
          <button
            className={`min-w-27.5 rounded-[14px] px-5 py-2.5 text-[14px] ${buttonPrimary}`}
            onClick={onSchedule}
            type="button"
          >
            Хадгалах
          </button>
        </div>
      </div>
    </div>
  );
}
