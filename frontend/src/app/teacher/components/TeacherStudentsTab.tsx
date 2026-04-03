"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchTeacherExamRoster,
  openTeacherExamLiveStream,
  type TeacherExamLiveUpdate,
} from "../hooks/teacher-api";
import { useExamAttendanceStats } from "../hooks/useExamAttendanceStats";
import type { Exam, ExamAttendanceStats, ExamRosterDetail } from "../types";
import { LegendDot, ScheduleCard, ScheduleListCard } from "./TeacherScheduleCards";
import type { CopyCodeHandler } from "./RoomCodeCopyButton";
import TeacherSelect from "./TeacherSelect";
import TeacherScheduleDetailPanel from "./TeacherScheduleDetailPanel";
import TeacherEmptyState from "./TeacherEmptyState";
import {
  HOURS,
  DAY_COLUMN_WIDTH,
  ROW_HEIGHT,
  buildScheduleData,
  formatDateValue,
  formatDayLabel,
  getExamScheduleLifecycle,
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
type ScheduleFilter = "upcoming" | "finished";
const VISIBLE_HOUR_COUNT = 7;
const CALENDAR_VIEWPORT_OFFSET = 64;
const VIEW_LOADING_MIN_MS = 1500;
const SHOULD_SKIP_VIEW_LOADING =
  process.env.NODE_ENV === "test" ||
  Boolean(process.env.JEST_WORKER_ID);

function ScheduleCardsSkeleton() {
  return (
    <div className="space-y-7">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="space-y-5">
          <Skeleton className="h-6 w-36 rounded-full border-0 bg-[#e5ebf5]" />
          <div className="grid gap-5  lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: index === 0 ? 1 : 3 }).map((__, cardIndex) => (
              <ScheduleCardSkeleton key={`${index}-${cardIndex}`} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ScheduleCardSkeleton() {
  return (
    <div className="relative w-[412px]  h-[340px] rounded-[24px] border border-[#dfdfdf] bg-white px-6 pb-5 pt-6">
      <div className="relative flex h-full flex-col">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton className="h-7 w-40 rounded-full border-0 bg-[#e5ebf5]" />
              <Skeleton className="h-7 w-28 rounded-full border-0 bg-[#e5ebf5]" />
              <Skeleton className="h-4 w-24 rounded-full border-0 bg-[#e5ebf5]" />
            </div>
            <div className="mt-1 flex shrink-0 flex-col items-end gap-2">
              <Skeleton className="h-7 w-[88px] rounded-full border-0 bg-[#e5ebf5]" />
              <Skeleton className="h-6 w-16 rounded-full border-0 bg-[#e5ebf5]" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-5 w-12 rounded-full border-0 bg-[#e5ebf5]" />
              <Skeleton className="h-5 w-24 rounded-full border-0 bg-[#e5ebf5]" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-5 w-20 rounded-full border-0 bg-[#e5ebf5]" />
              <Skeleton className="h-5 w-14 rounded-full border-0 bg-[#e5ebf5]" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-5 w-32 rounded-full border-0 bg-[#e5ebf5]" />
              <Skeleton className="h-5 w-[72px] rounded-full border-0 bg-[#e5ebf5]" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-5 w-24 rounded-full border-0 bg-[#e5ebf5]" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-full border-0 bg-[#e5ebf5]" />
                <Skeleton className="size-5 rounded-md border-0 bg-[#e5ebf5]" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-auto border-t border-[#dfe4ff] pt-4">
          <Skeleton className="ml-auto h-5 w-28 rounded-full border-0 bg-[#e5ebf5]" />
        </div>
      </div>
    </div>
  );
}

function ScheduleCalendarSkeleton({
  dayCount,
}: {
  dayCount: number;
}) {
  const columnCount = Math.min(Math.max(dayCount, 5), 7);
  const rowCount = 7;
  const eventPlaceholders = [
    { column: 0, row: 0, height: 64 },
    { column: 2, row: 2, height: 86 },
    { column: 4, row: 1, height: 72 },
    { column: Math.max(columnCount - 2, 1), row: 4, height: 78 },
  ].filter((item) => item.column < columnCount);

  return (
    <div className="mx-auto w-full max-w-[1272px] rounded-[32px] border border-[#eceef4] bg-white p-[18px] shadow-[0_16px_36px_-34px_rgba(15,23,42,0.18)]">
      <div className="overflow-hidden rounded-[28px] border border-[#edf1f7] bg-white">
        <div className="mx-auto p-[28px]">
          <div
            className="grid items-center gap-0 pb-4"
            style={{
              gridTemplateColumns: `76px repeat(${columnCount}, minmax(0, 1fr))`,
            }}
          >
            <div />
            {Array.from({ length: columnCount }).map((_, index) => (
              <div key={index} className="px-3 text-center">
                <Skeleton className="mx-auto h-5 w-16 rounded-full border-0 bg-[#e5ebf5]" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[76px_1fr]">
            <div className="space-y-5 pr-3">
              {Array.from({ length: rowCount }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-8 w-11 rounded-full border-0 bg-[#e5ebf5]"
                />
              ))}
            </div>

            <div className="rounded-[24px] border border-[#edf1f7] bg-[#fcfdff] p-4">
              <div
                className="relative overflow-hidden rounded-[20px] border border-[#eef2f7] bg-white"
                style={{ height: `${rowCount * 72}px` }}
              >
                {Array.from({ length: columnCount - 1 }).map((_, index) => (
                  <span
                    key={`column-${index}`}
                    className="absolute top-0 h-full w-px bg-[#edf1f7]"
                    style={{ left: `${((index + 1) / columnCount) * 100}%` }}
                  />
                ))}

                {Array.from({ length: rowCount - 1 }).map((_, index) => (
                  <span
                    key={`row-${index}`}
                    className="absolute left-0 w-full h-px bg-[#f3f5f9]"
                    style={{ top: `${(index + 1) * 72}px` }}
                  />
                ))}

                {eventPlaceholders.map((item, index) => (
                  <Skeleton
                    key={`event-${index}`}
                    className="absolute rounded-[18px] border-0 bg-[#e5ebf5]"
                    style={{
                      left: `calc(${(item.column / columnCount) * 100}% + 10px)`,
                      top: `${item.row * 72 + 10}px`,
                      width: `calc(${100 / columnCount}% - 20px)`,
                      height: `${item.height}px`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeacherStudentsTab({
  exams,
  loading = false,
  onAddSchedule,
  currentUserId,
  onCopyCode,
}: TeacherStudentsTabProps) {
  const [scheduleFilter, setScheduleFilter] = useState<ScheduleFilter>("upcoming");
  const filteredExams = useMemo(
    () =>
      exams.filter((exam) => {
        const lifecycle = getExamScheduleLifecycle(exam);
        if (!lifecycle) return false;
        return scheduleFilter === "finished"
          ? lifecycle === "finished"
          : lifecycle !== "finished";
      }),
    [exams, scheduleFilter],
  );
  const { days, items } = buildScheduleData(filteredExams);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [roster, setRoster] = useState<ExamRosterDetail | null>(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [liveAttendance, setLiveAttendance] = useState<ExamAttendanceStats | null>(null);
  const [liveStreamFailed, setLiveStreamFailed] = useState(false);
  const calendarScrollRef = useRef<HTMLDivElement>(null);
  const viewLoadingTimerRef = useRef<number | null>(null);
  const [viewLoadingMode, setViewLoadingMode] = useState<ViewMode | null>(null);

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
    return () => {
      if (viewLoadingTimerRef.current !== null) {
        window.clearTimeout(viewLoadingTimerRef.current);
      }
    };
  }, []);

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
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

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

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadRoster();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      active = false;
      window.clearInterval(timer);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
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
                scheduleFilter === "finished"
                  ? right.scheduledDate.getTime() - left.scheduledDate.getTime()
                  : left.scheduledDate.getTime() - right.scheduledDate.getTime(),
            ),
        }))
        .filter((group) => group.items.length > 0)
        .sort((left, right) => {
          const leftTime = left.items[0]?.scheduledDate.getTime() ?? 0;
          const rightTime = right.items[0]?.scheduledDate.getTime() ?? 0;
          return scheduleFilter === "finished" ? rightTime - leftTime : leftTime - rightTime;
        }),
    [days, items, scheduleFilter],
  );

  const calendarHeight = HOURS.length * ROW_HEIGHT;
  const calendarViewportHeight =
    VISIBLE_HOUR_COUNT * ROW_HEIGHT + CALENDAR_VIEWPORT_OFFSET;
  const scheduleMinWidth = TIME_COLUMN_WIDTH + Math.max(days.length, 5) * DAY_COLUMN_WIDTH;
  const isViewLoading = viewLoadingMode !== null;

  const handleViewModeChange = (nextMode: ViewMode) => {
    if (nextMode === viewMode) {
      return;
    }

    if (SHOULD_SKIP_VIEW_LOADING) {
      setViewMode(nextMode);
      setViewLoadingMode(null);
      return;
    }

    if (viewLoadingTimerRef.current !== null) {
      window.clearTimeout(viewLoadingTimerRef.current);
      viewLoadingTimerRef.current = null;
    }

    setViewMode(nextMode);
    setViewLoadingMode(nextMode);
    viewLoadingTimerRef.current = window.setTimeout(() => {
      setViewLoadingMode((current) => (current === nextMode ? null : current));
      viewLoadingTimerRef.current = null;
    }, VIEW_LOADING_MIN_MS);
  };

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
    <section className="mx-auto w-full max-w-318 px-4 pb-8 pt-8 md:px-6 xl:px-0">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div>
          <h2 className="text-[24px] font-semibold leading-8.25 tracking-[-0.02em] text-black">
            Шалгалтын хуваарь
          </h2>
          <div className="mt-3 flex min-h-6 flex-wrap items-center gap-5 text-[16px] leading-6 text-[#212121]">
            <div className="flex items-center gap-2.5">
              <LegendDot category="required" />
              <span>Заавал судлах</span>
            </div>
            <div className="flex items-center gap-2.5">
              <LegendDot category="elective" />
              <span>Сонгон судлал</span>
            </div>
          </div>
          {viewMode === "cards" ? (
            <div className="mt-6 w-113  ">
              <TeacherSelect
                options={[
                  { value: "upcoming", label: "Удахгүй болох шалгалтууд" },
                  { value: "finished", label: "Дууссан шалгалтууд" },
                ]}
                value={scheduleFilter}
                onChange={(event) =>
                  setScheduleFilter(event.target.value as ScheduleFilter)
                }
                className="w-113  rounded-[16px] border-[#d8dee8] py-0 text-[16px] font-medium text-[#20232d] shadow-[0_2px_10px_-8px_rgba(15,23,42,0.15)] focus:border-[#8aa7ff] focus:ring-2 focus:ring-[#dbe6ff]"
              />
            </div>
          ) : null}
        </div>

        <div className="ml-auto flex flex-col items-end gap-3">
          <button
            className="inline-flex h-[49px] w-[185px] items-center justify-center gap-[10px] overflow-hidden rounded-[14px] bg-[linear-gradient(180deg,#3f78ff_0%,#2f66ef_100%)] px-5 text-[18px] font-semibold leading-6 text-white shadow-[0_14px_24px_-22px_rgba(37,99,235,0.8)] transition hover:brightness-[1.03]"
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
            <h1 className="text-[15px]" >
            Хуваарь нэмэх
            </h1>
          </button>

          <div className="inline-flex items-center gap-1 rounded-[16px] border border-[#d7e3f4] bg-[#eef4ff] p-[7px] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_14px_26px_-24px_rgba(59,130,246,0.5)]">
            <button
              type="button"
              onClick={() => handleViewModeChange("cards")}
              aria-label="Card view"
              disabled={isViewLoading}
              className={`grid h-10 w-10 place-items-center rounded-[10px] transition ${
                viewMode === "cards"
                  ? "bg-[linear-gradient(180deg,#4f8dff_0%,#2f66ef_100%)] text-white shadow-[0_14px_24px_-18px_rgba(37,99,235,0.9)]"
                  : "bg-transparent text-[#2f66ef] hover:bg-white/75 hover:text-[#1d4ed8]"
              } ${isViewLoading ? "cursor-progress opacity-80" : ""}`}
            >
              <Layers className="size-4.5" />
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange("calendar")}
              aria-label="Calendar view"
              disabled={isViewLoading}
              className={`grid h-10 w-10 place-items-center rounded-[10px] transition ${
                viewMode === "calendar"
                  ? "bg-[linear-gradient(180deg,#4f8dff_0%,#2f66ef_100%)] text-white shadow-[0_14px_24px_-18px_rgba(37,99,235,0.9)]"
                  : "bg-transparent text-[#2f66ef] hover:bg-white/75 hover:text-[#1d4ed8]"
              } ${isViewLoading ? "cursor-progress opacity-80" : ""}`}
            >
              <CalendarDays className="size-4.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {isViewLoading ? (
          viewMode === "cards" ? (
            <ScheduleCardsSkeleton />
          ) : (
            <ScheduleCalendarSkeleton dayCount={days.length} />
          )
        ) : viewMode === "cards" ? (
          <div className="space-y-7">
            {groupedItems.length === 0 ? (
              <TeacherEmptyState
                icon={<CalendarDays className="size-5" />}
                title={loading ? "Хуваарь ачаалж байна" : "Хуваарь хоосон байна"}
                description={
                  loading
                    ? "Түр хүлээнэ үү."
                    : scheduleFilter === "finished"
                      ? "Дууссан шалгалт алга."
                      : "Удахгүй болох шалгалт алга."
                }
                actionLabel={!loading && scheduleFilter !== "finished" ? "Хуваарь нэмэх" : undefined}
                onAction={!loading && scheduleFilter !== "finished" ? onAddSchedule : undefined}
                className="px-6 py-14"
              />
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
                <TeacherEmptyState
                  icon={<CalendarDays className="size-5" />}
                  title="Шалгалт алга"
                  description="Энэ харагдац дээр харуулах шалгалт одоогоор алга."
                  actionLabel="Хуваарь нэмэх"
                  onAction={onAddSchedule}
                  className="w-full max-w-xl px-6 py-10"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
