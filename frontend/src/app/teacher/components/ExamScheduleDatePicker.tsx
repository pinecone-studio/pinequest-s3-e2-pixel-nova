import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { figmaFieldClass } from "../styles";

type ExamScheduleDatePickerProps = {
  scheduleDate: string;
  setScheduleDate: (value: string) => void;
};

export default function ExamScheduleDatePicker({
  scheduleDate,
  setScheduleDate,
}: ExamScheduleDatePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedTime, setSelectedTime] = useState("09:00");
  const calendarRef = useRef<HTMLDivElement>(null);
  const minDate = useMemo(() => {
    const next = new Date();
    next.setHours(0, 0, 0, 0);
    return next;
  }, []);
  const maxDate = useMemo(() => {
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    next.setHours(23, 59, 59, 999);
    return next;
  }, []);

  const selectedDate = scheduleDate ? new Date(scheduleDate) : undefined;
  const isDateSelectable = (date: Date) => date >= minDate && date <= maxDate;

  useEffect(() => {
    if (!scheduleDate) return;

    const nextSelectedDate = new Date(scheduleDate);
    if (isNaN(nextSelectedDate.getTime())) return;

    setSelectedTime(
      `${String(nextSelectedDate.getHours()).padStart(2, "0")}:${String(nextSelectedDate.getMinutes()).padStart(2, "0")}`,
    );
  }, [scheduleDate]);

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    if (!isDateSelectable(day)) return;
    const [hours, mins] = selectedTime.split(":").map(Number);
    const next = new Date(day);
    next.setHours(hours, mins);
    setScheduleDate(
      `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}T${selectedTime}`,
    );
  };

  const handleTimeChange = (value: string) => {
    setSelectedTime(value);
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      const [hours, mins] = value.split(":").map(Number);
      const next = new Date(selectedDate);
      next.setHours(hours, mins);
      setScheduleDate(
        `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}T${value}`,
      );
    }
  };

  const isValidDate =
    selectedDate instanceof Date && !isNaN(selectedDate.getTime());
  const displayDate = isValidDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")} ${selectedTime}`
    : "";

  return (
    <div className="grid gap-3">
      <span className="text-[16px] font-semibold text-black">Огноо</span>
      <button
        type="button"
        className={`${figmaFieldClass} flex items-center justify-between text-left`}
        onClick={() => setShowCalendar((prev) => !prev)}
      >
        <span className={!displayDate ? "text-[rgba(63,65,69,0.6)]" : ""}>
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
      <div className="text-xs text-slate-400">
        Өнөөдрөөс 1 сар хүртэл хуваарьлана.
      </div>
      {showCalendar && (
        <div
          ref={calendarRef}
          className="rounded-2xl border border-[#dce5ef] bg-white p-3 shadow-md"
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDaySelect}
            fromDate={minDate}
            defaultMonth={minDate}
            disabled={(date) => !isDateSelectable(date)}
            classNames={{
              today:
                "rounded-md bg-[#eef2ff] text-slate-900 font-semibold ring-2 ring-[#2563eb]/30",
            }}
          />
          <div className="mt-3 flex items-center gap-3 border-t border-[#dce5ef] pt-3">
            <span className="text-sm font-medium text-black">Цаг:</span>
            <input
              type="time"
              className={`${figmaFieldClass} flex-1`}
              value={selectedTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              onWheel={(event) => event.currentTarget.blur()}
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
  );
}
