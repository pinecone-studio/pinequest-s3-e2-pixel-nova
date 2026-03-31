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
import { sectionTitleClass } from "../styles";
import { LegendDot, ScheduleCard, ScheduleListCard } from "./TeacherScheduleCards";
import TeacherScheduleDetailPanel from "./TeacherScheduleDetailPanel";
import type { CopyCodeHandler } from "./RoomCodeCopyButton";
import {
  HOURS,
  TIME_COLUMN_WIDTH,
  DAY_COLUMN_WIDTH,
  VISIBLE_DAY_COUNT,
  buildScheduleData,
  formatDateValue,
  formatDayLabel,
  formatSectionLabel,
  formatTimeValue,
} from "./teacher-schedule-helpers";

const ACTIVE_MONITOR_POLL_MS = 5000;

type TeacherStudentsTabProps = {
  exams: Exam[];
  loading?: boolean;
  onAddSchedule: () => void;
  currentUserId?: string | null;
  onCopyCode?: CopyCodeHandler;
};

type ViewMode = "calendar" | "cards";

export default function TeacherStudentsTab({
  exams,
  loading = false,
  onAddSchedule,
  currentUserId,
  onCopyCode,
}: TeacherStudentsTabProps) {
  const { days, items } = buildScheduleData(exams);
  const scrollHostRef = useRef<HTMLDivElement>(null);
  const [dayColumnWidth, setDayColumnWidth] = useState(DAY_COLUMN_WIDTH);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [roster, setRoster] = useState<ExamRosterDetail | null>(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [liveAttendance, setLiveAttendance] = useState<ExamAttendanceStats | null>(null);
  const [liveStreamFailed, setLiveStreamFailed] = useState(false);
  const selectedExam = useMemo(
    () => exams.find((exam) => exam.id === selectedExamId) ?? null,
    [exams, selectedExamId],
  );
  const isActiveSelectedExam = selectedExam?.status === "active";
  const shouldUseLiveStream = Boolean(selectedExamId && isActiveSelectedExam && !liveStreamFailed);
  const shouldPollSelectedExam = Boolean(selectedExamId && isActiveSelectedExam && liveStreamFailed);
  const attendance = useExamAttendanceStats(selectedExamId, shouldPollSelectedExam);
  const effectiveAttendance = liveAttendance ?? attendance.stats;

  useEffect(() => {
    setLiveStreamFailed(false);
    setLiveAttendance(null);
  }, [selectedExamId]);

  useEffect(() => {
    const node = scrollHostRef.current;
    if (!node) return;
    const updateWidth = () => {
      const nextWidth = node.getBoundingClientRect().width;
      if (nextWidth) setDayColumnWidth(nextWidth / VISIBLE_DAY_COUNT);
    };
    updateWidth();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

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
          items: items.filter((item) => item.dayIndex === dayIndex),
        }))
        .filter((group) => group.items.length > 0),
    [days, items],
  );

  if (selectedExam) {
    return (
      <TeacherScheduleDetailPanel
        exam={selectedExam}
        roster={roster}
        rosterLoading={rosterLoading}
        attendanceJoined={effectiveAttendance?.joined ?? 0}
        attendanceSubmitted={effectiveAttendance?.submitted ?? 0}
        onBack={() => setSelectedExamId(null)}
        onCopyCode={onCopyCode}
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-5 rounded-[28px] border border-[#e7edf5] bg-white/80 px-6 py-5 shadow-[0_18px_34px_-30px_rgba(15,23,42,0.16)] backdrop-blur">
        <div>
          <h2 className={`${sectionTitleClass} text-[40px] leading-[0.95] tracking-[-0.04em]`}>Шалгалтын хуваарь</h2>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-[15px] text-slate-500">
            <div className="flex items-center gap-2"><LegendDot category="required" /><span>Заавал судлах</span></div>
            <div className="flex items-center gap-2"><LegendDot category="elective" /><span>Сонгон судлал</span></div>
          </div>
        </div>

        <div className="ml-auto flex flex-col items-end gap-2.5">
          <button
            className="inline-flex min-w-[196px] items-center justify-center gap-2 rounded-[18px] bg-[#355cde] px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_22px_40px_-28px_rgba(53,92,222,0.95)] transition hover:bg-[#2d52cf]"
            onClick={onAddSchedule}
            type="button"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
            Хуваарь нэмэх
          </button>

          <div className="inline-flex rounded-[18px] bg-white p-1.5 shadow-[0_16px_30px_-24px_rgba(251,146,60,0.7)]">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              aria-label="Card view"
              className={`grid size-11 place-items-center rounded-[14px] transition ${viewMode === "cards" ? "bg-[#ff9b4a] text-white shadow-[0_14px_24px_-18px_rgba(255,155,74,0.95)]" : "text-slate-700 hover:bg-white/60"}`}
            ><Layers className="h-5 w-5" /></button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              aria-label="Calendar view"
              className={`grid size-11 place-items-center rounded-[14px] transition ${viewMode === "calendar" ? "bg-[#ff9b4a] text-white shadow-[0_12px_24px_-20px_rgba(15,23,42,0.25)]" : "text-slate-700 hover:bg-white/60"}`}
            ><CalendarDays className="size-5" /></button>
          </div>
        </div>
      </div>

      {viewMode === "cards" ? (
        <div className="space-y-7">
          {groupedItems.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-[#dce5ef] bg-white px-6 py-16 text-center text-sm text-slate-400">
              {loading ? "Хуваарь ачаалж байна..." : "Хуваарьласан шалгалт алга."}
            </div>
          ) : (
            groupedItems.map((group) => (
              <div key={group.label} className="space-y-4">
                <h3 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-900">{group.label}</h3>
                <div className="grid gap-5 xl:grid-cols-3">
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
        <div className="w-full rounded-[34px] border border-[#dce5ef] bg-white p-5 shadow-[0_24px_48px_-36px_rgba(15,23,42,0.2)]">
          <div className="overflow-hidden rounded-[28px] bg-[#f8fbff]">
            <div className="flex">
              <div className="shrink-0 border-r border-[#dce5ef] bg-white/70" style={{ width: `${TIME_COLUMN_WIDTH}px` }}>
                <div className="flex items-center justify-center border-b border-[#dce5ef] text-xs font-medium uppercase tracking-[0.12em] text-slate-400" style={{ height: "61px" }} />
                {HOURS.map((hour) => <div key={hour} className="flex items-center justify-center border-b border-[#dce5ef] text-sm text-slate-500 last:border-b-0" style={{ height: "76px" }}>{hour.toString().padStart(2, "0")} цаг</div>)}
              </div>

              <div ref={scrollHostRef} className="min-w-0 flex-1 overflow-x-auto">
                <div style={{ minWidth: `${days.length * dayColumnWidth}px` }}>
                  <div className="grid border-b border-[#dce5ef] bg-white/70" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(${dayColumnWidth}px, 1fr))` }}>
                    {days.map((day, index) => <div key={`${day.toISOString()}-${index}`} className="border-r border-[#dce5ef] px-4 py-4 text-center text-lg font-semibold text-foreground last:border-r-0">{formatDayLabel(day)}</div>)}
                  </div>

                  <div className="relative">
                    <div className="grid" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(${dayColumnWidth}px, 1fr))` }}>
                      {Array.from({ length: days.length }, (_, dayIndex) => (
                        <div key={`column-${dayIndex}`} className="border-r border-[#dce5ef] last:border-r-0">
                          {HOURS.map((hour, rowIndex) => <div key={`${dayIndex}-${hour}`} style={{ height: "76px", opacity: rowIndex === HOURS.length - 1 ? 0.7 : 1 }} />)}
                        </div>
                      ))}
                    </div>

                    {!items.length && !loading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-2xl border border-dashed border-[#dce5ef] bg-white/80 px-5 py-3 text-sm text-slate-500 shadow-sm">Шалгалт алга</div>
                      </div>
                    )}
                    {items.map((item) => <ScheduleCard key={item.id} item={item} daysCount={days.length} onOpen={setSelectedExamId} />)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
