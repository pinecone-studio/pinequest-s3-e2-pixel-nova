"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Layers } from "lucide-react";
import {
  fetchTeacherExamRoster,
  openTeacherExamLiveStream,
  type TeacherExamLiveUpdate,
} from "../hooks/teacher-api";
import { useExamAttendanceStats } from "../hooks/useExamAttendanceStats";
import type { Exam, ExamAttendanceStats, ExamRosterDetail } from "../types";
import { LegendDot, ScheduleCard, ScheduleListCard } from "./TeacherScheduleCards";
import type { CopyCodeHandler } from "./RoomCodeCopyButton";
import TeacherScheduleDetailPanel from "./TeacherScheduleDetailPanel";
import {
  HOURS,
  DAY_COLUMN_WIDTH,
  ROW_HEIGHT,
  buildScheduleData,
  formatDateValue,
  formatDayLabel,
  formatSectionLabel,
  formatTimeValue,
} from "./teacher-schedule-helpers";

const ACTIVE_MONITOR_POLL_MS = 5000;
const TIME_COLUMN_WIDTH = 76;

function isLiveMonitoringExam(exam: Exam | null) {
  if (!exam) return false;
  if (exam.status === "active" || exam.status === "in_progress") return true;
  if (exam.finishedAt || exam.status === "finished" || !exam.scheduledAt) return false;

  const startTime = new Date(exam.scheduledAt).getTime();
  if (Number.isNaN(startTime)) return false;

  const endTime = startTime + (exam.duration ?? 45) * 60_000;
  const now = Date.now();
  return startTime <= now && now < endTime;
}

type TeacherStudentsTabProps = {
  exams: Exam[];
  loading?: boolean;
  onAddSchedule: () => void;
  currentUserId?: string | null;
  onCopyCode?: CopyCodeHandler;
};

type ViewMode = "calendar" | "cards";
const VISIBLE_HOUR_COUNT = 7;
const CALENDAR_VIEWPORT_OFFSET = 64;

