import {
  LEVELS,
  calculateXP,
  getLevel,
  type StudentProgress,
  type User,
} from "@/lib/examGuard";
import type {
  CheatStudent,
  Exam,
  ExamStatsSummary,
  Submission,
  TeacherStat,
  XpLeaderboardEntry,
} from "./types";

const violationKeys = [
  "tabSwitch",
  "windowBlur",
  "copyAttempt",
  "pasteAttempt",
  "fullscreenExit",
  "keyboardShortcut",
] as const;

const violationLabels: Record<(typeof violationKeys)[number], string> = {
  tabSwitch: "Tab солисон",
  windowBlur: "Window blur",
  copyAttempt: "Copy оролдлого",
  pasteAttempt: "Paste оролдлого",
  fullscreenExit: "Fullscreen гарсан",
  keyboardShortcut: "Shortcut дарсан",
};

type RawSubmission = Partial<Submission> & {
  studentНэр?: string;
  violations?: Partial<
    NonNullable<Submission["violations"]> & {
      log?: unknown[];
    }
  >;
};

export const normalizeSubmission = (item: RawSubmission): Submission | null => {
  if (!item.id || !item.examId || !item.studentId) return null;

  return {
    id: item.id,
    examId: item.examId,
    studentId: item.studentId,
    studentName: item.studentName ?? item.studentНэр ?? "Сурагч",
    answers:
      item.answers?.map((answer) => ({
        questionId: answer.questionId,
        selectedAnswer: answer.selectedAnswer,
        correct: Boolean(answer.correct),
      })) ?? [],
    score: Number(item.score ?? 0),
    totalPoints: Number(item.totalPoints ?? 0),
    percentage: Number(item.percentage ?? 0),
    terminated: Boolean(item.terminated),
    terminationReason: item.terminationReason,
    violations: {
      tabSwitch: Number(item.violations?.tabSwitch ?? 0),
      windowBlur: Number(item.violations?.windowBlur ?? 0),
      copyAttempt: Number(item.violations?.copyAttempt ?? 0),
      pasteAttempt: Number(item.violations?.pasteAttempt ?? 0),
      fullscreenExit: Number(item.violations?.fullscreenExit ?? 0),
      keyboardShortcut: Number(item.violations?.keyboardShortcut ?? 0),
    },
    submittedAt: item.submittedAt ?? new Date().toISOString(),
  };
};

export const buildTeacherOverviewStats = (params: {
  exams: Exam[];
  submissions: Submission[];
  xpLeaderboard: XpLeaderboardEntry[];
}): TeacherStat[] => {
  const { exams, submissions, xpLeaderboard } = params;
  const savedExams = exams.filter((exam) => exam.questions.length > 0).length;
  const scheduledExams = exams.filter((exam) => Boolean(exam.scheduledAt)).length;
  const totalXp = xpLeaderboard.reduce((sum, student) => sum + student.xp, 0);
  const flaggedCount = submissions.filter((submission) =>
    violationKeys.some((key) => Number(submission.violations?.[key] ?? 0) > 0),
  ).length;

  return [
    {
      label: "Хадгалсан сан",
      value: savedExams.toString(),
      trend: `${Math.max(exams.length - savedExams, 0)} нь зөвхөн товлолт`,
      tone: "primary",
    },
    {
      label: "Товлогдсон шалгалт",
      value: scheduledExams.toString(),
      trend: `${exams.length} өрөөнөөс ${scheduledExams} нь хуваарьтай`,
      tone: "success",
    },
    {
      label: "Ирсэн дүн",
      value: submissions.length.toString(),
      trend: `${flaggedCount} нь cheat flag авсан`,
      tone: "warning",
    },
    {
      label: "Цугларсан XP",
      value: totalXp.toString(),
      trend: `${xpLeaderboard.length} сурагч level-up хийж байна`,
      tone: "neutral",
    },
  ];
};

export const buildXpLeaderboard = (params: {
  progress: StudentProgress;
  submissions: Submission[];
  users: User[];
}): XpLeaderboardEntry[] => {
  const { progress, submissions, users } = params;
  const userNameMap = new Map(
    users
      .filter((user) => user.role === "student")
      .map((user) => [user.id, user.username]),
  );

  const studentIds = new Set<string>([
    ...Object.keys(progress),
    ...submissions.map((submission) => submission.studentId),
  ]);

  return [...studentIds]
    .map((studentId) => {
      const history = progress[studentId]?.history ?? [];
      const fallbackXp = submissions
        .filter((submission) => submission.studentId === studentId)
        .reduce(
          (sum, submission) =>
            sum +
            (submission.terminated ? 0 : calculateXP(submission.percentage)),
          0,
        );
      const xp = progress[studentId]?.xp ?? fallbackXp;
      const levelInfo = getLevel(xp);
      const nextLevel = LEVELS.find((level) => level.level === levelInfo.level + 1);
      const span = Math.max((nextLevel?.minXP ?? levelInfo.minXP) - levelInfo.minXP, 1);
      const progressPercent = nextLevel
        ? Math.min(100, Math.max(0, Math.round(((xp - levelInfo.minXP) / span) * 100)))
        : 100;
      const lastSubmission = submissions.find(
        (submission) => submission.studentId === studentId,
      );

      return {
        studentId,
        name:
          userNameMap.get(studentId) ??
          lastSubmission?.studentName ??
          `Сурагч ${studentId.slice(-4)}`,
        xp,
        level: levelInfo.level,
        levelName: levelInfo.name,
        icon: levelInfo.icon,
        examsTaken: history.length || submissions.filter((item) => item.studentId === studentId).length,
        progressPercent,
        nextLevelXp: nextLevel ? Math.max(nextLevel.minXP - xp, 0) : 0,
        lastActivity: history[0]?.date ?? lastSubmission?.submittedAt ?? null,
      };
    })
    .sort((left, right) => {
      if (right.xp !== left.xp) return right.xp - left.xp;
      if (right.examsTaken !== left.examsTaken) return right.examsTaken - left.examsTaken;
      return left.name.localeCompare(right.name, "mn");
    });
};

