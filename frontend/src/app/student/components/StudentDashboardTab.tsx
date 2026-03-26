import { useMemo } from "react";
import type { Exam } from "../types";
import StudentDashboardHero from "./StudentDashboardHero";
import StudentUpcomingExamsPanel from "./StudentUpcomingExamsPanel";
import StudentSummaryPanel from "./StudentSummaryPanel";
import StudentProgressPanel from "./StudentProgressPanel";
import StudentStreakPanel from "./StudentStreakPanel";
import {
  examAccentPalette,
  formatExamDate,
  getFirstName,
  normalizeExamOverview,
  toDayKey,
  weekLabels,
  buildAreaPath,
  buildLinePath,
} from "./student-dashboard-helpers";

type StudentDashboardTabProps = {
  loading: boolean;
  currentUserName: string;
  selectedExam: Exam | null;
  levelInfo: { level: number; minXP: number };
  studentProgress: { xp: number };
  nextLevel: { minXP: number };
  currentRank: number | null;
  studentCount: number;
  studentHistory: {
    examId: string;
    title: string;
    percentage: number;
    score?: number;
    totalPoints?: number;
    grade?: "A" | "B" | "C" | "D" | "F";
    date: string;
  }[];
  onOpenExams: () => void;
  onOpenProgress: () => void;
};

export default function StudentDashboardTab({
  loading,
  currentUserName,
  selectedExam,
  levelInfo,
  studentProgress,
  nextLevel,
  currentRank,
  studentCount,
  studentHistory,
  onOpenExams,
  onOpenProgress,
}: StudentDashboardTabProps) {
  const overview = useMemo(() => {
    const items = normalizeExamOverview({ selectedExam, studentHistory });
    return items.map((item, index) => ({
      ...item,
      ...examAccentPalette[index % examAccentPalette.length],
      ...formatExamDate(item.date),
    }));
  }, [selectedExam, studentHistory]);

  const progressSeries = useMemo(() => {
    const recentValues = studentHistory
      .slice(0, 6)
      .reverse()
      .map((item) => Math.max(0, Math.min(100, item.percentage)));

    const values = recentValues.length === 0 ? [0] : recentValues;

    const points = values.map((value, index) => ({
      label: `#${index + 1}`,
      value,
    }));

    const latest = points[points.length - 1]?.value ?? 0;
    const previous = points[points.length - 2]?.value ?? latest;

    return {
      hasData: recentValues.length > 0,
      points,
      latest,
      delta: latest - previous,
      linePath: buildLinePath(values),
      areaPath: buildAreaPath(values),
    };
  }, [studentHistory]);

  const summaryStats = useMemo(() => {
    if (studentHistory.length === 0) return null;
    const total = studentHistory.length;
    const totalPercent = studentHistory.reduce(
      (sum, item) => sum + item.percentage,
      0,
    );
    const average = Math.round(totalPercent / Math.max(total, 1));
    const best = Math.max(...studentHistory.map((item) => item.percentage));
    const latest = studentHistory.reduce((prev, next) =>
      new Date(next.date).getTime() > new Date(prev.date).getTime()
        ? next
        : prev,
    );
    return {
      total,
      average,
      best,
      latestTitle: latest.title,
      latestDate: new Date(latest.date).toLocaleDateString("mn-MN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    };
  }, [studentHistory]);

  const streak = useMemo(() => {
    const historyDays = new Set(
      studentHistory
        .map((item) => toDayKey(item.date))
        .filter((value) => value.length > 0),
    );

    const sortedDays = [...historyDays].sort((left, right) =>
      right.localeCompare(left),
    );

    let days = 0;
    for (let index = 0; index < sortedDays.length; index += 1) {
      if (index === 0) {
        days = 1;
        continue;
      }

      const prev = new Date(sortedDays[index - 1]);
      const current = new Date(sortedDays[index]);
      const diff = Math.round(
        (prev.getTime() - current.getTime()) / 86400000,
      );

      if (diff === 1) {
        days += 1;
      } else {
        break;
      }
    }

    const week = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return historyDays.has(toDayKey(date));
    });

    return {
      days,
      week,
    };
  }, [studentHistory]);

  const xpToNext = Math.max(nextLevel.minXP - studentProgress.xp, 0);
  const firstName = getFirstName(currentUserName);

  return (
    <div className="space-y-5">
      <StudentDashboardHero
        firstName={firstName}
        currentRank={currentRank}
        studentCount={studentCount}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.85fr)_minmax(320px,0.85fr)]">
        <StudentUpcomingExamsPanel
          loading={loading}
          overview={overview}
          onOpenExams={onOpenExams}
        />
        <StudentSummaryPanel summaryStats={summaryStats} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.85fr)_minmax(320px,0.85fr)]">
        <StudentProgressPanel
          progressSeries={progressSeries}
          onOpenProgress={onOpenProgress}
        />
        <StudentStreakPanel
          streakDays={streak.days}
          weekLabels={weekLabels}
          weekActive={streak.week}
          xpToNext={xpToNext}
          nextLevel={levelInfo.level + (xpToNext > 0 ? 1 : 0)}
        />
      </section>
    </div>
  );
}
