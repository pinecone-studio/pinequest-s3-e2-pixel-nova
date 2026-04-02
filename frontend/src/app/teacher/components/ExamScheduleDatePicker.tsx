import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
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
  const [selectedHour, setSelectedHour] = useState("09");
  const [selectedMinute, setSelectedMinute] = useState("00");
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

    const nextHour = String(nextSelectedDate.getHours()).padStart(2, "0");
    const nextMinute = String(nextSelectedDate.getMinutes()).padStart(2, "0");
    setSelectedHour(nextHour);
    setSelectedMinute(nextMinute);
  }, [scheduleDate]);

  const selectedTime = `${selectedHour}:${selectedMinute}`;

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    if (!isDateSelectable(day)) return;
    const next = new Date(day);
    next.setHours(Number(selectedHour), Number(selectedMinute));
    setScheduleDate(next.toISOString());
  };

  const syncDateTime = (hour: string, minute: string) => {
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      const next = new Date(selectedDate);
      next.setHours(Number(hour), Number(minute));
      setScheduleDate(next.toISOString());
    }
  };

  const handleExactTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    const [hour, minute] = nextValue.split(":");
    if (!hour || !minute) return;

    setSelectedHour(hour);
    setSelectedMinute(minute);
    syncDateTime(hour, minute);
  };

  const isValidDate =
    selectedDate instanceof Date && !isNaN(selectedDate.getTime());
  const displayDate = isValidDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")} ${selectedTime}`
    : "";

  const pendingLabel = isValidDate
    ? `${selectedDate.getFullYear()} оны ${selectedDate.getMonth() + 1} сарын ${selectedDate.getDate()} • ${selectedTime}`
    : "";

  return (
    <div className="relative grid gap-3">
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

      {showCalendar && (
        <div
          ref={calendarRef}
          className="absolute left-0 top-[calc(100%+10px)] z-30 w-full max-w-full overflow-hidden rounded-[24px] border border-[#e5e7eb] bg-white shadow-[0_26px_70px_-42px_rgba(15,23,42,0.38)]"
        >
          <div className="grid gap-0">
            <div
              data-testid="schedule-calendar-content"
              className="flex justify-center p-4 sm:p-5"
            >
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDaySelect}
                fromDate={minDate}
                defaultMonth={selectedDate ?? minDate}
                disabled={(date) => !isDateSelectable(date)}
                formatters={{
                  formatCaption: (date) =>
                    date.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    }),
                  formatWeekdayName: (date) =>
                    date
                      .toLocaleDateString("en-US", { weekday: "short" })
                      .slice(0, 2),
                }}
                className="mx-auto p-0"
                classNames={{
                  root: "mx-auto w-fit",
                  months: "justify-center",
                  month: "mx-auto gap-4",
                  nav: "absolute inset-x-0 top-0 flex items-center justify-between",
                  button_previous:
                    "flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white text-[#2563EB] shadow-none transition hover:bg-[#eff6ff]",
                  button_next:
                    "flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white text-[#2563EB] shadow-none transition hover:bg-[#eff6ff]",
                  month_caption:
                    "relative flex h-10 items-center justify-center px-12",
                  caption_label:
                    "text-[20px] font-semibold tracking-[-0.03em] text-slate-900",
                  weekdays: "mt-5 grid grid-cols-7 gap-y-1",
                  weekday:
                    "flex h-8 items-center justify-center text-[13px] font-medium text-slate-500",
                  week: "mt-1 grid grid-cols-7",
                  day: "flex items-center justify-center p-0",
                  day_button:
                    "flex h-10 w-10 items-center justify-center rounded-xl border-0 bg-transparent text-[15px] font-medium text-slate-700 transition hover:bg-[#eff6ff]",
                  selected: "bg-transparent",
                  today:
                    "rounded-xl bg-[#eff6ff] text-[#2563EB] font-semibold ring-1 ring-[#bfdbfe]",
                }}
              />
            </div>

            <div className="border-t border-[#edf0f4] px-4 py-4">
              <div className="grid gap-2">
                <div className="flex justify-center">
                  <input
                    type="time"
                    min="08:00"
                    max="23:59"
                    step={60}
                    value={`${selectedHour}:${selectedMinute}`}
                    onChange={handleExactTimeChange}
                    className="h-12 w-full max-w-[220px] rounded-[14px] border border-[#dbe4f1] bg-white px-4 text-center text-[18px] font-semibold tracking-[0.08em] text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#bfdbfe]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#edf0f4] bg-white px-4 py-4">
            {isValidDate ? (
              <div className="flex min-w-0 items-center justify-center rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-2.5 text-center text-[14px] font-medium text-slate-700">
                <span className="truncate">{pendingLabel}</span>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-[14px] font-medium text-slate-600 transition hover:bg-[#f8fafc]"
                onClick={() => setShowCalendar(false)}
              >
                Болих
              </button>
              <button
                type="button"
                className="rounded-xl bg-[#2563EB] px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#1d4ed8]"
                onClick={() => setShowCalendar(false)}
              >
                Сонгох
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
