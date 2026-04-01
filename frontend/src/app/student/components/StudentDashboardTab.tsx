import { useMemo } from "react";
import { ArrowRight, ArrowUp, ChevronRight, Play, Star } from "lucide-react";
import type { XpLeaderboardEntry } from "@/api/xp";
import type { Exam } from "../types";
import StudentExamDetailSection from "./StudentExamDetailSection";
import { formatClock, subjectFromExam } from "./student-exams-helpers";

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

const formatSlashDate = (value: Date) =>
  value.toLocaleDateString("en-CA").replace(/-/g, "/");

const formatCompactXp = (value: number) => {
  if (value >= 1000) {
    const compact =
      value >= 10000 ? Math.round(value / 1000) : Math.round(value / 100) / 10;
    return `${compact.toString().replace(/\.0$/, "")}k`;
  }

  return value.toLocaleString();
};

const getDisplayName = (value: string) => value.trim().split(/\s+/)[0] || value;

const startOfDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

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
  studentProgress,
  nextLevel,
  currentRank,
  studentCount,
  leaderboardXp = 0,
  leaderboardLevel,
  studentHistory,
  termLeaderboardEntries = [],
  teacherName,
  onOpenExamDetail = () => undefined,
  onCloseExamDetail = () => undefined,
  onOpenExams,
  onOpenProgress,
}: StudentDashboardTabProps) {
  const orderedExams = useMemo(
    () => [...exams].sort(compareDashboardExams),
    [exams],
  );

  const featuredExam = useMemo(() => {
    const exam = orderedExams[0] ?? null;
    if (!exam) return null;

    const timestamp = getExamTimestamp(exam);
    const dueBadge = getDueBadge(timestamp);

    return {
      exam,
      title: exam.title?.trim() || subjectFromExam(exam),
      subject: subjectFromExam(exam),
      dateLabel: formatSlashDate(timestamp),
      timeLabel: formatClock(timestamp),
      durationLabel: `${exam.duration ?? 40} минут`,
      dueBadge,
    };
  }, [orderedExams]);

  const upcomingCards = useMemo(
    () =>
      orderedExams.slice(0, 4).map((exam) => {
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
      }),
    [orderedExams],
  );

  const scoreSummary = useMemo(() => {
    const latestHistory = [...studentHistory].sort(
      (left, right) =>
        new Date(right.date).getTime() - new Date(left.date).getTime(),
    )[0];

    return latestHistory?.percentage ?? 83;
  }, [studentHistory]);

  const summarySubject = featuredExam?.subject ?? studentHistory[0]?.title ?? "English";

  const { xpRows, xpGapToAbove, displayRank } = useMemo(() => {
    const normalizedEntries = termLeaderboardEntries
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
      )
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    const currentEntry =
      normalizedEntries.find((entry) => entry.id === currentUserId) ??
      (currentUserId
        ? {
            rank: currentRank ?? Math.max(normalizedEntries.length + 1, 1),
            id: currentUserId,
            fullName: currentUserName,
            xp: leaderboardXp,
            level: leaderboardLevel ?? levelInfo.level,
          }
        : null);

    if (!currentEntry) {
      return {
        xpRows: normalizedEntries.slice(0, 3),
        xpGapToAbove: null as number | null,
        displayRank: currentRank,
      };
    }

    const nearestAbove = [...normalizedEntries]
      .reverse()
      .find((entry) => entry.rank < currentEntry.rank);
    const nearestBelow = normalizedEntries.find(
      (entry) => entry.rank > currentEntry.rank,
    );

    return {
      xpRows: [nearestAbove, currentEntry, nearestBelow].filter(
        (entry): entry is NonNullable<typeof entry> => Boolean(entry),
      ),
      xpGapToAbove: nearestAbove
        ? Math.max(nearestAbove.xp - currentEntry.xp, 0)
        : null,
      displayRank: currentEntry.rank,
    };
  }, [
    currentRank,
    currentUserId,
    currentUserName,
    leaderboardLevel,
    leaderboardXp,
    levelInfo.level,
    termLeaderboardEntries,
  ]);

  if (loading) {
    return (
      <section
        aria-label="student-dashboard-loading"
        className="mx-auto w-full max-w-[1272px] space-y-7"
      >
        <div className="space-y-5">
          <div className="h-8 w-[232px] animate-pulse rounded-full bg-[#e4e7f0]" />

          <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="rounded-[28px] border border-[#d9e4ff] bg-white px-4 py-4 shadow-[0_12px_28px_-24px_rgba(79,93,132,0.24)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="h-7 w-[220px] animate-pulse rounded-full bg-[#e4e7f0]" />
                  <div className="h-7 w-[78px] animate-pulse rounded-full bg-[#e4e7f0]" />
                </div>

                <div className="mt-5 space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="h-4 w-20 animate-pulse rounded-full bg-[#eef2fb]" />
                      <div className="h-4 w-24 animate-pulse rounded-full bg-[#e4e7f0]" />
                    </div>
                  ))}
                </div>

                <div className="mt-4 h-11 w-full animate-pulse rounded-full bg-[#dfe5fb]" />
              </div>

              <div className="rounded-[22px] border border-[#d9e4ff] bg-white px-4 py-4 shadow-[0_10px_24px_-24px_rgba(79,93,132,0.2)]">
                <div className="h-8 w-8 animate-pulse rounded-full bg-[#eef2fb]" />
                <div className="mt-3 h-5 w-24 animate-pulse rounded-full bg-[#e4e7f0]" />
                <div className="mt-2 h-4 w-20 animate-pulse rounded-full bg-[#eef2fb]" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div
                  className="flex min-h-[82px] flex-col items-center justify-center rounded-[22px] border border-[#d9e4ff] bg-white px-4 py-4 shadow-[0_10px_24px_-24px_rgba(79,93,132,0.2)]"
                >
                  <div className="h-8 w-8 animate-pulse rounded-full bg-[#eef2fb]" />
                  <div className="mt-2 h-5 w-24 animate-pulse rounded-full bg-[#e4e7f0]" />
                  <div className="mt-2 h-4 w-20 animate-pulse rounded-full bg-[#eef2fb]" />
                </div>
                <div className="flex min-h-[82px] flex-col items-center justify-center rounded-[22px] border border-[#d9e4ff] bg-white px-4 py-4 shadow-[0_10px_24px_-24px_rgba(79,93,132,0.2)]">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-[#eef2fb]" />
                  <div className="mt-2 h-5 w-20 animate-pulse rounded-full bg-[#e4e7f0]" />
                  <div className="mt-2 h-4 w-24 animate-pulse rounded-full bg-[#eef2fb]" />
                </div>
              </div>

              <div className="rounded-[24px] border border-[#e5ebff] bg-white px-4 py-4 shadow-[0_12px_28px_-24px_rgba(79,93,132,0.24)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-7 w-36 animate-pulse rounded-full bg-[#e4e7f0]" />
                  <div className="h-7 w-14 animate-pulse rounded-full bg-[#eef2fb]" />
                </div>

                <div className="mt-4 space-y-2.5">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-[18px] border border-[#edf1ff] bg-white px-3 py-3"
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
        primaryActionLabel="Start Exam"
        maxWidthClassName="max-w-[720px]"
      />
    );
  }

  return (
    <section className="mx-auto w-full max-w-[1272px] space-y-7">
      <div className="space-y-5">
        <h2 className="text-[1.9rem] font-semibold tracking-[-0.045em] text-slate-900">
          Шалгалт өгөх
        </h2>

        <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="space-y-4">
            {featuredExam ? (
              <article className="rounded-[28px] border border-[#d9e4ff] bg-white px-4 py-4 shadow-[0_12px_28px_-24px_rgba(79,93,132,0.24)]">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="max-w-[270px] text-[1.05rem] font-semibold tracking-[-0.03em] text-slate-900">
                    {featuredExam.title}
                  </h3>
                  <span
                    className={`rounded-full px-3 py-1 text-[12px] font-semibold ${featuredExam.dueBadge.className}`}
                  >
                    {featuredExam.dueBadge.label}
                  </span>
                </div>

                <dl className="mt-5 space-y-3 text-[0.95rem]">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-400">Өдөр:</dt>
                    <dd className="font-medium text-slate-700">
                      {featuredExam.dateLabel}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-400">Эхлэх цаг:</dt>
                    <dd className="font-medium text-slate-700">
                      {featuredExam.timeLabel}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-400">Үргэлжлэх хугацаа:</dt>
                    <dd className="font-medium text-slate-700">
                      {featuredExam.durationLabel}
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#4e6cf2] px-5 text-sm font-semibold text-white shadow-[0_16px_32px_-20px_rgba(78,108,242,0.82)] transition hover:brightness-105"
                  onClick={() => onOpenExamDetail(featuredExam.exam)}
                >
                  <Play className="h-[17px] w-[17px]" />
                  Шалгалтад орох
                </button>
              </article>
            ) : (
              <div className="rounded-[28px] border border-dashed border-[#d9e4ff] bg-white/90 px-5 py-10 text-sm text-slate-400">
                Одоогоор идэвхтэй шалгалт алга байна.
              </div>
            )}

            <article className="rounded-[22px] border border-[#d9e4ff] bg-white px-4 py-4 shadow-[0_10px_24px_-24px_rgba(79,93,132,0.2)]">
              <div className="grid h-8 w-8 place-items-center rounded-full border border-[#7d93ff] text-[#5870f1]">
                <Star className="h-4 w-4" />
              </div>
              <div className="mt-3 text-[1.05rem] font-semibold text-slate-900">
                {summarySubject}
              </div>
              <div className="mt-1 text-sm text-slate-400">Гол хичээл</div>
            </article>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <article className="flex min-h-[82px] flex-col items-center justify-center rounded-[22px] border border-[#d9e4ff] bg-white px-4 py-4 text-center shadow-[0_10px_24px_-24px_rgba(79,93,132,0.2)]">
                <div className="grid h-8 w-8 place-items-center rounded-full border border-[#7d93ff] text-[#5870f1]">
                  <Star className="h-4 w-4" />
                </div>
                <div className="mt-2 text-[1.05rem] font-semibold text-slate-900">
                  {summarySubject}
                </div>
                <div className="mt-1 text-sm text-slate-400">Гол хичээл</div>
              </article>

              <button
                type="button"
                aria-label="Ахиц харах"
                className="flex min-h-[82px] flex-col items-center justify-center rounded-[22px] border border-[#d9e4ff] bg-white px-4 py-4 text-center shadow-[0_10px_24px_-24px_rgba(79,93,132,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-24px_rgba(79,93,132,0.26)]"
                onClick={onOpenProgress}
              >
                <div className="grid h-8 w-8 place-items-center rounded-full border border-[#7d93ff] text-[#5870f1]">
                  <Star className="h-4 w-4" />
                </div>
                <div className="mt-2 text-[1.05rem] font-semibold text-slate-900">
                  {scoreSummary}%
                </div>
                <div className="mt-1 text-sm text-slate-400">Дундаж оноо</div>
              </button>
            </div>

            <div className="rounded-[24px] border border-[#e5ebff] bg-white px-4 py-4 shadow-[0_12px_28px_-24px_rgba(79,93,132,0.24)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-[1.45rem] font-semibold tracking-[-0.035em] text-slate-900">
                    Таны эрэмбэ
                  </h3>
                  <p className="sr-only">
                    Дараагийн түвшин хүртэл{" "}
                    {Math.max(nextLevel.minXP - studentProgress.xp, 0)} XP
                  </p>
                </div>
                {displayRank ? (
                  <span className="rounded-full bg-[#f4f6ff] px-3 py-1 text-xs font-semibold text-[#6474f4]">
                    #{displayRank}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 space-y-2.5">
                {xpRows.map((entry, index) => {
                  const isCurrentUser = Boolean(
                    currentUserId && entry.id === currentUserId,
                  );
                  const displayName = isCurrentUser
                    ? getDisplayName(entry.fullName)
                    : "Сурагч";

                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-3 rounded-[18px] border px-3 py-3 ${
                        isCurrentUser
                          ? "border-[#c5d3ff] bg-[linear-gradient(135deg,#fbfcff_0%,#eef2ff_100%)] shadow-[0_14px_28px_-24px_rgba(79,93,132,0.28)]"
                          : "border-[#edf1ff] bg-white"
                      }`}
                    >
                      <div
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                          isCurrentUser
                            ? "bg-[#4f69ef] text-white"
                            : "bg-[#f4f6fb] text-[#9aa6b2]"
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
                              isCurrentUser ? "text-[#4965ee]" : "text-slate-500"
                            }`}
                          >
                            {displayName}
                          </div>
                          {isCurrentUser ? (
                            <span className="rounded-full bg-[#5f70ff] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
                              YOU
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-400">
                          Lvl {entry.level}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        {isCurrentUser && xpGapToAbove !== null ? (
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#62c980]">
                            <ArrowUp className="h-3.5 w-3.5" />
                            {xpGapToAbove}xp
                          </div>
                        ) : null}
                        <div
                          className={`flex items-center gap-1 text-[14px] font-semibold ${
                            isCurrentUser ? "text-[#4a66ef]" : "text-slate-300"
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
                          {formatCompactXp(entry.xp)}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {xpRows.length === 0 ? (
                  <div className="rounded-[20px] border border-dashed border-[#dfe5fb] bg-[#fbfcff] px-4 py-5 text-sm text-slate-400">
                    XP жагсаалт удахгүй харагдана.
                  </div>
                ) : null}
              </div>
            </div>
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
            Одоогоор харагдах шалгалтын хуваарь алга.
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
                    <dd className="font-medium text-slate-700">{card.dateLabel}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-400">Эхлэх цаг:</dt>
                    <dd className="font-medium text-slate-700">{card.timeLabel}</dd>
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
