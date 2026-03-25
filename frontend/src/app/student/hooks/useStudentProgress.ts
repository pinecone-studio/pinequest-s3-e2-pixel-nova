import { useEffect, useMemo, useState } from "react";
import { getLevel, LEVELS } from "@/lib/examGuard";
import type { StudentProgress } from "../types";
import type { User } from "@/lib/examGuard";
import { gradeFromPercentage } from "../utils";
import { apiFetch, unwrapApi } from "@/lib/api-client";
import { getStudentResults } from "@/lib/backend-auth";

export const useStudentProgress = (currentUser: User | null) => {
  const [studentHistory, setStudentHistory] = useState<
    StudentProgress[string]["history"]
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
        const xpPayload = await apiFetch<
          { data?: { xp: number; level: number | { level: number } } } | {
            xp: number;
            level: number | { level: number };
          }
        >("/api/xp/profile");
        const xpData = unwrapApi(xpPayload);
        const levelValue =
          typeof xpData.level === "object"
            ? xpData.level.level
            : xpData.level;
        setStudentProgress({
          xp: xpData.xp,
          level: levelValue ?? 1,
          history: [],
        });
      } catch {
        setStudentProgress({ xp: 0, level: 1, history: [] });
      }

      try {
        const results = await getStudentResults();
        const history = results.map((item) => {
          const percentage = item.score ?? 0;
          return {
            examId: item.examId,
            percentage,
            xp: 0,
            date: item.submittedAt ?? new Date().toISOString(),
            score: item.score ?? 0,
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
    studentProgress,
    levelInfo,
    nextLevel,
    progressSegments,
  };
};
