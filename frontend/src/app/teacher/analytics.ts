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
import {
  buildPerformanceBands,
  violationKeys,
  violationLabels,
} from "./teacher-analytics-helpers";

const cheatTypeLabels: Record<string, string> = {
  tab_switch: "Таб сольсон",
  tab_hidden: "Бүтэн дэлгэцээс гарсан",
  window_blur: "Цонхноос гарсан",
  copy_paste: "Хуулах эсвэл буулгах оролдлого",
  right_click: "Баруун товшилт",
  screen_capture: "Дэлгэцийн зураг авалт",
  devtools_open: "Developer tools нээх оролдлого",
  multiple_monitors: "Олон дэлгэц ашигласан",
  suspicious_resize: "Сэжигтэй хэмжээс өөрчлөлт",
  rapid_answers: "Хэт хурдан хариулсан",
  idle_too_long: "Хэт удаан идэвхгүй байсан",
  face_missing: "Нүүр илрээгүй",
  multiple_faces: "Олон нүүр илэрсэн",
  looking_away: "Хажуу тийш харсан",
  looking_down: "Доош харсан",
  camera_blocked: "Камер хаагдсан",
  disqualification: "Шалгалтаас хасагдсан",
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
    isFlagged: Boolean(item.isFlagged),
    flagCount: Number(item.flagCount ?? 0),
    violationScore: Number(item.violationScore ?? 0),
    riskLevel: item.riskLevel ?? "low",
    lastViolationAt: item.lastViolationAt ?? null,
    topViolationType: item.topViolationType ?? null,
    eventCount: Number(item.eventCount ?? 0),
    latestEvent: item.latestEvent ?? null,
    countByType: item.countByType ?? {},
  };
};

export const buildTeacherOverviewStats = (params: {
  exams: Exam[];
  submissions: Submission[];
  xpLeaderboard: XpLeaderboardEntry[];
}): TeacherStat[] => {
  const { exams, submissions, xpLeaderboard } = params;
  const savedExams = exams.filter(
    (exam) => (exam.questionCount ?? exam.questions.length) > 0,
  ).length;
  const scheduledExams = exams.filter((exam) => Boolean(exam.scheduledAt)).length;
  const totalXp = xpLeaderboard.reduce((sum, student) => sum + student.xp, 0);
  const flaggedCount = submissions.filter((submission) =>
    (submission.riskLevel ?? "low") !== "low" ||
    Number(submission.eventCount ?? 0) > 0 ||
    violationKeys.some((key) => Number(submission.violations?.[key] ?? 0) > 0),
  ).length;

  return [
    {
      label: "Хадгалсан сан",
      value: savedExams.toString(),
      trend: `${Math.max(exams.length - savedExams, 0)} нь зөвхөн төлөвлөлт`,
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
  progress?: StudentProgress;
  submissions: Submission[];
  users?: User[];
}): XpLeaderboardEntry[] => {
  const { progress = {}, submissions, users } = params;
  const userNameMap = new Map(
    (users ?? [])
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
      const span = Math.max(
        (nextLevel?.minXP ?? levelInfo.minXP) - levelInfo.minXP,
        1,
      );
      const progressPercent = nextLevel
        ? Math.min(
            100,
            Math.max(0, Math.round(((xp - levelInfo.minXP) / span) * 100)),
          )
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
        examsTaken:
          history.length ||
          submissions.filter((item) => item.studentId === studentId).length,
        progressPercent,
        nextLevelXp: nextLevel ? Math.max(nextLevel.minXP - xp, 0) : 0,
        lastActivity: history[0]?.date ?? lastSubmission?.submittedAt ?? null,
      };
    })
    .sort((left, right) => {
      if (right.xp !== left.xp) return right.xp - left.xp;
      if (right.examsTaken !== left.examsTaken) {
        return right.examsTaken - left.examsTaken;
      }
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
      const legacyEvents = violationKeys.reduce(
        (sum, key) => sum + Number(submission.violations?.[key] ?? 0),
        0,
      );
      const totalEvents = Math.max(legacyEvents, Number(submission.eventCount ?? 0));
      if (totalEvents === 0) return null;

      const dominantKey = violationKeys.reduce((current, key) => {
        const currentValue = Number(submission.violations?.[current] ?? 0);
        const nextValue = Number(submission.violations?.[key] ?? 0);
        return nextValue > currentValue ? key : current;
      }, violationKeys[0]);

      return {
        studentId: submission.studentId,
        sessionId: submission.id,
        name: submission.studentName,
        score: submission.percentage,
        cheat:
          (submission.riskLevel ?? "low") === "critical" ||
          (submission.riskLevel ?? "low") === "high"
            ? "Өндөр"
            : (submission.riskLevel ?? "low") === "medium" || totalEvents >= 3
              ? "Дунд"
              : "Бага",
        examTitle: examTitleMap.get(submission.examId) ?? "Шалгалт",
        events: totalEvents,
        reason:
          submission.latestEvent?.label ??
          (submission.topViolationType
            ? cheatTypeLabels[submission.topViolationType] ?? submission.topViolationType
            : violationLabels[dominantKey]),
        flagCount: submission.flagCount,
        violationScore: submission.violationScore,
        riskLevel: submission.riskLevel,
        lastViolationAt: submission.lastViolationAt ?? null,
        topViolationType: submission.topViolationType ?? null,
        latestEventLabel: submission.latestEvent?.label ?? null,
        countByType: submission.countByType ?? {},
      };
    })
    .filter((student) => student !== null)
    .sort((left, right) => {
      const rightEvents = right.events ?? 0;
      const leftEvents = left.events ?? 0;
      if (rightEvents !== leftEvents) return rightEvents - leftEvents;
      return (right.violationScore ?? 0) - (left.violationScore ?? 0);
    });

  return flaggedStudents.slice(0, 5);
};

