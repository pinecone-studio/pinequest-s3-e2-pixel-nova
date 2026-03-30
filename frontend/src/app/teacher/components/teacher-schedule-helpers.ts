import type { Exam } from "../types";

export const HOURS = [8, 9, 10, 11, 12, 13, 14];
export const ROW_HEIGHT = 76;
export const DAY_MS = 24 * 60 * 60 * 1000;
export const TIME_COLUMN_WIDTH = 88;
export const DAY_COLUMN_WIDTH = 170;
export const VISIBLE_DAY_COUNT = 5;

export type ScheduleCategory = "required" | "elective";
export type ScheduleLifecycle = "scheduled" | "active" | "finished";

export type ScheduleItem = {
  id: string;
  title: string;
  subtitle?: string;
  dayIndex: number;
  startMinutes: number;
  duration: number;
  category: ScheduleCategory;
  lifecycle: ScheduleLifecycle;
  scheduledDate: Date;
  roomCode: string;
};

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function formatDayLabel(date: Date) {
  return `${date.getMonth() + 1} сарын ${date.getDate()}`;
}

export function formatSectionLabel(date: Date) {
  const today = startOfDay(new Date());
  const sameDay = startOfDay(date).getTime() === today.getTime();
  return `${date.getMonth() + 1} сарын ${date.getDate()}${sameDay ? " (Өнөөдөр)" : ""}`;
}

export function formatDateValue(date: Date) {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

export function formatTimeValue(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function resolveScheduleLifecycle(exam: Exam, scheduledAt: Date): ScheduleLifecycle {
  if (exam.finishedAt || exam.status === "finished") {
    return "finished";
  }

  if (exam.status === "active" || exam.status === "in_progress") {
    return "active";
  }

  const now = Date.now();
  const startTime = scheduledAt.getTime();
  const endTime = startTime + (exam.duration ?? 45) * 60 * 1000;

  if (startTime <= now && now < endTime) {
    return "active";
  }

  if (endTime <= now) {
    return "finished";
  }

  return "scheduled";
}

export function buildScheduleData(exams: Exam[]) {
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
        title: exam.className || exam.title,
        subtitle: [exam.title, exam.groupName, exam.description]
          .filter(Boolean)
          .join(" · "),
        dayIndex,
        startMinutes:
          scheduledAt.getHours() * 60 +
          scheduledAt.getMinutes() -
          HOURS[0] * 60,
        duration: exam.duration ?? 45,
        category:
          exam.groupName?.toLowerCase().includes("сонгон") || index % 2 === 1
            ? "elective"
            : "required",
        lifecycle: resolveScheduleLifecycle(exam, scheduledAt),
        scheduledDate: scheduledAt,
        roomCode: exam.roomCode,
      };
    })
    .filter((item): item is ScheduleItem => Boolean(item));

  return { days, items };
}