export const buildCheatStudents = (params: {
  submissions: Submission[];
  exams: Exam[];
}): CheatStudent[] => {
  const { submissions, exams } = params;
  const examTitleMap = new Map(exams.map((exam) => [exam.id, exam.title]));

  const flaggedStudents = submissions
    .map<CheatStudent | null>((submission) => {
      const events = violationKeys.reduce(
        (sum, key) => sum + Number(submission.violations?.[key] ?? 0),
        0,
      );
      if (events === 0) return null;

      const dominantKey = violationKeys.reduce((current, key) => {
        const currentValue = Number(submission.violations?.[current] ?? 0);
        const nextValue = Number(submission.violations?.[key] ?? 0);
        return nextValue > currentValue ? key : current;
      }, violationKeys[0]);

      return {
        studentId: submission.studentId,
        name: submission.studentName,
        score: submission.percentage,
        cheat: events >= 6 ? "Өндөр" : events >= 3 ? "Дунд" : "Бага",
        examTitle: examTitleMap.get(submission.examId) ?? "Шалгалт",
        events,
        reason: violationLabels[dominantKey],
      };
    });

  return flaggedStudents
    .filter((student) => student !== null)
    .sort((left, right) => {
      const rightEvents = right?.events ?? 0;
      const leftEvents = left?.events ?? 0;
      if (rightEvents !== leftEvents) return rightEvents - leftEvents;
      return (left?.score ?? 0) - (right?.score ?? 0);
    })
    .slice(0, 5);
};

export const buildExamStats = (params: {
  activeExam: Exam | null;
  activeSubmissions: Submission[];
}): ExamStatsSummary | null => {
  const { activeExam, activeSubmissions } = params;
  if (!activeExam) return null;

  const submissionCount = activeSubmissions.length;
  const totalPoints = activeExam.questions.length || 1;
  const average =
    activeSubmissions.reduce((sum, submission) => sum + submission.percentage, 0) /
    Math.max(submissionCount, 1);
  const passRate =
    (activeSubmissions.filter((submission) => submission.percentage >= 60).length /
      Math.max(submissionCount, 1)) *
    100;

  const questionStats = activeExam.questions
    .map((question) => {
      const correctCount = activeSubmissions.reduce((sum, submission) => {
        const answer = submission.answers?.find((item) => item.questionId === question.id);
        return sum + (answer?.correct ? 1 : 0);
      }, 0);

      return {
        id: question.id,
        text: question.text,
        correctCount,
        total: submissionCount,
        correctRate:
          submissionCount > 0 ? Math.round((correctCount / submissionCount) * 100) : 0,
        missCount: Math.max(submissionCount - correctCount, 0),
      };
    })
    .filter((question) => question.total > 0);

  const scoreDistribution = activeSubmissions.map((submission) => ({
    name: submission.studentName,
    score: Math.round((submission.score / totalPoints) * 100),
  }));

  return {
    average: Math.round(average),
    passRate: Math.round(passRate),
    submissionCount,
    totalPoints,
    mostMissed: [...questionStats]
      .sort((left, right) => {
        if (right.missCount !== left.missCount) return right.missCount - left.missCount;
        return left.correctRate - right.correctRate;
      })
      .slice(0, 5),
    mostCorrect: [...questionStats]
      .sort((left, right) => {
        if (right.correctRate !== left.correctRate) return right.correctRate - left.correctRate;
        return left.missCount - right.missCount;
      })
      .slice(0, 5),
    scoreDistribution,
    correctTotal: activeSubmissions.reduce((sum, submission) => sum + submission.score, 0),
    incorrectTotal: activeSubmissions.reduce(
      (sum, submission) => sum + Math.max(totalPoints - submission.score, 0),
      0,
    ),
    performanceBands: [
      {
        label: "90-100%",
        count: activeSubmissions.filter((submission) => submission.percentage >= 90).length,
        color: "#4f46e5",
      },
      {
        label: "75-89%",
        count: activeSubmissions.filter(
          (submission) => submission.percentage >= 75 && submission.percentage < 90,
        ).length,
        color: "#0f766e",
      },
      {
        label: "60-74%",
        count: activeSubmissions.filter(
          (submission) => submission.percentage >= 60 && submission.percentage < 75,
        ).length,
        color: "#d97706",
      },
      {
        label: "0-59%",
        count: activeSubmissions.filter((submission) => submission.percentage < 60).length,
        color: "#dc2626",
      },
    ],
  };
};
