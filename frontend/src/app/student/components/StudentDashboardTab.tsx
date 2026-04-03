import { useMemo } from "react";
import { ArrowRight, ArrowUp, ChevronRight } from "lucide-react";
import type { XpLeaderboardEntry, XpNeighborEntry } from "@/api/xp";
import type { Exam } from "../types";
import StudentExamDetailSection from "./StudentExamDetailSection";
import { formatClock, subjectFromExam } from "./student-exams-helpers";
import { formatCompactStudentPoints } from "./student-ui-text";

type StudentDashboardTabProps = {
  loading: boolean;
  currentUserId?: string | null;
  currentUserName: string;
  exams?: Exam[];
  selectedExam: Exam | null;
  levelInfo: { level: number; minXP: number };
  studentProgress: { xp: number };
  nextLevel: { minXP: number };
  currentRank: number | null;
  studentCount: number;
  leaderboardXp?: number;
  leaderboardLevel?: number;
  studentHistory: {
    examId: string;
    title: string;
    percentage: number;
    score?: number;
    totalPoints?: number;
    grade?: "A" | "B" | "C" | "D" | "F";
    date: string;
  }[];
  xpNeighborEntries?: XpNeighborEntry[];
  termLeaderboardEntries?: XpLeaderboardEntry[];
  teacherName?: string | null;
  onOpenExamDetail?: (exam: Exam) => void;
  onCloseExamDetail?: () => void;
  onOpenExams: () => void;
  onOpenProgress: () => void;
};

const xpEmojis = ["🧑", "🧒", "🧑‍🎓", "👩"] as const;
const millisecondsPerDay = 1000 * 60 * 60 * 24;

const getExamTimestamp = (exam: Exam) => {
  const value = exam.scheduledAt ?? exam.createdAt;
  const timestamp = new Date(value ?? "");
  return Number.isNaN(timestamp.getTime()) ? new Date() : timestamp;
};

const compareDashboardExams = (left: Exam, right: Exam) => {
  const leftHasSchedule = Boolean(left.scheduledAt);
  const rightHasSchedule = Boolean(right.scheduledAt);
  const leftTime = getExamTimestamp(left).getTime();
  const rightTime = getExamTimestamp(right).getTime();

  if (leftHasSchedule !== rightHasSchedule) {
    return leftHasSchedule ? -1 : 1;
  }

  if (leftHasSchedule && rightHasSchedule) {
    return leftTime - rightTime;
  }

  return rightTime - leftTime;
};

const isUpcomingExam = (exam: Exam, now = Date.now()) => {
  if (!exam.scheduledAt) return false;
  const scheduledAt = new Date(exam.scheduledAt).getTime();
  if (Number.isNaN(scheduledAt)) return false;
  return scheduledAt >= now;
};

const formatSlashDate = (value: Date) =>
  value.toLocaleDateString("en-CA").replace(/-/g, "/");

const getDisplayName = (value: string) => value.trim().split(/\s+/)[0] || value;

const startOfDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

const isSameCalendarDay = (left: Date, right: Date) =>
  startOfDay(left).getTime() === startOfDay(right).getTime();

const formatDayHeading = (value: Date) => {
  const month = value.getMonth() + 1;
  const day = value.getDate();
  const suffix = isSameCalendarDay(value, new Date()) ? " (Өнөөдөр)" : "";
  return `${month} сарын ${day}${suffix}`;
};

const getDueBadge = (value: Date) => {
  const difference = Math.max(
    Math.round(
      (startOfDay(value).getTime() - startOfDay(new Date()).getTime()) /
        millisecondsPerDay,
    ),
    0,
  );

  if (difference === 0) {
    return {
      label: "Өнөөдөр",
      className: "bg-[#e6faeb] text-[#62c980]",
    };
  }

  if (difference <= 2) {
    return {
      label: `${difference} хоног`,
      className: "bg-[#fff2dc] text-[#f0aa3d]",
    };
  }

  return {
    label: `${difference} хоног`,
    className: "bg-[#f3f5f7] text-[#a8b2bc]",
  };
};

