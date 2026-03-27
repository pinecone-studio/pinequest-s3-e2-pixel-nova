"use client";

import { useEffect, useRef, useState } from "react";
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
  onAddSchedule: () => void;
};

type ScheduleCategory = "required" | "elective";

type ScheduleItem = {
  id: string;
  title: string;
  subtitle?: string;
  dayIndex: number;
  startMinutes: number;
  duration: number;
  category: ScheduleCategory;
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
  for (let cursor = new Date(baseDate); cursor <= endDate; cursor = addDays(cursor, 1)) {
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

export default function TeacherStudentsTab({
  exams,
  onAddSchedule,
}: TeacherStudentsTabProps) {
  const { days, items } = buildScheduleData(exams);
  const hasScheduledItems = items.length > 0;
  const daysCount = days.length;
  const scrollHostRef = useRef<HTMLDivElement>(null);
  const [dayColumnWidth, setDayColumnWidth] = useState(DAY_COLUMN_WIDTH);

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

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
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

        <button
          className="inline-flex items-center gap-2 justify-center rounded-2xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white transition"
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
      </div>

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
              >
                
              </div>
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
                              opacity: rowIndex === HOURS.length - 1 ? 0.7 : 1,
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
                      <ScheduleCard key={item.id} item={item} daysCount={daysCount} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
