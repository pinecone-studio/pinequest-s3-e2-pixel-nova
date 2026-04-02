import { useCallback, useEffect, useMemo, useState } from "react";
import { getLevel, LEVELS } from "@/lib/examGuard";
import type { StudentProgress } from "../types";
import type { User } from "@/lib/examGuard";
import { gradeFromPercentage } from "../utils";
import {
  getStudentResult,
  getStudentResults,
  getStudentTermRank,
  getStudentTermLeaderboard,
} from "@/lib/backend-auth";
import {
  getXpHistory,
  getXpProfile,
  type XpActivity,
  type XpLeaderboardEntry,
} from "@/api/xp";
import {
  average,
  buildBackendSubjectInsightDetail,
  type SubjectInsightDetail,
  toSubjectLabel,
} from "../components/student-progress-insights";

export const useStudentProgress = (currentUser: User | null) => {
  const [studentHistory, setStudentHistory] = useState<
    StudentProgress[string]["history"]
  >([]);
  const [subjectInsights, setSubjectInsights] = useState<
    Record<string, SubjectInsightDetail>
  >({});
  const [xpActivities, setXpActivities] = useState<XpActivity[]>([]);
  const [termLeaderboardEntries, setTermLeaderboardEntries] = useState<
    XpLeaderboardEntry[]
  >([]);
  const [rankOverview, setRankOverview] = useState({
    rank: null as number | null,
    totalStudents: 0,
  });
  const [termRankOverview, setTermRankOverview] = useState({
    rank: null as number | null,
    totalStudents: 0,
    xp: 0,
    level: 1,
  });
  const [studentProgress, setStudentProgress] = useState({
    xp: 0,
    level: 1,
    history: [],
  });

  const refreshProgress = useCallback(async () => {
    if (!currentUser) {
      setStudentHistory([]);
      setSubjectInsights({});
      setXpActivities([]);
      setTermLeaderboardEntries([]);
      setRankOverview({ rank: null, totalStudents: 0 });
      setTermRankOverview({
        rank: null,
        totalStudents: 0,
        xp: 0,
        level: 1,
      });
      setStudentProgress({ xp: 0, level: 1, history: [] });
      return;
    }

    try {
      const xpData = await getXpProfile(currentUser);
      setStudentProgress({
        xp: xpData.xp,
        level: xpData.level ?? 1,
        history: [],
      });
      setRankOverview({
        rank: xpData.rank ?? null,
        totalStudents: xpData.totalStudents ?? 0,
      });
    } catch {
      setStudentProgress({ xp: 0, level: 1, history: [] });
      setRankOverview({ rank: null, totalStudents: 0 });
    }

    try {
      setXpActivities(await getXpHistory(currentUser));
    } catch {
      setXpActivities([]);
    }

    try {
      setTermLeaderboardEntries(await getStudentTermLeaderboard(currentUser));
    } catch {
      setTermLeaderboardEntries([]);
    }

    try {
      const termRank = await getStudentTermRank(currentUser);
      setTermRankOverview({
        rank: termRank.rank ?? null,
        totalStudents: termRank.totalStudents ?? 0,
        xp: termRank.xp ?? 0,
        level: termRank.level ?? 1,
      });
    } catch {
      setTermRankOverview({
        rank: null,
        totalStudents: 0,
        xp: 0,
        level: 1,
      });
    }

    try {
      const results = await getStudentResults(currentUser);
      const history = results.map((item) => {
        const percentage = item.score ?? 0;
        return {
          examId: item.examId,
          title: item.title,
          percentage,
          xp: 0,
          date: item.submittedAt ?? new Date().toISOString(),
          score: item.earnedPoints ?? 0,
          totalPoints: item.totalPoints ?? 0,
          grade: gradeFromPercentage(percentage),
        };
      });
      setStudentHistory(history.sort((a, b) => b.date.localeCompare(a.date)));

      const details = await Promise.all(
        results.map(async (item) => {
          try {
            const detail = await getStudentResult(item.sessionId, currentUser);
            return {
              title: item.title,
              score: item.score ?? 0,
              detail,
            };
          } catch {
            return null;
          }
        }),
      );

      const grouped = new Map<
        string,
        {
          percentages: number[];
          answers: NonNullable<(typeof details)[number]>["detail"]["answers"];
        }
      >();

      details.forEach((item) => {
        if (!item) return;
        const subject = toSubjectLabel(item.title);
        const current = grouped.get(subject) ?? { percentages: [], answers: [] };
        grouped.set(subject, {
          percentages: [...current.percentages, item.score],
          answers: [
            ...current.answers,
            ...item.detail.answers.map((answer) => ({
              ...answer,
              sessionId: item.detail.sessionId,
              examTitle: item.detail.title,
              submittedAt: item.detail.submittedAt ?? item.submittedAt ?? null,
            })),
          ],
        });
      });

      const nextSubjectInsights = Object.fromEntries(
        [...grouped.entries()].map(([subject, value]) => [
          subject,
          buildBackendSubjectInsightDetail(
            subject,
            average(value.percentages),
            value.answers,
          ),
        ]),
      );

      setSubjectInsights(nextSubjectInsights);
    } catch {
      setStudentHistory([]);
      setSubjectInsights({});
    }
  }, [currentUser]);

  useEffect(() => {
    void refreshProgress();
  }, [refreshProgress]);

  const levelInfo = useMemo(
    () => getLevel(studentProgress.xp),
    [studentProgress.xp],
  );
  const nextLevel = useMemo(() => {
    const next = LEVELS.find((lvl) => lvl.level === levelInfo.level + 1);
    return next ?? levelInfo;
  }, [levelInfo]);
  const progressSegments = useMemo(() => {
    const total = nextLevel.minXP - levelInfo.minXP || 1;
    const current = Math.max(studentProgress.xp - levelInfo.minXP, 0);
    return Math.min(10, Math.max(0, Math.round((current / total) * 10)));
  }, [studentProgress.xp, levelInfo, nextLevel]);

  return {
    studentHistory,
    subjectInsights,
    xpActivities,
    termLeaderboardEntries,
    rankOverview,
    termRankOverview,
    studentProgress,
    levelInfo,
    nextLevel,
    progressSegments,
    refreshProgress,
  };
};
