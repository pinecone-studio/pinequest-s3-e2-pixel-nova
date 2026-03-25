import { useMemo } from "react";
import { calculateXP, getJSON, getLevel, LEVELS } from "@/lib/examGuard";
import type { StudentProgress, Submission } from "../types";
import type { User } from "@/lib/examGuard";
import { gradeFromPercentage } from "../utils";

export const useStudentProgress = (currentUser: User | null) => {
  const studentHistory = useMemo(() => {
    if (!currentUser) return [] as StudentProgress[string]["history"];
    const progress = getJSON<StudentProgress>("studentProgress", {});
    const storedHistory = progress[currentUser.id]?.history ?? [];
    const submissions = getJSON<Submission[]>("submissions", []).filter(
      (item) => item.studentId === currentUser.id,
    );
    const submissionHistory = submissions.map((item) => {
      const percentage = item.percentage ?? 0;
      return {
        examId: item.examId,
        percentage,
        xp: calculateXP(percentage),
        date: item.submittedAt,
        score: item.score,
        totalPoints: item.totalPoints,
        grade: gradeFromPercentage(percentage),
      };
    });
    const merged = [...submissionHistory, ...storedHistory];
    const unique = new Map<string, StudentProgress[string]["history"][number]>();
    merged.forEach((entry) => {
      const key = `${entry.examId}-${entry.date}`;
      if (!unique.has(key)) unique.set(key, entry);
    });
    return Array.from(unique.values()).sort((a, b) =>
      b.date.localeCompare(a.date),
    );
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