export default function StudentDashboardTab({
  loading,
  currentUserId = null,
  currentUserName,
  exams = [],
  selectedExam,
  levelInfo,
  currentRank,
  leaderboardXp = 0,
  leaderboardLevel,
  studentHistory: _studentHistory,
  xpNeighborEntries = [],
  termLeaderboardEntries = [],
  teacherName,
  onOpenExamDetail = () => undefined,
  onCloseExamDetail = () => undefined,
  onOpenExams,
  onOpenProgress,
}: StudentDashboardTabProps) {
  const orderedExams = useMemo(
    () =>
      [...exams]
        .filter((exam) => isUpcomingExam(exam))
        .sort(compareDashboardExams),
    [exams],
  );

  const featuredExam = useMemo(() => {
    return orderedExams.map((exam) => {
      const timestamp = getExamTimestamp(exam);

      return {
        id: exam.id,
        exam,
        title: subjectFromExam(exam),
        dateLabel: formatSlashDate(timestamp),
        timeLabel: formatClock(timestamp),
        durationLabel: `${exam.duration ?? 40} минут`,
      };
    });
  }, [orderedExams]);

  const featuredDayHeading = useMemo(() => {
    if (featuredExam.length === 0) {
      return formatDayHeading(new Date());
    }

    return "Товлогдсон шалгалтууд";
  }, [featuredExam]);

  const upcomingCards = useMemo(() => {
    const featuredIds = new Set(featuredExam.map((item) => item.id));
    const remainingExams = orderedExams.filter(
      (exam) => !featuredIds.has(exam.id),
    );

    return remainingExams.slice(0, 4).map((exam) => {
      const timestamp = getExamTimestamp(exam);
      const dueBadge = getDueBadge(timestamp);

      return {
        id: exam.id,
        exam,
        title: subjectFromExam(exam),
        dateLabel: formatSlashDate(timestamp),
        timeLabel: formatClock(timestamp),
        dueBadge,
      };
    });
  }, [featuredExam, orderedExams]);

  const { xpRows, xpGapToAbove, displayRank } = useMemo(() => {
    const sourceEntries =
      xpNeighborEntries.length > 0 ? xpNeighborEntries : termLeaderboardEntries;

    const normalizedEntries = sourceEntries
      .map((entry) => ({
        ...entry,
        fullName:
          currentUserId && entry.id === currentUserId
            ? currentUserName
            : entry.fullName,
      }))
      .sort(
        (left, right) =>
          right.xp - left.xp ||
          left.rank - right.rank ||
          left.fullName.localeCompare(right.fullName),
      );

    const currentEntryIndex = normalizedEntries.findIndex(
      (entry) => entry.id === currentUserId,
    );
    const currentEntry =
      currentEntryIndex >= 0
        ? normalizedEntries[currentEntryIndex]
        : currentUserId
          ? {
              rank: currentRank ?? Math.max(normalizedEntries.length + 1, 1),
              id: currentUserId,
              fullName: currentUserName,
              xp: leaderboardXp,
              level: leaderboardLevel ?? levelInfo.level,
            }
          : null;

    if (!currentEntry) {
      return {
        xpRows: normalizedEntries.slice(0, 3),
        xpGapToAbove: null as number | null,
        displayRank: currentRank,
      };
    }

    const nearestAbove =
      currentEntryIndex > 0 ? normalizedEntries[currentEntryIndex - 1] : null;
    const nearestBelow =
      currentEntryIndex >= 0 && currentEntryIndex < normalizedEntries.length - 1
        ? normalizedEntries[currentEntryIndex + 1]
        : null;

    return {
      xpRows: [nearestAbove, currentEntry, nearestBelow].filter(
        (entry): entry is NonNullable<typeof entry> => Boolean(entry),
      ),
      xpGapToAbove: nearestAbove
        ? Math.max(nearestAbove.xp - currentEntry.xp, 0)
        : null,
      displayRank: currentEntry.rank ?? currentRank,
    };
  }, [
    currentRank,
    currentUserId,
    currentUserName,
    leaderboardLevel,
    leaderboardXp,
    levelInfo.level,
    termLeaderboardEntries,
    xpNeighborEntries,
  ]);

  if (loading) {
    return (
      <section
        aria-label="student-dashboard-loading"
        className="mx-auto w-full max-w-[1272px] space-y-7"
      >
        <div className="space-y-5">
          <div className="h-9 w-[220px] animate-pulse rounded-full bg-[#e4e7f0]" />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_316px]">
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="flex min-h-[200px] flex-col rounded-[28px] border border-[#d9e4ff] bg-white px-5 py-5 shadow-[0_12px_28px_-24px_rgba(79,93,132,0.16)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-7 w-28 animate-pulse rounded-full bg-[#e4e7f0]" />
                    <div className="h-6 w-24 animate-pulse rounded-full bg-[#eef2fb]" />
                  </div>

                  <div className="mt-6 space-y-3">
                    {Array.from({ length: 3 }).map((__, rowIndex) => (
                      <div
                        key={rowIndex}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="h-4 w-24 animate-pulse rounded-full bg-[#eef2fb]" />
                        <div className="h-4 w-20 animate-pulse rounded-full bg-[#e4e7f0]" />
                      </div>
                    ))}
                  </div>

                  {index === 0 ? (
                    <div className="mt-auto ml-auto h-11 w-32 animate-pulse rounded-full bg-[#dfe5fb]" />
                  ) : (
                    <div className="mt-auto border-t border-[#edf1ff] pt-3">
                      <div className="ml-auto h-5 w-24 animate-pulse rounded-full bg-[#e4e7f0]" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="h-8 w-32 animate-pulse rounded-full bg-[#e4e7f0]" />

              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-[18px] border border-[#edf1ff] bg-white px-4 py-3"
                >
                  <div className="h-8 w-8 animate-pulse rounded-full bg-[#eef2fb]" />
                  <div className="h-8 w-8 animate-pulse rounded-full bg-[#f5f6fb]" />
                  <div className="min-w-0 flex-1">
                    <div className="h-4 w-20 animate-pulse rounded-full bg-[#e4e7f0]" />
                    <div className="mt-2 h-3 w-12 animate-pulse rounded-full bg-[#eef2fb]" />
                  </div>
                  <div className="h-4 w-12 animate-pulse rounded-full bg-[#e4e7f0]" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="h-8 w-[270px] animate-pulse rounded-full bg-[#e4e7f0]" />
            <div className="h-6 w-[92px] animate-pulse rounded-full bg-[#e4e7f0]" />
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-[28px] border border-[#d9e4ff] bg-white px-4 py-4 shadow-[0_12px_28px_-24px_rgba(79,93,132,0.24)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="h-6 w-28 animate-pulse rounded-full bg-[#e4e7f0]" />
                  <div className="h-7 w-[70px] animate-pulse rounded-full bg-[#eef2fb]" />
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="h-4 w-12 animate-pulse rounded-full bg-[#eef2fb]" />
                    <div className="h-4 w-20 animate-pulse rounded-full bg-[#e4e7f0]" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="h-4 w-16 animate-pulse rounded-full bg-[#eef2fb]" />
                    <div className="h-4 w-14 animate-pulse rounded-full bg-[#e4e7f0]" />
                  </div>
                </div>

                <div className="mt-6 border-t border-[#edf1ff] pt-3">
                  <div className="ml-auto h-4 w-24 animate-pulse rounded-full bg-[#e4e7f0]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (selectedExam) {
    return (
      <StudentExamDetailSection
        selectedExam={selectedExam}
        teacherName={teacherName}
        onBack={onCloseExamDetail}
        onPrimaryAction={onOpenExams}
        primaryActionLabel="Шалгалт эхлүүлэх"
        maxWidthClassName="max-w-[720px]"
      />
    );
  }

  return (
    <section className="mx-auto w-full max-w-[1272px] space-y-7">
      <div className="space-y-5">
        <h2 className="text-[2rem] font-semibold tracking-[-0.05em] text-slate-900">
          {featuredDayHeading}
        </h2>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_316px]">
          <div className="grid gap-4 md:grid-cols-2">
            {featuredExam.length > 0 ? (
              featuredExam.map((item, index) => (
                <article
                  key={item.id}
                  className="flex min-h-[200px] flex-col rounded-[28px] border border-[#d9e4ff] bg-white px-5 py-5 shadow-[0_12px_28px_-24px_rgba(79,93,132,0.16)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[1.08rem] font-semibold tracking-[-0.03em] text-slate-900">
                      {item.title}
                    </h3>
                    <span className="rounded-full bg-[#f3f5ff] px-3 py-1 text-[11px] font-semibold text-[#7d89ff]">
                      Явцын шалгалт
                    </span>
                  </div>

                  <dl className="mt-6 space-y-3 text-[0.98rem]">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-400">Өдөр:</dt>
                      <dd className="font-medium text-slate-700">
                        {item.dateLabel}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-400">Эхлэх цаг:</dt>
                      <dd className="font-medium text-slate-700">
                        {item.timeLabel}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-400">Үргэлжлэх хугацаа:</dt>
                      <dd className="font-medium text-slate-700">
                        {item.durationLabel}
                      </dd>
                    </div>
                  </dl>

                  {index === 0 ? (
                    <div className="mt-auto border-t border-[#edf1ff] pt-3">
                      <button
                        type="button"
                        className="ml-auto inline-flex items-center gap-2 text-[0.98rem] font-medium text-slate-600 transition hover:text-slate-900"
                        onClick={() => onOpenExamDetail(item.exam)}
                      >
                        Дэлгэрэнгүй
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-auto border-t border-[#edf1ff] pt-3">
                      <button
                        type="button"
                        className="ml-auto inline-flex items-center gap-2 text-[0.98rem] font-medium text-slate-600 transition hover:text-slate-900"
                        onClick={() => onOpenExamDetail(item.exam)}
                      >
                        Дэлгэрэнгүй
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </article>
              ))
            ) : (
              <div className="rounded-[28px] border border-dashed border-[#d9e4ff] bg-white/90 px-5 py-10 text-sm text-slate-400 md:col-span-2">
                Одоогоор идэвхтэй шалгалт алга байна.
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-[1.6rem] font-semibold tracking-[-0.04em] text-slate-900">
                Таны эрэмбэ
              </h3>
              <p className="sr-only">
                Одоогийн эрэмбэ{" "}
                {displayRank ? `#${displayRank}` : "тодорхойгүй"}
              </p>
            </div>

            {xpRows.length > 0 ? (
              xpRows.map((entry, index) => {
                const isCurrentUser = Boolean(
                  currentUserId && entry.id === currentUserId,
                );
                const displayName = isCurrentUser
                  ? getDisplayName(entry.fullName)
                  : "Сурагч";
                const RowTag = isCurrentUser ? "button" : "div";

                return (
                  <RowTag
                    key={entry.id}
                    {...(isCurrentUser
                      ? {
                          type: "button" as const,
                          onClick: onOpenProgress,
                          "aria-label": "Ахиц харах",
                        }
                      : {})}
                    className={`flex w-full items-center gap-3 rounded-[18px] border px-4 py-3 text-left ${
                      isCurrentUser
                        ? "border-[#c5d3ff] bg-[linear-gradient(135deg,#ffffff_0%,#f5f7ff_100%)] shadow-[0_14px_28px_-24px_rgba(79,93,132,0.24)]"
                        : "border-[#edf1ff] bg-white"
                    }`}
                  >
                    <div
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                        isCurrentUser
                          ? "bg-[#4f69ef] text-white"
                          : "bg-[#f4f6fb] text-[#c2c9d3]"
                      }`}
                    >
                      {entry.rank}
                    </div>
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#fff8eb] text-sm">
                      {xpEmojis[index % xpEmojis.length]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`truncate text-[15px] font-semibold ${
                            isCurrentUser
                              ? "text-[#4965ee]"
                              : "text-slate-300 blur-[1px]"
                          }`}
                        >
                          {displayName}
                        </div>
                        {isCurrentUser ? (
                          <span className="rounded-full bg-[#5f70ff] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
                            ТА
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        Түвшин {entry.level}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      {isCurrentUser && xpGapToAbove !== null ? (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-[#62c980]">
                          <ArrowUp className="h-3.5 w-3.5" />
                          {xpGapToAbove} оноо
                        </div>
                      ) : null}
                      <div
                        className={`flex items-center gap-1 text-[14px] font-semibold ${
                          isCurrentUser
                            ? "text-[#4a66ef]"
                            : "text-slate-400 blur-none"
                        }`}
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m13 2-7 12h5l-1 8 8-13h-5l0-7Z" />
                        </svg>
                        {formatCompactStudentPoints(entry.xp)}
                      </div>
                    </div>
                  </RowTag>
                );
              })
            ) : (
              <div className="rounded-[20px] border border-dashed border-[#dfe5fb] bg-[#fbfcff] px-4 py-5 text-sm text-slate-400">
                Онооны жагсаалт удахгүй харагдана.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[1.9rem] font-semibold tracking-[-0.045em] text-slate-900">
            Дараагийн шалгалтууд
          </h2>
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#6b72ff] transition hover:text-[#4d5cf0]"
            onClick={onOpenExams}
          >
            Бүгдийг харах
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {upcomingCards.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[#dfe5fb] bg-white/90 px-5 py-8 text-sm text-slate-400">
            Одоогоор товлогдсон шалгалтын хуваарь алга.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {upcomingCards.map((card) => (
              <article
                key={card.id}
                className="group flex min-h-[174px] flex-col rounded-[28px] border border-[#d9e4ff] bg-white px-4 py-4 shadow-[0_12px_28px_-24px_rgba(79,93,132,0.24)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-24px_rgba(79,93,132,0.3)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[1.05rem] font-semibold tracking-[-0.03em] text-slate-900">
                    {card.title}
                  </h3>
                  <span
                    className={`rounded-full px-3 py-1 text-[12px] font-semibold ${card.dueBadge.className}`}
                  >
                    {card.dueBadge.label}
                  </span>
                </div>

                <dl className="mt-5 space-y-3 text-[0.95rem]">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-400">Өдөр:</dt>
                    <dd className="font-medium text-slate-700">
                      {card.dateLabel}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-400">Эхлэх цаг:</dt>
                    <dd className="font-medium text-slate-700">
                      {card.timeLabel}
                    </dd>
                  </div>
                </dl>

                <div className="mt-auto border-t border-[#edf1ff] pt-3">
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-end gap-2 text-sm font-semibold text-slate-600 transition group-hover:text-slate-900"
                    onClick={() => onOpenExamDetail(card.exam)}
                  >
                    Дэлгэрэнгүй
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
