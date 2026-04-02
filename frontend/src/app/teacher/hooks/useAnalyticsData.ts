import { useEffect, useMemo, useState } from "react";
import type { Exam, QuestionInsight, XpLeaderboardEntry } from "../types";
import {
  fetchExamAnalyticsSummary,
  fetchExamQuestionInsights,
  fetchTeacherOverview,
  fetchXpLeaderboard,
} from "./teacher-api";

const ANALYTICS_LOADING_MIN_MS = 1500;

type MonthlyPoint = {
  month: string;
  avgScore: number | null;
  passRate: number | null;
  count: number;
};

type AnalyticsOverview = {
  totalClasses: number;
  totalStudents: number;
  weeklySubmissions: number;
  totalSubmissions: number;
  monthlyData: MonthlyPoint[];
};

type LatestExamAnalytics = {
  examId: string;
  examTitle: string;
  averageScore: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  passRate: number;
  totalStudents: number;
  flaggedCount: number;
  mostMissed: QuestionInsight[];
  mostCorrect: QuestionInsight[];
};

type TeacherAnalyticsData = {
  overview: AnalyticsOverview | null;
  xpLeaderboard: XpLeaderboardEntry[];
  latestExam: LatestExamAnalytics | null;
};

const emptyAnalyticsData: TeacherAnalyticsData = {
  overview: null,
  xpLeaderboard: [],
  latestExam: null,
};

const isAnalyticsCandidate = (exam: Exam) => {
  const submissionCount = Number(exam.submissionCount ?? 0);
  const hasFinishedMarker = Boolean(exam.finishedAt);
  const status = String(exam.status ?? "").toLowerCase();

  return (
    submissionCount > 0 ||
    hasFinishedMarker ||
    status === "finished" ||
    status === "active" ||
    status === "completed" ||
    status === "graded"
  );
};

const getExamSortKey = (exam: Exam) =>
  exam.finishedAt ?? exam.examStartedAt ?? exam.scheduledAt ?? exam.createdAt;

export const useAnalyticsData = (teacherId: string | null, exams: Exam[]) => {
  const [data, setData] = useState<TeacherAnalyticsData>(emptyAnalyticsData);
  const [loading, setLoading] = useState(Boolean(teacherId));

  const latestExam = useMemo(
    () =>
      [...exams]
        .filter(isAnalyticsCandidate)
        .sort((left, right) =>
          getExamSortKey(right).localeCompare(getExamSortKey(left)),
        )[0] ?? null,
    [exams],
  );

  useEffect(() => {
    if (!teacherId) {
      setData(emptyAnalyticsData);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      const startedAt = Date.now();
      setLoading(true);

      try {
        const [overviewResult, xpLeaderboardResult] = await Promise.allSettled([
          fetchTeacherOverview(teacherId),
          fetchXpLeaderboard(),
        ]);

        const overview =
          overviewResult.status === "fulfilled" ? overviewResult.value : null;
        const xpLeaderboard =
          xpLeaderboardResult.status === "fulfilled"
            ? xpLeaderboardResult.value
            : [];

        let latestExamAnalytics: LatestExamAnalytics | null = null;

        if (latestExam?.id) {
          const [summaryResult, insightsResult] = await Promise.allSettled([
            fetchExamAnalyticsSummary(latestExam.id, teacherId),
            fetchExamQuestionInsights(latestExam.id, teacherId),
          ]);
          const summary =
            summaryResult.status === "fulfilled" ? summaryResult.value : null;
          const insights =
            insightsResult.status === "fulfilled" ? insightsResult.value : null;

          if (summary || insights) {
            latestExamAnalytics = {
              examId: latestExam.id,
              examTitle: latestExam.title,
              averageScore: summary?.averageScore ?? null,
              highestScore: summary?.highestScore ?? null,
              lowestScore: summary?.lowestScore ?? null,
              passRate: summary?.passRate ?? 0,
              totalStudents: summary?.totalStudents ?? 0,
              flaggedCount: summary?.flaggedCount ?? 0,
              mostMissed: insights?.mostMissed ?? [],
              mostCorrect: insights?.mostCorrect ?? [],
            };
          }
        }

        if (cancelled) return;

        setData({
          overview,
          xpLeaderboard,
          latestExam: latestExamAnalytics,
        });
      } catch {
        if (cancelled) return;
        setData(emptyAnalyticsData);
      } finally {
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(ANALYTICS_LOADING_MIN_MS - elapsed, 0);
        if (remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [teacherId, latestExam?.id, latestExam?.title]);

  return { data, loading };
};
