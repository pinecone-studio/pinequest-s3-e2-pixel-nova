import type { Exam } from "../types";

const HOURS = [8, 9, 10, 11, 12, 13, 14];
const DAYS_TO_SHOW = 5;
const ROW_HEIGHT = 76;
const DAY_MS = 24 * 60 * 60 * 1000;

type TeacherStudentsTabProps = {
  exams: Exam[];
  onAddSchedule: () => void;
};

type ScheduleCategory = "required" | "elective";

type ScheduleItem = {
  id: string;
  title: string;
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

  const baseDate = scheduled[0]?.scheduledAt
    ? startOfDay(new Date(scheduled[0].scheduledAt))
    : startOfDay(new Date());

  const days = Array.from({ length: DAYS_TO_SHOW }, (_, index) =>
    addDays(baseDate, index),
  );

  const items = scheduled
    .map<ScheduleItem | null>((exam, index) => {
      if (!exam.scheduledAt) return null;

      const scheduledAt = new Date(exam.scheduledAt);
      const dayIndex = Math.round(
        (startOfDay(scheduledAt).getTime() - baseDate.getTime()) / DAY_MS,
      );

      if (dayIndex < 0 || dayIndex >= DAYS_TO_SHOW) return null;

      return {
        id: exam.id,
        title: exam.title,
        dayIndex,
        startMinutes:
          scheduledAt.getHours() * 60 + scheduledAt.getMinutes() - HOURS[0] * 60,
        duration: exam.duration ?? 45,
        category: index % 2 === 0 ? "required" : "elective",
      };
    })
    .filter((item): item is ScheduleItem => Boolean(item));

  if (items.length > 0) {
    return { days, items };
  }

  const fallbackItems: ScheduleItem[] = [
    {
      id: "demo-1",
      title: "12а явцын шалгалт",
      dayIndex: 1,
      startMinutes: 60,
      duration: 45,
      category: "required",
    },
    {
      id: "demo-2",
      title: "12б явцын шалгалт",
      dayIndex: 1,
      startMinutes: 180,
      duration: 45,
      category: "elective",
    },
    {
      id: "demo-3",
      title: "9а явцын шалгалт",
      dayIndex: 2,
      startMinutes: 120,
      duration: 45,
      category: "required",
    },
    {
      id: "demo-4",
      title: "10а явцын шалгалт",
      dayIndex: 3,
      startMinutes: 0,
      duration: 45,
      category: "required",
    },
    {
      id: "demo-5",
      title: "12а явцын шалгалт",
      dayIndex: 3,
      startMinutes: 360,
      duration: 45,
      category: "elective",
    },
  ];

  return {
    days,
    items: fallbackItems,
  };
}

function LegendDot({ category }: { category: ScheduleCategory }) {
  const tone =
    category === "required"
      ? "border-blue-500 text-blue-500"
      : "border-amber-400 text-amber-400";

  return <span className={`inline-block h-3.5 w-3.5 rounded-full border-[3px] ${tone}`} />;
}

function ScheduleCard({ item }: { item: ScheduleItem }) {
  const tone =
    item.category === "required"
      ? {
          border: "border-t-blue-500",
          dot: "required" as const,
        }
      : {
          border: "border-t-amber-400",
          dot: "elective" as const,
        };

  return (
    <div
      className={`absolute rounded-2xl border border-border bg-card px-3 py-3 shadow-sm ${tone.border}`}
      style={{
        left: `calc(${item.dayIndex} * (100% / ${DAYS_TO_SHOW}) + 12px)`,
        width: `calc((100% / ${DAYS_TO_SHOW}) - 16px)`,
        top: `${Math.max(8, (item.startMinutes / 60) * ROW_HEIGHT + 8)}px`,
        height: `${Math.max((item.duration / 60) * ROW_HEIGHT - 10, 52)}px`,
      }}
    >
      <div className="flex h-full items-center gap-2 text-sm font-semibold text-foreground/85">
        <LegendDot category={tone.dot} />
        <span className="line-clamp-2">{item.title}</span>
      </div>
    </div>
  );
}

export default function TeacherStudentsTab({
  exams,
  onAddSchedule,
}: TeacherStudentsTabProps) {
  const { days, items } = buildScheduleData(exams);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Шалгалтын хуваарь
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
          className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
          onClick={onAddSchedule}
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

      <div className="overflow-x-auto">
        <div className="min-w-[980px] rounded-[34px] border border-border bg-card p-4 shadow-sm">
          <div className="overflow-hidden rounded-[28px] bg-background/70">
            <div className="grid grid-cols-[88px_1fr]">
              <div className="border-r border-border/60 bg-card/70" />
              <div
                className="grid border-b border-border/60 bg-card/70"
                style={{
                  gridTemplateColumns: `repeat(${DAYS_TO_SHOW}, minmax(0, 1fr))`,
                }}
              >
                {days.map((day, index) => (
                  <div
                    key={`${day.toISOString()}-${index}`}
                    className="border-r border-border/60 px-4 py-4 text-center text-lg font-semibold text-foreground last:border-r-0"
                  >
                    {formatDayLabel(day)}
                  </div>
                ))}
              </div>

              <div className="border-r border-border/60 bg-card/70">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="border-b border-border/60 px-5 pt-1 text-sm text-muted-foreground last:border-b-0"
                    style={{ height: `${ROW_HEIGHT}px` }}
                  >
                    {hour.toString().padStart(2, "0")} цаг
                  </div>
                ))}
              </div>

              <div className="relative">
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${DAYS_TO_SHOW}, minmax(0, 1fr))`,
                  }}
                >
                  {Array.from({ length: DAYS_TO_SHOW }, (_, dayIndex) => (
                    <div
                      key={`column-${dayIndex}`}
                      className="border-r border-border/60 last:border-r-0"
                    >
                      {HOURS.map((hour, rowIndex) => (
                        <div
                          key={`${dayIndex}-${hour}`}
                          className="border-b border-border/60 last:border-b-0"
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
                  {items.map((item) => (
                    <ScheduleCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