export const buildExamStats = (params: {
  activeExam: Exam | null;
  activeSubmissions: Submission[];
}): ExamStatsSummary | null => {
  const { activeExam, activeSubmissions } = params;
  if (!activeExam) return null;

  const submissionCount = activeSubmissions.length;
  const expectedStudentsCount = Number(activeExam.expectedStudentsCount ?? 0);
  const cohortSize =
    expectedStudentsCount > 0
      ? Math.max(expectedStudentsCount, submissionCount)
      : Math.max(submissionCount, 1);
  const totalPoints =
    activeExam.questions.reduce((sum, question) => sum + (question.points ?? 1), 0) ||
    1;
  const average =
    activeSubmissions.reduce((sum, submission) => sum + submission.percentage, 0) /
    cohortSize;
  const passRate =
    (activeSubmissions.filter((submission) => submission.percentage >= 60).length /
      cohortSize) *
    100;

  const questionStats = activeExam.questions
    .map((question) => {
      const answers = activeSubmissions
        .map((submission) =>
          submission.answers?.find((item) => item.questionId === question.id),
        )
        .filter((answer) => answer !== undefined);

      const correctCount = answers.reduce(
        (sum, answer) => sum + (answer.correct ? 1 : 0),
        0,
      );
      const skippedCount = Math.max(submissionCount - answers.length, 0);

      const wrongAnswerCounts = new Map<string, number>();
      answers.forEach((answer) => {
        if (
          answer.correct ||
          !answer.selectedAnswer ||
          !answer.selectedAnswer.trim()
        ) {
          return;
        }
        const key = answer.selectedAnswer.trim();
        wrongAnswerCounts.set(key, (wrongAnswerCounts.get(key) ?? 0) + 1);
      });

      const [topWrongAnswer = null, topWrongAnswerCount = 0] =
        [...wrongAnswerCounts.entries()].sort((left, right) => {
          if (right[1] !== left[1]) return right[1] - left[1];
          return left[0].localeCompare(right[0]);
        })[0] ?? [];

      return {
        id: question.id,
        text: question.text,
        correctCount,
        total: submissionCount,
        correctRate:
          submissionCount > 0 ? Math.round((correctCount / submissionCount) * 100) : 0,
        missCount: Math.max(submissionCount - correctCount, 0),
        skippedCount,
        topWrongAnswer,
        topWrongAnswerCount,
      };
    })
    .filter((question) => question.total > 0);

  const scoreDistribution = activeSubmissions.map((submission) => {
    const basePoints = submission.totalPoints || totalPoints;
    return {
      name: submission.studentName,
      score: Math.round((submission.score / basePoints) * 100),
    };
  });

  return {
    average: Math.round(average),
    passRate: Math.round(passRate),
    submissionCount,
    cohortSize,
    absentCount: Math.max(cohortSize - submissionCount, 0),
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
    questionStats,
    scoreDistribution,
    correctTotal: activeSubmissions.reduce(
      (sum, submission) => sum + submission.score,
      0,
    ),
    incorrectTotal: activeSubmissions.reduce((sum, submission) => {
      const basePoints = submission.totalPoints || totalPoints;
      return sum + Math.max(basePoints - submission.score, 0);
    }, 0),
    performanceBands: buildPerformanceBands(activeSubmissions),
  };
};
