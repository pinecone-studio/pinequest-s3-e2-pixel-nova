"use client";

import { Fragment, useState } from "react";
import type { Exam } from "../types";
import ExamScheduleCard from "./ExamScheduleCard";

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
const DAYS_COUNT = 5;

function getWeekDays(ref: Date): Date[] {
  const monday = new Date(ref);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  return Array.from({ length: DAYS_COUNT }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isOptionalExam(title: string) {
  const t = title.toLowerCase();
  return t.includes("сонгон") || t.includes("term") || t.includes("optional");
}

function getExamColors(exam: Exam) {
  const opt = isOptionalExam(exam.title);
  return opt
    ? { border: "#f97316", icon: "#f97316", bg: "#fff7ed" }
    : { border: "#2563eb", icon: "#2563eb", bg: "#eff6ff" };
}

function getExamCell(
  exam: Exam,
  weekDays: Date[],
): { dayIndex: number; hour: number } | null {
  if (!exam.scheduledAt) return null;
  const date = new Date(exam.scheduledAt);
  const dayIndex = weekDays.findIndex(
    (d) => d.toDateString() === date.toDateString(),
  );
  if (dayIndex === -1) return null;
  const hour = date.getHours();
  if (!HOURS.includes(hour)) return null;
  return { dayIndex, hour };
}

type Props = {
  exams: Exam[];
  scheduleTitle: string;
  setScheduleTitle: (v: string) => void;
  scheduleDate: string;
  setScheduleDate: (v: string) => void;
  durationMinutes: number;
  setDurationMinutes: (v: number) => void;
  onSchedule: () => void;
};

export default function ScheduleCalendarView({
  exams,
  scheduleTitle,
  setScheduleTitle,
  scheduleDate,
  setScheduleDate,
  durationMinutes,
  setDurationMinutes,
  onSchedule,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const weekDays = getWeekDays(new Date());
  const scheduledExams = exams.filter((e) => e.scheduledAt);

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-slate-900">
            Шалгалтын хуваарь
          </h2>
          <div className="mt-1.5 flex items-center gap-5">
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />
              Заавал судлах
            </span>
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f97316]" />
              Сонгон судлах
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-2xl bg-[#f97316] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(249,115,22,0.55)] transition hover:bg-[#ea6c0a]"
        >
          <span className="text-base leading-none">+</span>
          Хуваарь нэмэх
        </button>
      </div>

      {/* Calendar */}
      <div className="overflow-x-auto rounded-2xl border border-[#dce5ef] bg-white">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `80px repeat(${DAYS_COUNT}, minmax(150px, 1fr))`,
          }}
        >
          {/* Corner + day headers */}
          <div className="border-b border-[#dce5ef]" />
          {weekDays.map((d, i) => (
            <div
              key={i}
              className="border-b border-l border-[#dce5ef] py-3 text-center text-sm font-medium text-slate-600"
            >
              {d.getMonth() + 1} сарын {d.getDate()}
            </div>
          ))}

          {/* Time rows */}
          {HOURS.map((hour) => (
            <Fragment key={hour}>
              <div className="border-b border-[#dce5ef] px-3 py-4 text-right text-[13px] text-slate-400">
                {String(hour).padStart(2, "0")} цаг
              </div>
              {weekDays.map((_, dayIndex) => {
                const exam = scheduledExams.find((e) => {
                  const cell = getExamCell(e, weekDays);
                  return cell?.dayIndex === dayIndex && cell?.hour === hour;
                });
                const colors = exam ? getExamColors(exam) : null;
                return (
                  <div
                    key={dayIndex}
                    className="border-b border-l border-[#dce5ef] p-2"
                    style={{ minHeight: 68 }}
                  >
                    {exam && colors && (
                      <div
                        className="flex items-center gap-2 rounded-xl border border-[#e8eef6] px-3 py-2.5 text-sm font-medium text-slate-800"
                        style={{
                          background: colors.bg,
                          borderTopColor: colors.border,
                          borderTopWidth: 2.5,
                        }}
                      >
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                          style={{ borderColor: colors.icon }}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: colors.icon }}
                          />
                        </span>
                        <span className="truncate text-[13px]">
                          {exam.title}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Add schedule modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForm(false);
          }}
        >
          <div className="w-full max-w-md overflow-y-auto" style={{ maxHeight: "90vh" }}>
            <ExamScheduleCard
              scheduleTitle={scheduleTitle}
              setScheduleTitle={setScheduleTitle}
              scheduleDate={scheduleDate}
              setScheduleDate={setScheduleDate}
              durationMinutes={durationMinutes}
              setDurationMinutes={setDurationMinutes}
              roomCode={null}
              onCopyCode={() => undefined}
              onSchedule={() => {
                onSchedule();
                setShowForm(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
