"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronRight, Layers, LayoutGrid } from "lucide-react";
import type { Exam } from "../types";
import { sectionTitleClass } from "../styles";

const HOURS = [8, 9, 10, 11, 12, 13, 14];
const ROW_HEIGHT = 76;
const DAY_MS = 24 * 60 * 60 * 1000;
const TIME_COLUMN_WIDTH = 88;
const DAY_COLUMN_WIDTH = 170;
const VISIBLE_DAY_COUNT = 5;

type TeacherStudentsTabProps = {
  exams: Exam[];
  loading?: boolean;
  onAddSchedule: () => void;
};

type ScheduleCategory = "required" | "elective";
type ViewMode = "calendar" | "cards";

type ScheduleItem = {
  id: string;
  title: string;
  subtitle?: string;
  dayIndex: number;
  startMinutes: number;
  duration: number;
  category: ScheduleCategory;
  scheduledDate: Date;
  roomCode: string;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function formatDayLabel(date: Date) {
  return `${date.getMonth() + 1} сарын ${date.getDate()}`;
}

function formatSectionLabel(date: Date) {
  const today = startOfDay(new Date());
  const sameDay = startOfDay(date).getTime() === today.getTime();
  return `${date.getMonth() + 1} сарын ${date.getDate()}${sameDay ? " (Өнөөдөр)" : ""}`;
}

function formatDateValue(date: Date) {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

function formatTimeValue(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

function buildScheduleData(exams: Exam[]) {
  const scheduled = exams
    .filter((exam) => Boolean(exam.scheduledAt))
    .sort(
      (left, right) =>
        new Date(left.scheduledAt ?? "").getTime() -
        new Date(right.scheduledAt ?? "").getTime(),
    );

  const baseDate = startOfDay(new Date());
  const endDate = startOfDay(new Date(baseDate));
  endDate.setMonth(endDate.getMonth() + 1);

  const days: Date[] = [];
  for (
    let cursor = new Date(baseDate);
    cursor <= endDate;
    cursor = addDays(cursor, 1)
  ) {
    days.push(new Date(cursor));
  }

  const items = scheduled
    .map<ScheduleItem | null>((exam, index) => {
      if (!exam.scheduledAt) return null;

      const scheduledAt = new Date(exam.scheduledAt);
      const dayIndex = Math.round(
        (startOfDay(scheduledAt).getTime() - baseDate.getTime()) / DAY_MS,
      );

      if (dayIndex < 0 || dayIndex >= days.length) return null;

      return {
        id: exam.id,
        title: exam.title,
        subtitle: [exam.className, exam.groupName, exam.description]
          .filter(Boolean)
          .join(" · "),
        dayIndex,
        startMinutes:
          scheduledAt.getHours() * 60 +
          scheduledAt.getMinutes() -
          HOURS[0] * 60,
        duration: exam.duration ?? 45,
        category: index % 2 === 0 ? "required" : "elective",
        scheduledDate: scheduledAt,
        roomCode: exam.roomCode,
      };
    })
    .filter((item): item is ScheduleItem => Boolean(item));

  return { days, items };
}

function LegendDot({ category }: { category: ScheduleCategory }) {
  const tone =
    category === "required"
      ? "border-blue-500 text-blue-500"
      : "border-amber-400 text-amber-400";

  return (
    <span
      className={`inline-block h-3.5 w-3.5 rounded-full border-[3px] ${tone}`}
    />
  );
}

function ScheduleCard({
  item,
  daysCount,
}: {
  item: ScheduleItem;
  daysCount: number;
}) {
  const tone =
    item.category === "required"
      ? {
          border: "border-t-2 border-t-blue-500",
          dot: "required" as const,
        }
      : {
          border: "border-t-2 border-t-amber-400",
          dot: "elective" as const,
        };

  return (
    <div
      className={`absolute rounded-2xl bg-white px-3 py-3 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.25)] ${tone.border}`}
      style={{
        left: `calc(${item.dayIndex} * (100% / ${daysCount}) + 12px)`,
        width: `calc((100% / ${daysCount}) - 16px)`,
        top: `${Math.max(8, (item.startMinutes / 60) * ROW_HEIGHT + 8)}px`,
        height: `${Math.max((item.duration / 60) * ROW_HEIGHT - 10, 52)}px`,
      }}
    >
      <div className="flex h-full gap-2 text-foreground/85">
        <LegendDot category={tone.dot} />
        <div className="min-w-0">
          <div className="line-clamp-2 text-sm font-semibold">{item.title}</div>
          {item.subtitle && (
            <div className="mt-1 line-clamp-1 text-[11px] text-slate-500">
              {item.subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScheduleListCard({ item }: { item: ScheduleItem }) {
  const tagTone =
    item.category === "required"
      ? "bg-[#f1efff] text-[#4b63f6]"
      : "bg-[#fff0e7] text-[#ff9a45]";

  return (
    <div className="rounded-[28px] border border-[#efd7d7] bg-white px-7 py-8 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.22)]">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-[24px] font-semibold tracking-[-0.03em] text-slate-900">
          {item.title}
        </h3>
        <span
          className={`rounded-full px-4 py-2 text-[12px] font-semibold ${tagTone}`}
        >
          {item.category === "required" ? "Заавал судлах" : "Сонгон судлах"}
        </span>
      </div>

      <div className="mt-8 grid grid-cols-[auto_1fr] gap-x-8 gap-y-4 text-[16px]">
        <span className="text-[#b49494]">Өдөр:</span>
        <span className="justify-self-end text-slate-900">
          {formatDateValue(item.scheduledDate)}
        </span>

        <span className="text-[#b49494]">Эхлэх цаг:</span>
        <span className="justify-self-end text-slate-900">
          {formatTimeValue(item.scheduledDate)}
        </span>

        <span className="text-[#b49494]">Үргэлжлэх хугацаа:</span>
        <span className="justify-self-end text-slate-900">
          {item.duration} минут
        </span>

        <span className="text-[#b49494]">Өрөөний код:</span>
        <span className="justify-self-end text-slate-900">{item.roomCode}</span>
      </div>

      <div className="mt-8 border-t border-[#ead7d7] pt-5">
        <button
          type="button"
          className="ml-auto flex items-center gap-3 text-[15px] font-medium text-slate-800 transition hover:text-slate-950"
        >
          Дэлгэрэнгүй
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

export default function TeacherStudentsTab({
  exams,
  loading = false,
  onAddSchedule,
}: TeacherStudentsTabProps) {
  const { days, items } = buildScheduleData(exams);
  const hasScheduledItems = items.length > 0;
  const daysCount = days.length;
  const scrollHostRef = useRef<HTMLDivElement>(null);
  const [dayColumnWidth, setDayColumnWidth] = useState(DAY_COLUMN_WIDTH);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");

  useEffect(() => {
    const node = scrollHostRef.current;
    if (!node) return;

    const updateWidth = () => {
      const nextWidth = node.getBoundingClientRect().width;
      if (!nextWidth) return;
      setDayColumnWidth(nextWidth / VISIBLE_DAY_COUNT);
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

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

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h2 className={sectionTitleClass}>Шалгалтын хуваарь</h2>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <LegendDot category="required" />
              <span>Заавал судлах</span>
            </div>
            <div className="flex items-center gap-2">
              <LegendDot category="elective" />
              <span>Сонгон судлал</span>
            </div>
          </div>
        </div>

        <div className="ml-auto flex flex-col items-end gap-3">
          <button
            className="inline-flex min-w-[204px] items-center justify-center gap-2 rounded-[18px] bg-[#355cde] px-5 py-4 text-[15px] font-semibold text-white shadow-[0_22px_40px_-28px_rgba(53,92,222,0.95)] transition hover:bg-[#2d52cf]"
            onClick={onAddSchedule}
            type="button"
          >
            <svg
              className="h-4 w-4"
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

          <div className="inline-flex rounded-[18px] bg-white p-1.5 shadow-[0_16px_30px_-24px_rgba(251,146,60,0.7)]">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              aria-label="Card view"
              className={`grid size-11 place-items-center rounded-[14px] transition ${
                viewMode === "cards"
                  ? "bg-[#ff9b4a] text-white shadow-[0_14px_24px_-18px_rgba(255,155,74,0.95)]"
                  : "text-slate-700 hover:bg-white/60"
              }`}
            >
              <Layers className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              aria-label="Calendar view"
              className={`grid size-11 place-items-center rounded-[14px] transition ${
                viewMode === "calendar"
                  ? "bg-[#ff9b4a] text-white shadow-[0_12px_24px_-20px_rgba(15,23,42,0.25)]"
                  : "text-slate-700 hover:bg-white/60"
              }`}
            >
              <CalendarDays className="size-5" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === "cards" ? (
        <div className="space-y-7">
          {groupedItems.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-[#dce5ef] bg-white px-6 py-16 text-center text-sm text-slate-400">
              Хуваарьласан шалгалт алга.
            </div>
          ) : (
            groupedItems.map((group) => (
              <div key={group.label} className="space-y-4">
                <h3 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-900">
                  {group.label}
                </h3>
                <div className="grid gap-5 xl:grid-cols-3">
                  {group.items.map((item) => (
                    <ScheduleListCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="w-full rounded-[34px] border border-[#dce5ef] bg-white p-4 shadow-[0_24px_48px_-36px_rgba(15,23,42,0.2)]">
          <div className="overflow-hidden rounded-[28px] bg-[#f8fbff]">
            <div className="flex">
              <div
                className="shrink-0 border-r border-[#dce5ef] bg-white/70"
                style={{ width: `${TIME_COLUMN_WIDTH}px` }}
              >
                <div
                  className="flex items-center justify-center border-b border-[#dce5ef] text-xs font-medium uppercase tracking-[0.12em] text-slate-400"
                  style={{ height: "61px" }}
                ></div>
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="flex items-center justify-center border-b border-[#dce5ef] text-sm text-slate-500 last:border-b-0"
                    style={{ height: `${ROW_HEIGHT}px` }}
                  >
                    {hour.toString().padStart(2, "0")} цаг
                  </div>
                ))}
              </div>

              <div
                ref={scrollHostRef}
                className="min-w-0 flex-1 overflow-x-auto"
              >
                <div style={{ minWidth: `${daysCount * dayColumnWidth}px` }}>
                  <div
                    className="grid border-b border-[#dce5ef] bg-white/70"
                    style={{
                      gridTemplateColumns: `repeat(${daysCount}, minmax(${dayColumnWidth}px, 1fr))`,
                    }}
                  >
                    {days.map((day, index) => (
                      <div
                        key={`${day.toISOString()}-${index}`}
                        className="border-r border-[#dce5ef] px-4 py-4 text-center text-lg font-semibold text-foreground last:border-r-0"
                      >
                        {formatDayLabel(day)}
                      </div>
                    ))}
                  </div>

                  <div className="relative">
                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: `repeat(${daysCount}, minmax(${dayColumnWidth}px, 1fr))`,
                      }}
                    >
                      {Array.from({ length: daysCount }, (_, dayIndex) => (
                        <div
                          key={`column-${dayIndex}`}
                          className="border-r border-[#dce5ef] last:border-r-0"
                        >
                          {HOURS.map((hour, rowIndex) => (
                            <div
                              key={`${dayIndex}-${hour}`}
                              style={{
                                height: `${ROW_HEIGHT}px`,
                                opacity:
                                  rowIndex === HOURS.length - 1 ? 0.7 : 1,
                              }}
                            />
                          ))}
                        </div>
                      ))}
                    </div>

                    <div className="pointer-events-none absolute inset-0">
                      {!hasScheduledItems && (
                        <div className="flex h-full items-center justify-center">
                          <div className="rounded-2xl border border-dashed border-[#dce5ef] bg-white/80 px-5 py-3 text-sm text-slate-500 shadow-sm">
                            Шалгалт алга
                          </div>
                        </div>
                      )}
                      {items.map((item) => (
                        <ScheduleCard
                          key={item.id}
                          item={item}
                          daysCount={daysCount}
                        />
                      ))}
                    </div>
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
