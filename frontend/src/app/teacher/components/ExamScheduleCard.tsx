import { useMemo, useState } from "react";
import type { Exam } from "../types";
import {
  buttonPrimary,
  cardClass,
} from "../styles";
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
        .filter((exam) => {
          if (exam.questions.length === 0) return false;
          const status = exam.status ?? "draft";
          return status === "draft" || status === "scheduled";
        })
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [exams],
  );

  return (
    <div className={`${cardClass} overflow-auto font-sans w-125 h-211 `}>
      <div className="grid gap-6">
        {onClose && (
          <div className="flex items-center justify-between">
            <span className="text-[18px] font-semibold text-black">
              Шалгалтын хуваарь
            </span>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full hover:bg-gray-100"
              onClick={onClose}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-4 text-gray-600"
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
          </div>
        )}

        <div className="grid gap-4">
          <div className="grid gap-4">
            <ExamScheduleTypeSelector
              scheduleExamType={scheduleExamType}
              setScheduleExamType={setScheduleExamType}
            />
            <ExamScheduleMetaFields
              scheduleClassName={scheduleClassName}
              setScheduleClassName={setScheduleClassName}
              scheduleGroupName={scheduleGroupName}
              setScheduleGroupName={setScheduleGroupName}
              scheduleSubjectName={scheduleSubjectName}
              setScheduleSubjectName={setScheduleSubjectName}
              scheduleDescription={scheduleDescription}
              setScheduleDescription={setScheduleDescription}
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
            <ExamScheduleFilePicker
              selectableExams={selectableExams}
              selectedScheduleExamId={selectedScheduleExamId}
              setSelectedScheduleExamId={setSelectedScheduleExamId}
            />
          </div>
        </div>

        <button
          className={`w-full ${buttonPrimary}`}
          onClick={onSchedule}
          type="button"
        >
          Хуваарь үүсгэх
        </button>
      </div>
    </div>
  );
}
