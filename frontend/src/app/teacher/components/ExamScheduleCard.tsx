import { useEffect, useRef, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  buttonPrimary,
  cardClass,
  figmaCompactSelectClass,
  figmaFieldClass,
  figmaTextareaClass,
} from "../styles";

type ExamScheduleCardProps = {
  scheduleTitle: string;
  setScheduleTitle: (value: string) => void;
  scheduleDate: string;
  setScheduleDate: (value: string) => void;
  durationMinutes: number;
  setDurationMinutes: (value: number) => void;
  onSchedule: () => void;
  onClose?: () => void;
};

export default function ExamScheduleCard({
  scheduleTitle,
  setScheduleTitle,
  scheduleDate,
  setScheduleDate,
  durationMinutes,
  setDurationMinutes,
  onSchedule,
  onClose,
}: ExamScheduleCardProps) {
  const examTypes = [
    { value: "progress", label: "Явцын шалгалт" },
    { value: "term", label: "Улирлын шалгалт" },
  ] as const;
  const classOptions = [
    "6-р анги",
    "7-р анги",
    "8-р анги",
    "9-р анги",
    "10-р анги",
    "11-р анги",
    "12-р анги",
  ];
  const subjectOptions = [
    "Англи хэл",
    "Математик",
    "Монгол хэл",
    "Физик",
    "Хими",
    "Түүх",
  ];
  const minuteOptions = ["15", "30", "45", "60", "90"];
  const secondOptions = ["00", "15", "30", "45"];

  const [examType, setExamType] =
    useState<(typeof examTypes)[number]["value"]>("progress");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [description, setDescription] = useState("");
  const [seconds, setSeconds] = useState("00");
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedTime, setSelectedTime] = useState("09:00");
  const calendarRef = useRef<HTMLDivElement>(null);

  const selectedDate = scheduleDate ? new Date(scheduleDate) : undefined;

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    const [hours, mins] = selectedTime.split(":").map(Number);
    const next = new Date(day);
    next.setHours(hours, mins);
    setScheduleDate(
      `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}T${selectedTime}`,
    );
  };

  const handleTimeChange = (value: string) => {
    setSelectedTime(value);
    if (selectedDate) {
      const [hours, mins] = value.split(":").map(Number);
      const next = new Date(selectedDate);
      next.setHours(hours, mins);
      setScheduleDate(
        `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}T${value}`,
      );
    }
  };

  const displayDate = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")} ${selectedTime}`
    : "";

  const examTypeLabel =
    examTypes.find((item) => item.value === examType)?.label ?? "";

  useEffect(() => {
    const nextTitle = [selectedClass, selectedSubject, examTypeLabel]
      .filter(Boolean)
      .join(" ");
    if (nextTitle !== scheduleTitle) {
      setScheduleTitle(nextTitle);
    }
  }, [
    examTypeLabel,
    scheduleTitle,
    selectedClass,
    selectedSubject,
    setScheduleTitle,
  ]);

  return (
    <div className={`${cardClass} h-full font-sans`}>
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
            <div className="grid gap-4">
              <div className="text-[16px] font-semibold text-black">Төрөл</div>
              <div className="flex flex-wrap items-center gap-[30px]">
                {examTypes.map((item) => {
                  const checked = examType === item.value;
                  return (
                    <button
                      key={item.value}
                      className="inline-flex items-center gap-[10px]"
                      onClick={() => setExamType(item.value)}
                      type="button"
                    >
                      <span
                        className={`grid size-5 place-items-center rounded-full border-[2.5px] ${
                          checked ? "border-[#2563eb]" : "border-[#bbbbbb]"
                        }`}
                      >
                        {checked && (
                          <span className="size-2 rounded-full bg-[#2563eb]" />
                        )}
                      </span>
                      <span className="text-[14px] font-medium text-black">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="grid gap-3">
              <span className="text-[16px] font-semibold text-black">Анги</span>
              <select
                className={figmaFieldClass}
                value={selectedClass}
                onChange={(event) => setSelectedClass(event.target.value)}
              >
                <option value="">Анги сонгоно уу.</option>
                {classOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-3">
              <span className="text-[16px] font-semibold text-black">
                Хичээл
              </span>
              <select
                className={figmaFieldClass}
                value={selectedSubject}
                onChange={(event) => setSelectedSubject(event.target.value)}
              >
                <option value="">Хичээл сонгоно уу.</option>
                {subjectOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-3">
              <span className="text-[16px] font-semibold text-black">
                Тайлбар
              </span>
              <textarea
                className={figmaTextareaClass}
                placeholder="Жишээ нь: Шалгалтын сэдэв"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>

            <div className="grid gap-3">
              <span className="text-[16px] font-semibold text-black">
                Огноо
              </span>
              <button
                type="button"
                className={`${figmaFieldClass} flex items-center justify-between text-left`}
                onClick={() => setShowCalendar((prev) => !prev)}
              >
                <span
                  className={!displayDate ? "text-[rgba(63,65,69,0.6)]" : ""}
                >
                  {displayDate || "Он, сар, өдрөө оруулна уу..."}
                </span>
                <svg
                  className="size-4 shrink-0 text-[rgba(63,65,69,0.6)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {showCalendar && (
                <div
                  ref={calendarRef}
                  className="rounded-2xl border border-[#dce5ef] bg-white p-3 shadow-md"
                >
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDaySelect}
                  />
                  <div className="mt-3 flex items-center gap-3 border-t border-[#dce5ef] pt-3">
                    <span className="text-sm font-medium text-black">Цаг:</span>
                    <input
                      type="time"
                      className={`${figmaFieldClass} flex-1`}
                      value={selectedTime}
                      onChange={(e) => handleTimeChange(e.target.value)}
                    />
                    <button
                      type="button"
                      className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
                      onClick={() => setShowCalendar(false)}
                    >
                      Болсон
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-3">
              <span className="text-[16px] font-semibold text-black">
                Гүйцэтгэх хугацаа (Заавал биш)
              </span>
              <div className="flex flex-wrap gap-5">
                <select
                  className={`${figmaCompactSelectClass} min-w-[100px]`}
                  value={String(durationMinutes)}
                  onChange={(event) =>
                    setDurationMinutes(Number(event.target.value))
                  }
                >
                  {minuteOptions.map((item) => (
                    <option key={item} value={item}>
                      {item === "15" ? "Минут" : `${item} минут`}
                    </option>
                  ))}
                </select>
                <select
                  className={`${figmaCompactSelectClass} min-w-[110px]`}
                  value={seconds}
                  onChange={(event) => setSeconds(event.target.value)}
                >
                  {secondOptions.map((item) => (
                    <option key={item} value={item}>
                      {item === "00" ? "Секунд" : `${item} секунд`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