export default function TeacherStudentsTab({
  exams,
  loading = false,
  onAddSchedule,
  currentUserId,
  onCopyCode,
}: TeacherStudentsTabProps) {
  const { days, items } = buildScheduleData(exams);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [roster, setRoster] = useState<ExamRosterDetail | null>(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [liveAttendance, setLiveAttendance] = useState<ExamAttendanceStats | null>(null);
  const [liveStreamFailed, setLiveStreamFailed] = useState(false);
  const calendarScrollRef = useRef<HTMLDivElement>(null);

  const selectedExam = useMemo(
    () => exams.find((exam) => exam.id === selectedExamId) ?? null,
    [exams, selectedExamId],
  );
  const isActiveSelectedExam = isLiveMonitoringExam(selectedExam);
  const shouldUseLiveStream = Boolean(selectedExamId && isActiveSelectedExam && !liveStreamFailed);
  const shouldPollSelectedExam = Boolean(selectedExamId && isActiveSelectedExam && liveStreamFailed);
  const attendance = useExamAttendanceStats(selectedExamId, shouldPollSelectedExam);
  const effectiveAttendance = liveAttendance ?? attendance.stats;

  useEffect(() => {
    setLiveStreamFailed(false);
    setLiveAttendance(null);
  }, [selectedExamId]);

  useEffect(() => {
    if (viewMode !== "calendar") return;

    const viewport = calendarScrollRef.current;
    if (!viewport) return;

    viewport.scrollTop = 0;
  }, [days.length, items.length, viewMode]);

  useEffect(() => {
    if (!selectedExamId) {
      setRoster(null);
      setRosterLoading(false);
      setLiveAttendance(null);
      return;
    }

    let active = true;
    setRosterLoading(true);

    if (shouldUseLiveStream) {
      const stopStreaming = openTeacherExamLiveStream(
        selectedExamId,
        {
          onMessage: (payload: TeacherExamLiveUpdate) => {
            if (!active) return;
            setRoster(payload.roster);
            setLiveAttendance(payload.stats);
            setRosterLoading(false);
          },
          onError: () => {
            if (!active) return;
            setLiveStreamFailed(true);
            setRosterLoading(false);
          },
        },
        currentUserId ?? undefined,
      );

      return () => {
        active = false;
        stopStreaming();
      };
    }

    const loadRoster = async () => {
      try {
        const nextRoster = await fetchTeacherExamRoster(
          selectedExamId,
          currentUserId ?? undefined,
        );
        if (active) setRoster(nextRoster);
      } catch {
        if (active) setRoster(null);
      } finally {
        if (active) setRosterLoading(false);
      }
    };

    void loadRoster();
    if (!shouldPollSelectedExam) {
      return () => {
        active = false;
      };
    }

    const timer = window.setInterval(() => {
      void loadRoster();
    }, ACTIVE_MONITOR_POLL_MS);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [currentUserId, selectedExamId, shouldPollSelectedExam, shouldUseLiveStream]);

  const groupedItems = useMemo(
    () =>
      days
        .map((day, dayIndex) => ({
          label: formatSectionLabel(day),
          items: items
            .filter((item) => item.dayIndex === dayIndex)
            .sort(
              (left, right) =>
                right.scheduledDate.getTime() - left.scheduledDate.getTime(),
            ),
        }))
        .filter((group) => group.items.length > 0)
        .reverse(),
    [days, items],
  );

  const calendarHeight = HOURS.length * ROW_HEIGHT;
  const calendarViewportHeight =
    VISIBLE_HOUR_COUNT * ROW_HEIGHT + CALENDAR_VIEWPORT_OFFSET;
  const scheduleMinWidth = TIME_COLUMN_WIDTH + Math.max(days.length, 5) * DAY_COLUMN_WIDTH;

  if (selectedExam) {
    return (
      <div className="mx-auto w-full max-w-[1260px] px-4 pb-8 pt-8 md:px-6 xl:px-0">
        <TeacherScheduleDetailPanel
          exam={selectedExam}
          roster={roster}
          rosterLoading={rosterLoading}
          attendanceJoined={effectiveAttendance?.joined ?? 0}
          attendanceSubmitted={effectiveAttendance?.submitted ?? 0}
          onBack={() => setSelectedExamId(null)}
          onCopyCode={onCopyCode}
        />
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[1260px] px-4 pb-8 pt-8 md:px-6 xl:px-0">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div>
          <h2 className="text-[24px] font-semibold leading-[33px] tracking-[-0.02em] text-black">
            Шалгалтын хуваарь
          </h2>
          <div className="mt-3 flex min-h-6 flex-wrap items-center gap-5 text-[16px] leading-6 text-[#212121]">
            <div className="flex items-center gap-[10px]">
              <LegendDot category="required" />
              <span>Заавал судлах</span>
            </div>
            <div className="flex items-center gap-[10px]">
              <LegendDot category="elective" />
              <span>Сонгон судлал</span>
            </div>
          </div>
        </div>

        <div className="ml-auto flex flex-col items-end gap-3">
          <button
            className="inline-flex h-[48px] min-w-[184px] items-center justify-center gap-[10px] overflow-hidden rounded-[14px] bg-[linear-gradient(180deg,#3f78ff_0%,#2f66ef_100%)] px-5 text-[18px] font-semibold leading-6 text-white shadow-[0_14px_24px_-22px_rgba(37,99,235,0.8)] transition hover:brightness-[1.03]"
            onClick={onAddSchedule}
            type="button"
          >
            <svg
              className="size-[18px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Хуваарь нэмэх
          </button>

          <div className="inline-flex items-center gap-1 rounded-[16px] border border-[#d7e3f4] bg-[#eef4ff] p-[7px] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_14px_26px_-24px_rgba(59,130,246,0.5)]">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              aria-label="Card view"
              className={`grid h-10 w-10 place-items-center rounded-[10px] transition ${
                viewMode === "cards"
                  ? "bg-[linear-gradient(180deg,#4f8dff_0%,#2f66ef_100%)] text-white shadow-[0_14px_24px_-18px_rgba(37,99,235,0.9)]"
                  : "bg-transparent text-[#2f66ef] hover:bg-white/75 hover:text-[#1d4ed8]"
              }`}
            >
              <Layers className="size-[18px]" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              aria-label="Calendar view"
              className={`grid h-10 w-10 place-items-center rounded-[10px] transition ${
                viewMode === "calendar"
                  ? "bg-[linear-gradient(180deg,#4f8dff_0%,#2f66ef_100%)] text-white shadow-[0_14px_24px_-18px_rgba(37,99,235,0.9)]"
                  : "bg-transparent text-[#2f66ef] hover:bg-white/75 hover:text-[#1d4ed8]"
              }`}
            >
              <CalendarDays className="size-[18px]" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {viewMode === "cards" ? (
          <div className="space-y-7">
            {groupedItems.length === 0 ? (
              <div className="rounded-[32px] border border-dashed border-[#dce5ef] bg-white px-6 py-16 text-center text-sm text-slate-400">
                {loading ? "Хуваарь ачаалж байна..." : "Хуваарьласан шалгалт алга."}
              </div>
            ) : (
              groupedItems.map((group) => (
                <div key={group.label} className="space-y-5">
                  <h3 className="text-[18px] font-medium leading-[27px] tracking-[-0.02em] text-[#7e7e7e]">
                    {group.label}
                  </h3>
                  <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
                    {group.items.map((item) => (
                      <ScheduleListCard
                        key={item.id}
                        item={item}
                        onOpen={setSelectedExamId}
                        onCopyCode={onCopyCode}
                        formatDateValue={formatDateValue}
                        formatTimeValue={formatTimeValue}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[1272px] rounded-[32px] border border-[#eceef4] bg-white p-[18px] shadow-[0_16px_36px_-34px_rgba(15,23,42,0.18)]">
            <div
              ref={calendarScrollRef}
              className="scrollbar-soft overflow-auto rounded-[28px] border border-[#edf1f7] bg-white"
              style={{ height: `${calendarViewportHeight}px` }}
            >
              <div className="mx-auto p-[28px]" style={{ minWidth: `${scheduleMinWidth + 56}px` }}>
                <div
                  className="grid items-center gap-0 pb-4"
                  style={{
                    gridTemplateColumns: `${TIME_COLUMN_WIDTH}px repeat(${days.length}, ${DAY_COLUMN_WIDTH}px)`,
                  }}
                >
                  <div />
                  {days.map((day, index) => (
                    <div
                      key={`${day.toISOString()}-${index}`}
                      className="relative text-center text-[16px] font-semibold text-[#2e2e2e]"
                    >
                      {index > 0 ? (
                        <span className="absolute left-0 top-1/2 h-10 w-px -translate-y-1/2 bg-[#e9edf5]" />
                      ) : null}
                      {formatDayLabel(day)}
                    </div>
                  ))}
                </div>

                <div className="flex">
                  <div className="sticky left-0 z-10 shrink-0 bg-white">
                    <div
                      className="relative"
                      style={{ width: `${TIME_COLUMN_WIDTH}px`, height: `${calendarHeight}px` }}
                    >
                      {HOURS.map((hour, index) => (
                        <div
                          key={hour}
                          className="absolute left-0 right-0 text-[16px] leading-10 text-[#9d9d9d]"
                          style={{ top: `${index * ROW_HEIGHT}px` }}
                        >
                          {hour.toString().padStart(2, "0")} цаг
                        </div>
                      ))}
                      <span className="absolute right-0 top-0 h-full w-px bg-[#e9edf5]" />
                    </div>
                  </div>

                  <div
                    className="relative"
                    style={{
                      width: `${days.length * DAY_COLUMN_WIDTH}px`,
                      height: `${calendarHeight}px`,
                    }}
                  >
                    {days.slice(1).map((day, index) => (
                      <span
                        key={`${day.toISOString()}-divider`}
                        className="absolute top-0 h-full w-px bg-[#e9edf5]"
                        style={{ left: `${(index + 1) * DAY_COLUMN_WIDTH}px` }}
                      />
                    ))}

                    {items.map((item) => (
                      <ScheduleCard
                        key={item.id}
                        item={item}
                        daysCount={days.length}
                        onOpen={setSelectedExamId}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {!items.length && !loading && (
              <div className="mt-4 flex items-center justify-center">
                <div className="rounded-2xl border border-dashed border-[#dce5ef] bg-white/80 px-5 py-3 text-sm text-slate-500 shadow-sm">
                  Шалгалт алга
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
