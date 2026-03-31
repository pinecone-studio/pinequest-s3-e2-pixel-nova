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
  scheduleExpectedStudentsCount: number;
  setScheduleExpectedStudentsCount: (value: number) => void;
  scheduleLocationPolicy: "anywhere" | "school_only";
  setScheduleLocationPolicy: (value: "anywhere" | "school_only") => void;
  scheduleLocationLabel: string;
  setScheduleLocationLabel: (value: string) => void;
  scheduleLocationLatitude: string;
  setScheduleLocationLatitude: (value: string) => void;
  scheduleLocationLongitude: string;
  setScheduleLocationLongitude: (value: string) => void;
  scheduleAllowedRadiusMeters: number;
  setScheduleAllowedRadiusMeters: (value: number) => void;
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
  scheduleExpectedStudentsCount,
  setScheduleExpectedStudentsCount,
  scheduleLocationPolicy,
  setScheduleLocationPolicy,
  scheduleLocationLabel,
  setScheduleLocationLabel,
  scheduleLocationLatitude,
  setScheduleLocationLatitude,
  scheduleLocationLongitude,
  setScheduleLocationLongitude,
  scheduleAllowedRadiusMeters,
  setScheduleAllowedRadiusMeters,
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
      className={`${cardClass} max-h-[min(90vh,1040px)] w-full max-w-[1080px] overflow-auto p-6 font-sans sm:p-7 lg:p-8 no-scrollbar`}
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
            scheduleExpectedStudentsCount={scheduleExpectedStudentsCount}
            setScheduleExpectedStudentsCount={setScheduleExpectedStudentsCount}
            scheduleSubjectName={scheduleSubjectName}
            setScheduleSubjectName={setScheduleSubjectName}
            scheduleLocationPolicy={scheduleLocationPolicy}
            setScheduleLocationPolicy={setScheduleLocationPolicy}
            scheduleLocationLabel={scheduleLocationLabel}
            setScheduleLocationLabel={setScheduleLocationLabel}
            scheduleLocationLatitude={scheduleLocationLatitude}
            setScheduleLocationLatitude={setScheduleLocationLatitude}
            scheduleLocationLongitude={scheduleLocationLongitude}
            setScheduleLocationLongitude={setScheduleLocationLongitude}
            scheduleAllowedRadiusMeters={scheduleAllowedRadiusMeters}
            setScheduleAllowedRadiusMeters={setScheduleAllowedRadiusMeters}
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
