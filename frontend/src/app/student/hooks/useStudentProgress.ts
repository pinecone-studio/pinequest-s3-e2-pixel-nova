import { useMemo } from "react";
import { getJSON, getLevel, LEVELS } from "@/lib/examGuard";
import type { StudentProgress } from "../types";
import type { User } from "@/lib/examGuard";

export const useStudentProgress = (currentUser: User | null) => {
  const studentHistory = useMemo(() => {
    if (!currentUser) return [] as StudentProgress[string]["history"];
    const progress = getJSON<StudentProgress>("studentProgress", {});
    return progress[currentUser.id]?.history ?? [];
  }, [currentUser]);

  const studentProgress = useMemo(() => {
    if (!currentUser) return { xp: 0, level: 1, history: [] };
    const progress = getJSON<StudentProgress>("studentProgress", {});
    return progress[currentUser.id] ?? { xp: 0, level: 1, history: [] };
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
