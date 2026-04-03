import type { Exam } from "../types";

export const HOURS = Array.from({ length: 17 }, (_, index) => index + 8);
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
  subjectName?: string | null;
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
  const diffDays = Math.round(
    (startOfDay(date).getTime() - today.getTime()) / DAY_MS,
  );
  const suffix =
    diffDays === 0 ? " (Өнөөдөр)" : diffDays === 1 ? " (Маргааш)" : diffDays === -1 ? " (Өчигдөр)" : "";
  return `${date.getMonth() + 1} сарын ${date.getDate()}${suffix}`;
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

  const now = Date.now();
  const startTime = scheduledAt.getTime();
  const endTime = startTime + (exam.duration ?? 45) * 60 * 1000;

  if (endTime <= now) {
    return "finished";
  }

  if (exam.status === "active" || exam.status === "in_progress") {
    return "active";
  }

  if (startTime <= now && now < endTime) {
    return "active";
  }

  return "scheduled";
}

function stripScheduleDescriptors(value: string) {
  return value
    .replace(/заавал\s*судлах/giu, "")
    .replace(/сонгон\s*судлал/giu, "")
    .replace(/сонгон\s*судлах/giu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSubjectName(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (lower === "ерөнхий" || lower === "general") {
    return null;
  }

  return trimmed;
}

function inferSubjectName(exam: Exam) {
  const explicitSubject = normalizeSubjectName(exam.subjectName);
  if (explicitSubject) return explicitSubject;

  const searchableText = [
    exam.title,
    exam.description,
    exam.examType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!searchableText) {
    return "Тодорхойгүй";
  }

  const subjectRules = [
    {
      label: "Англи хэл",
      keywords: [
        "english",
        "vocabulary",
        "grammar",
        "listening",
        "reading",
        "writing",
        "speaking",
        "tense",
        "present perfect",
        "past participle",
      ],
    },
    {
      label: "Математик",
      keywords: [
        "math",
        "mathematics",
        "algebra",
        "geometry",
        "equation",
        "function",
        "calculus",
      ],
    },
    {
      label: "Монгол хэл",
      keywords: ["монгол", "mongolian", "essay", "зохион бичлэг", "найруулга"],
    },
    {
      label: "Монгол бичиг",
      keywords: ["монгол бичиг", "үндэсний бичиг", "traditional script"],
    },
    {
      label: "Орос хэл",
      keywords: ["орос", "russian", "кирилл", "русский"],
    },
    {
      label: "Хятад хэл",
      keywords: ["хятад", "chinese", "mandarin", "hanzi", "hsk"],
    },
    {
      label: "Солонгос хэл",
      keywords: ["солонгос", "korean", "hangul", "topik"],
    },
    {
      label: "Япон хэл",
      keywords: ["япон", "japanese", "hiragana", "katakana", "jlpt"],
    },
    {
      label: "Герман хэл",
      keywords: ["герман", "german", "deutsch"],
    },
    {
      label: "Физик",
      keywords: ["physics", "force", "motion", "energy", "electromagnetic"],
    },
    {
      label: "Хими",
      keywords: ["chemistry", "chemical", "atom", "molecule", "reaction"],
    },
    {
      label: "Биологи",
      keywords: ["biology", "cell", "genetics", "ecosystem", "photosynthesis"],
    },
    {
      label: "Газарзүй",
      keywords: ["geography", "map", "climate", "continent", "latitude"],
    },
    {
      label: "Нийгэм судлал",
      keywords: ["social studies", "society", "sociology", "citizenship"],
    },
    {
      label: "Иргэний ёс зүйн боловсрол",
      keywords: ["ethics", "civic", "citizen", "moral", "ёс зүй"],
    },
    {
      label: "Эдийн засаг",
      keywords: ["economics", "microeconomics", "macroeconomics", "market"],
    },
    {
      label: "Мэдээллийн технологи",
      keywords: ["information technology", "it", "computer", "digital literacy"],
    },
    {
      label: "Программчлал",
      keywords: ["programming", "coding", "algorithm", "python", "javascript"],
    },
    {
      label: "Дизайн технологи",
      keywords: ["design technology", "engineering drawing", "prototype"],
    },
    {
      label: "Дүрслэх урлаг",
      keywords: ["art", "drawing", "painting", "visual art"],
    },
    {
      label: "Хөгжим",
      keywords: ["music", "rhythm", "melody", "harmony"],
    },
    {
      label: "Биеийн тамир",
      keywords: ["physical education", "pe", "fitness", "sports"],
    },
    {
      label: "Эрүүл мэнд",
      keywords: ["health", "nutrition", "wellness", "first aid"],
    },
    {
      label: "Технологи",
      keywords: ["technology", "tools", "manufacturing", "craft"],
    },
    {
      label: "Астрономи",
      keywords: ["astronomy", "planet", "solar system", "galaxy"],
    },
    {
      label: "Экологи",
      keywords: ["ecology", "environment", "biodiversity", "sustainability"],
    },
    {
      label: "Түүх",
      keywords: ["history", "historical", "war", "empire", "revolution"],
    },
  ] as const;

  for (const rule of subjectRules) {
    if (rule.keywords.some((keyword) => searchableText.includes(keyword))) {
      return rule.label;
    }
  }

  return "Тодорхойгүй";
}

function normalizeClassTitle(value?: string | null) {
  const primaryValue = value
    ?.split(",")
    .map((item) => item.trim())
    .find(Boolean);

  if (!primaryValue) return null;

  const cleaned = stripScheduleDescriptors(primaryValue);

  if (!cleaned) return null;

  return /анги/iu.test(cleaned) ? cleaned : `${cleaned} анги`;
}

function extractClassTitle(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/(\d{1,2}\s*[A-Za-zА-Яа-яӨөҮүЁё])/u);
  if (!match) return null;

  return normalizeClassTitle(match[1]);
}

export function getExamScheduleLifecycle(exam: Exam): ScheduleLifecycle | null {
  if (!exam.scheduledAt) return null;
  const scheduledAt = new Date(exam.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) return null;
  return resolveScheduleLifecycle(exam, scheduledAt);
}

export function buildScheduleData(exams: Exam[]) {
  const resolveTitle = (exam: Exam) => {
    const title = exam.title?.trim() || "";
    const description = exam.description?.trim() || "";

    return stripScheduleDescriptors(title || description || "Шалгалт") || "Шалгалт";
  };

  const scheduled = exams
    .filter((exam) => Boolean(exam.scheduledAt))
    .sort(
      (left, right) =>
        new Date(left.scheduledAt ?? "").getTime() -
        new Date(right.scheduledAt ?? "").getTime(),
    );

  const today = startOfDay(new Date());
  const firstScheduledAt = scheduled[0]?.scheduledAt ?? null;
  const lastScheduledAt = scheduled[scheduled.length - 1]?.scheduledAt ?? null;

  const earliestScheduledAt = firstScheduledAt
    ? startOfDay(new Date(firstScheduledAt))
    : today;
  const latestScheduledAt = lastScheduledAt
    ? startOfDay(new Date(lastScheduledAt))
    : today;

  const baseDate = startOfDay(new Date(today));
  baseDate.setMonth(baseDate.getMonth() - 1);

  if (earliestScheduledAt.getTime() < baseDate.getTime()) {
    baseDate.setTime(earliestScheduledAt.getTime());
  }

  const endDate = startOfDay(new Date(today));
  endDate.setMonth(endDate.getMonth() + 1);

  if (latestScheduledAt.getTime() > endDate.getTime()) {
    endDate.setTime(latestScheduledAt.getTime());
  }

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
        title: resolveTitle(exam),
        subjectName: inferSubjectName(exam),
        subtitle: [
          normalizeClassTitle(exam.className) ?? extractClassTitle(exam.className),
          exam.groupName?.trim() || null,
        ]
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
