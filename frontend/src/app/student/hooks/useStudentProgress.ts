import { useEffect, useMemo, useState } from "react";
import { getLevel, LEVELS } from "@/lib/examGuard";
import type { StudentProgress } from "../types";
import type { User } from "@/lib/examGuard";
import { gradeFromPercentage } from "../utils";
import {
  getStudentImprovementLeaderboard,
  getStudentResults,
  getStudentProgressLeaderboard,
  type StudentImprovementLeaderboardEntry,
  getStudentTermRank,
  type StudentProgressLeaderboardEntry,
  type StudentTermRankOverview,
} from "@/lib/backend-auth";
import {
  getXpHistory,
  getXpLeaderboard,
  getXpProfile,
  type XpActivity,
  type XpLeaderboardEntry,
} from "@/api/xp";

export const useStudentProgress = (currentUser: User | null) => {
  const [studentHistory, setStudentHistory] = useState<
    StudentProgress[string]["history"]
  >([]);
  const [xpActivities, setXpActivities] = useState<XpActivity[]>([]);
  const [leaderboardEntries, setLeaderboardEntries] = useState<XpLeaderboardEntry[]>([]);
  const [rankOverview, setRankOverview] = useState({
    rank: null as number | null,
    totalStudents: 0,
  });
  const [termRankOverview, setTermRankOverview] = useState<StudentTermRankOverview>({
    rank: null,
    totalStudents: 0,
    termExamCount: 0,
  });
  const [progressLeaderboard, setProgressLeaderboard] = useState<
    StudentProgressLeaderboardEntry[]
  >([]);
  const [improvementLeaderboard, setImprovementLeaderboard] = useState<
    StudentImprovementLeaderboardEntry[]
  >([]);
  const [studentProgress, setStudentProgress] = useState({
    xp: 0,
    level: 1,
    history: [],
  });

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
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
        setLeaderboardEntries(await getXpLeaderboard(currentUser));
      } catch {
        setLeaderboardEntries([]);
      }

      try {
        const results = await getStudentResults(currentUser);
        const history = results.map((item) => {
          const percentage = item.score ?? 0;
          return {
            examId: item.examId,
            percentage,
            xp: 0,
            date: item.submittedAt ?? new Date().toISOString(),
            score: item.earnedPoints ?? 0,
            totalPoints: item.totalPoints ?? 0,
            grade: gradeFromPercentage(percentage),
          };
        });
        setStudentHistory(
          history.sort((a, b) => b.date.localeCompare(a.date)),
        );
      } catch {
        setStudentHistory([]);
      }

      try {
        setTermRankOverview(await getStudentTermRank(currentUser));
      } catch {
        setTermRankOverview({
          rank: null,
          totalStudents: 0,
          termExamCount: 0,
        });
      }

      try {
        setProgressLeaderboard(await getStudentProgressLeaderboard(currentUser));
      } catch {
        setProgressLeaderboard([]);
      }

      try {
        setImprovementLeaderboard(
          await getStudentImprovementLeaderboard(currentUser),
        );
      } catch {
        setImprovementLeaderboard([]);
      }
    };
    void load();
  }, [currentUser]);

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
    xpActivities,
    leaderboardEntries,
    rankOverview,
    termRankOverview,
    progressLeaderboard,
    improvementLeaderboard,
    studentProgress,
    levelInfo,
    nextLevel,
    progressSegments,
  };
};
