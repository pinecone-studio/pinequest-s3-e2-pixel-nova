"use client";

import { useState } from "react";
import type { Exam } from "../types";
import ExamScheduleCard from "./ExamScheduleCard";

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
const TIME_COLUMN_WIDTH = 80;
const DAY_COLUMN_WIDTH = 150;
const VISIBLE_DAY_COUNT = 5;

function getRangeDays(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
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
  selectedScheduleExamId: string;
  setSelectedScheduleExamId: (v: string) => void;
  scheduleDate: string;
  setScheduleDate: (v: string) => void;
  scheduleExamType: string;
  setScheduleExamType: (v: string) => void;
  scheduleClassName: string;
  setScheduleClassName: (v: string) => void;
  scheduleGroupName: string;
  setScheduleGroupName: (v: string) => void;
  scheduleSubjectName: string;
  setScheduleSubjectName: (v: string) => void;
  scheduleDescription: string;
  setScheduleDescription: (v: string) => void;
  durationMinutes: number;
  setDurationMinutes: (v: number) => void;
  onSchedule: () => void;
};

export default function ScheduleCalendarView({
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
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const minDate = new Date();
  minDate.setHours(0, 0, 0, 0);
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 1);
  maxDate.setHours(23, 59, 59, 999);
  const calendarDays = getRangeDays(minDate, maxDate);
  const visibleDays = Math.min(calendarDays.length, VISIBLE_DAY_COUNT);
  const selectedDate = scheduleDate ? new Date(scheduleDate) : null;
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
      <div className="mx-auto w-fit max-w-full rounded-2xl border border-[#dce5ef] bg-white">
        <div className="flex">
          <div
            className="shrink-0 border-r border-[#dce5ef] bg-white"
            style={{ width: `${TIME_COLUMN_WIDTH}px` }}
          >
            <div
              className="flex items-center justify-center border-b border-[#dce5ef] text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400"
              style={{ height: "49px" }}
            >
              Цаг
            </div>
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="flex items-center justify-center border-b border-[#dce5ef] bg-white text-[13px] text-slate-400 last:border-b-0"
              >
                {String(hour).padStart(2, "0")} цаг
              </div>
            ))}
          </div>

          <div
            className="overflow-x-auto"
            style={{ width: `${visibleDays * DAY_COLUMN_WIDTH}px` }}
          >
            <div
              style={{
                minWidth: `${calendarDays.length * DAY_COLUMN_WIDTH}px`,
              }}
            >
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${calendarDays.length}, minmax(${DAY_COLUMN_WIDTH}px, 1fr))`,
                }}
              >
                {calendarDays.map((d, i) => {
                  const isSelected =
                    selectedDate &&
                    d.toDateString() === selectedDate.toDateString();
                  return (
                    <div
                      key={i}
                      className={`border-b border-l border-[#dce5ef] py-3 text-center text-sm font-medium ${
                        isSelected
                          ? "bg-[#eef2ff] text-slate-900"
                          : "text-slate-600"
                      }`}
                    >
                      {d.getMonth() + 1} сарын {d.getDate()}
                    </div>
                  );
                })}
              </div>

              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${calendarDays.length}, minmax(${DAY_COLUMN_WIDTH}px, 1fr))`,
                }}
              >
                {calendarDays.map((_, dayIndex) => (
                  <div key={dayIndex} className="border-l border-[#dce5ef]">
                    {HOURS.map((hour) => {
                      const exam = scheduledExams.find((e) => {
                        const cell = getExamCell(e, calendarDays);
                        return (
                          cell?.dayIndex === dayIndex && cell?.hour === hour
                        );
                      });
                      const colors = exam ? getExamColors(exam) : null;

                      return (
                        <div
                          key={`${dayIndex}-${hour}`}
                          className="border-b border-[#dce5ef] p-2"
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
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add schedule modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/22 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForm(false);
          }}
        >
          <div
            className="w-full max-w-[32rem]"
          >
            <ExamScheduleCard
              exams={exams}
              selectedScheduleExamId={selectedScheduleExamId}
              setSelectedScheduleExamId={setSelectedScheduleExamId}
              scheduleDate={scheduleDate}
              setScheduleDate={setScheduleDate}
              scheduleExamType={scheduleExamType}
              setScheduleExamType={setScheduleExamType}
              scheduleClassName={scheduleClassName}
              setScheduleClassName={setScheduleClassName}
              scheduleGroupName={scheduleGroupName}
              setScheduleGroupName={setScheduleGroupName}
              scheduleSubjectName={scheduleSubjectName}
              setScheduleSubjectName={setScheduleSubjectName}
              scheduleDescription={scheduleDescription}
              setScheduleDescription={setScheduleDescription}
              durationMinutes={durationMinutes}
              setDurationMinutes={setDurationMinutes}
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
