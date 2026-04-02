import { Hono } from "hono";
import { eq, and, desc, sql, count } from "drizzle-orm";
import {
  getDb,
  exams,
  examSessions,
  questions,
  studentAnswers,
  options,
  students,
} from "../db";
import type { AppEnv } from "../types";
import { success, notFound } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/role-guard";

const analyticsRoutes = new Hono<AppEnv>();

const normalizedScorePercent = sql<number | null>`
  case
    when ${examSessions.totalPoints} > 0 and ${examSessions.earnedPoints} is not null
      then ${examSessions.earnedPoints} * 100.0 / ${examSessions.totalPoints}
    when ${examSessions.totalPoints} > 0 and ${examSessions.score} > 100
      then ${examSessions.score} * 100.0 / ${examSessions.totalPoints}
    else ${examSessions.score}
  end
`;

// Apply auth + teacher role globally
analyticsRoutes.use("*", authMiddleware, requireRole("teacher"));

const buildFallbackInsight = (params: {
  weakestQuestionText: string | null;
  weakestCorrectRate: number | null;
  weakestExamTitle: string | null;
  highRiskCount: number;
  totalStudents: number;
}) => {
  const {
    weakestQuestionText,
    weakestCorrectRate,
    weakestExamTitle,
    highRiskCount,
    totalStudents,
  } = params;

  if (weakestQuestionText) {
    const topicLabel = weakestQuestionText.length > 84
      ? `${weakestQuestionText.slice(0, 84).trim()}...`
      : weakestQuestionText;
    return {
      title: "Гол анхаарах зүйл",
      summary: `${
        weakestExamTitle ? `"${weakestExamTitle}" шалгалтад ` : ""
      }"${topicLabel}" асуултын гүйцэтгэл хамгийн сул байна${
        typeof weakestCorrectRate === "number"
          ? ` (${weakestCorrectRate}% зөв)`
          : ""
      }. Энэ агуулгыг богино жишээ, давтлага даалгавраар бататгахыг зөвлөж байна.`,
      source: "fallback",
    };
  }

  if (highRiskCount > 0) {
    return {
      title: "Гол анхаарах зүйл",
      summary: `${totalStudents} сурагчийн дундаас ${highRiskCount} нь өндөр эрсдэлийн дохио өгсөн байна. Дүрэм, шалгалтын орчны зааврыг дахин тодруулж өгөх нь зүйтэй.`,
      source: "fallback",
    };
  }

  return {
    title: "Гол анхаарах зүйл",
    summary: "Сүүлийн өгөгдлөөс томоохон эрсдэл илрээгүй байна. Дараагийн алхам болгож дундаж оноо сул байгаа сэдвүүд дээр богино давтлага төлөвлөөрэй.",
    source: "fallback",
  };
};

const generateDashboardInsight = async (
  ai: Ai | undefined,
  params: {
    weakestQuestionText: string | null;
    weakestCorrectRate: number | null;
    weakestExamTitle: string | null;
    highRiskCount: number;
    totalStudents: number;
  },
) => {
  const fallback = buildFallbackInsight(params);

  if (!ai) {
    return fallback;
  }

  try {
    const response = await ai.run("@cf/meta/llama-3.1-8b-instruct" as any, {
      messages: [
        {
          role: "system",
          content:
            "You are an educational analytics assistant. Return JSON only with keys title and summary. Write in Mongolian. Keep summary under 320 characters and practical for a teacher.",
        },
        {
          role: "user",
          content: JSON.stringify({
            weakestQuestionText: params.weakestQuestionText,
            weakestCorrectRate: params.weakestCorrectRate,
            weakestExamTitle: params.weakestExamTitle,
            highRiskCount: params.highRiskCount,
            totalStudents: params.totalStudents,
          }),
        },
      ],
      max_tokens: 220,
      temperature: 0.2,
    });

    const text =
      typeof response === "string"
        ? response
        : typeof response === "object" && response !== null && "response" in response
          ? String((response as { response?: string }).response ?? "")
          : "";
    const normalized = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const start = normalized.indexOf("{");
    const end = normalized.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      return fallback;
    }
    const parsed = JSON.parse(normalized.slice(start, end + 1)) as {
      title?: string;
      summary?: string;
    };

    if (!parsed.summary?.trim()) {
      return fallback;
    }

    return {
      title: parsed.title?.trim() || fallback.title,
      summary: parsed.summary.trim(),
      source: "ai",
    };
  } catch {
    return fallback;
  }
};

// GET /dashboard — Teacher dashboard overview
analyticsRoutes.get("/dashboard", async (c) => {
  const user = c.get("user");
  const db = getDb(c.env.educore);

  // Count total exams by teacher
  const [totalExamsResult] = await db
    .select({ count: count() })
    .from(exams)
    .where(eq(exams.teacherId, user.id));
  const totalExams = totalExamsResult?.count ?? 0;

  // Count total unique students across their exams
  const [uniqueStudentsResult] = await db
    .select({ count: sql<number>`count(distinct ${examSessions.studentId})` })
    .from(examSessions)
    .innerJoin(exams, eq(examSessions.examId, exams.id))
    .where(eq(exams.teacherId, user.id));
  const totalStudents = uniqueStudentsResult?.count ?? 0;

  const [classCountResult] = await db
    .select({
      count: sql<number>`count(distinct nullif(trim(${exams.className}), ''))`,
    })
    .from(exams)
    .where(eq(exams.teacherId, user.id));
  const totalClasses = classCountResult?.count ?? 0;

  // Count active exams
  const [activeExamsResult] = await db
    .select({ count: count() })
    .from(exams)
    .where(
      and(
        eq(exams.teacherId, user.id),
        eq(exams.status, "active")
      )
    );
  const activeExams = activeExamsResult?.count ?? 0;

  const [submissionCountResult] = await db
    .select({ count: count() })
    .from(examSessions)
    .innerJoin(exams, eq(examSessions.examId, exams.id))
    .where(eq(exams.teacherId, user.id));
  const totalSubmissions = submissionCountResult?.count ?? 0;

  const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [lastSevenDaysResult] = await db
    .select({ count: count() })
    .from(examSessions)
    .innerJoin(exams, eq(examSessions.examId, exams.id))
    .where(
      and(
        eq(exams.teacherId, user.id),
        sql`coalesce(${examSessions.submittedAt}, ${examSessions.createdAt}) >= ${sevenDaysAgoIso}`,
      ),
    );
  const lastSevenDaysSubmissions = lastSevenDaysResult?.count ?? 0;

  // Get 5 most recent exams with student count and average score
  const recentExams = await db
    .select({
      id: exams.id,
      title: exams.title,
      status: exams.status,
      createdAt: exams.createdAt,
      studentCount: sql<number>`count(distinct ${examSessions.studentId})`,
      averageScore: sql<number | null>`avg(${normalizedScorePercent})`,
    })
    .from(exams)
    .leftJoin(examSessions, eq(exams.id, examSessions.examId))
    .where(eq(exams.teacherId, user.id))
    .groupBy(exams.id)
    .orderBy(desc(exams.createdAt))
    .limit(5);

  const formattedRecentExams = recentExams.map((exam) => ({
    id: exam.id,
    title: exam.title,
    status: exam.status,
    createdAt: exam.createdAt,
    studentCount: exam.studentCount,
    averageScore: exam.averageScore !== null ? Math.round(exam.averageScore * 100) / 100 : null,
  }));

  const teacherStudents = await db
    .select({
      studentId: students.id,
      fullName: students.fullName,
      xp: students.xp,
      level: students.level,
    })
    .from(examSessions)
    .innerJoin(exams, eq(examSessions.examId, exams.id))
    .innerJoin(students, eq(examSessions.studentId, students.id))
    .where(eq(exams.teacherId, user.id))
    .groupBy(students.id)
    .orderBy(desc(students.xp), students.fullName);

  const anonymizedXpLeaderboard = teacherStudents.slice(0, 3).map((student, index) => ({
    rank: index + 1,
    studentId: student.studentId,
    displayName: `Сурагч ${index + 1}`,
    xp: Number(student.xp ?? 0),
    level: Number(student.level ?? 1),
  }));

  const monthlyRows = await db
    .select({
      submittedAt: examSessions.submittedAt,
      createdAt: examSessions.createdAt,
      score: examSessions.score,
      totalPoints: examSessions.totalPoints,
      xp: students.xp,
    })
    .from(examSessions)
    .innerJoin(exams, eq(examSessions.examId, exams.id))
    .innerJoin(students, eq(examSessions.studentId, students.id))
    .where(eq(exams.teacherId, user.id));

  const monthlyMap = new Map<
    string,
    {
      label: string;
      scoreTotal: number;
      scoreCount: number;
      xpTotal: number;
      xpCount: number;
    }
  >();

  for (const row of monthlyRows) {
    const dateValue = row.submittedAt ?? row.createdAt;
    if (!dateValue) continue;
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) continue;
    const monthKey = `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("mn-MN", {
      month: "short",
      timeZone: "UTC",
    }).format(parsed);
    const bucket = monthlyMap.get(monthKey) ?? {
      label,
      scoreTotal: 0,
      scoreCount: 0,
      xpTotal: 0,
      xpCount: 0,
    };

    const rawScore = Number(row.score ?? 0);
    const totalPoints = Number(row.totalPoints ?? 0);
    const normalizedScore =
      totalPoints > 0
        ? Math.max(0, Math.min(100, Math.round((rawScore / totalPoints) * 100)))
        : Math.max(0, Math.min(100, Math.round(rawScore)));

    bucket.scoreTotal += normalizedScore;
    bucket.scoreCount += 1;
    bucket.xpTotal += Number(row.xp ?? 0);
    bucket.xpCount += 1;
    monthlyMap.set(monthKey, bucket);
  }

  const scoreTrend = [...monthlyMap.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .slice(-6)
    .map(([, bucket]) => ({
      label: bucket.label,
      averageScore:
        bucket.scoreCount > 0 ? Math.round(bucket.scoreTotal / bucket.scoreCount) : 0,
      averageXp: bucket.xpCount > 0 ? Math.round(bucket.xpTotal / bucket.xpCount) : 0,
    }));

  const weakestQuestionRows = await db
    .select({
      questionText: questions.questionText,
      examTitle: exams.title,
      correctCount: sql<number>`sum(case when ${studentAnswers.isCorrect} = 1 then 1 else 0 end)`,
      totalAnswers: count(studentAnswers.id),
    })
    .from(questions)
    .innerJoin(exams, eq(questions.examId, exams.id))
    .leftJoin(studentAnswers, eq(studentAnswers.questionId, questions.id))
    .leftJoin(examSessions, eq(studentAnswers.sessionId, examSessions.id))
    .where(eq(exams.teacherId, user.id))
    .groupBy(questions.id)
    .orderBy(
      sql`case when count(${studentAnswers.id}) > 0 then (cast(sum(case when ${studentAnswers.isCorrect} = 1 then 1 else 0 end) as real) / count(${studentAnswers.id})) else 1 end asc`,
      desc(questions.orderIndex),
    )
    .limit(1);

  const weakestQuestion = weakestQuestionRows[0];
  const weakestCorrectRate =
    weakestQuestion && Number(weakestQuestion.totalAnswers ?? 0) > 0
      ? Math.round(
          (Number(weakestQuestion.correctCount ?? 0) /
            Number(weakestQuestion.totalAnswers ?? 0)) *
            100,
        )
      : null;

  const [highRiskResult] = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(examSessions)
    .innerJoin(exams, eq(examSessions.examId, exams.id))
    .where(
      and(
        eq(exams.teacherId, user.id),
        sql`${examSessions.riskLevel} in ('high', 'critical')`,
      ),
    );

  const aiInsight = await generateDashboardInsight(c.env.AI, {
    weakestQuestionText: weakestQuestion?.questionText ?? null,
    weakestCorrectRate,
    weakestExamTitle: weakestQuestion?.examTitle ?? null,
    highRiskCount: Number(highRiskResult?.count ?? 0),
    totalStudents: Number(totalStudents ?? 0),
  });

  return success(c, {
    totalClasses,
    totalExams,
    totalStudents,
    activeExams,
    totalSubmissions,
    lastSevenDaysSubmissions,
    recentExams: formattedRecentExams,
    xpLeaderboard: anonymizedXpLeaderboard,
    scoreTrend,
    aiInsight,
  });
});

// GET /exam/:examId/questions — Most missed / most correct questions
analyticsRoutes.get("/exam/:examId/questions", async (c) => {
  const user = c.get("user");
  const examId = c.req.param("examId");
  const db = getDb(c.env.educore);

  // Verify exam belongs to teacher
  const [exam] = await db
    .select({ id: exams.id })
    .from(exams)
    .where(
      and(
        eq(exams.id, examId),
        eq(exams.teacherId, user.id)
      )
    )
    .limit(1);

  if (!exam) {
    return notFound(c, "Exam");
  }

  const [submissionRow] = await db
    .select({ count: count() })
    .from(examSessions)
    .where(
      and(
        eq(examSessions.examId, examId),
        eq(examSessions.status, "graded"),
      ),
    );

  const gradedSubmissionCount = submissionRow?.count ?? 0;

  const examQuestions = await db
    .select({
      id: questions.id,
      questionText: questions.questionText,
      orderIndex: questions.orderIndex,
    })
    .from(questions)
    .where(eq(questions.examId, examId))
    .orderBy(questions.orderIndex);

  const answers = await db
    .select({
      questionId: studentAnswers.questionId,
      textAnswer: studentAnswers.textAnswer,
      isCorrect: studentAnswers.isCorrect,
      selectedOptionText: options.text,
    })
    .from(studentAnswers)
    .innerJoin(
      examSessions,
      and(
        eq(studentAnswers.sessionId, examSessions.id),
        eq(examSessions.examId, examId),
        eq(examSessions.status, "graded"),
      ),
    )
    .leftJoin(options, eq(studentAnswers.selectedOptionId, options.id));

  const answersByQuestion = new Map<string, typeof answers>();
  for (const answer of answers) {
    const list = answersByQuestion.get(answer.questionId) ?? [];
    list.push(answer);
    answersByQuestion.set(answer.questionId, list);
  }

  const stats = examQuestions.map((question) => {
    const questionAnswers = answersByQuestion.get(question.id) ?? [];
    const correctCount = questionAnswers.reduce(
      (sum, answer) => sum + (answer.isCorrect ? 1 : 0),
      0,
    );
    const skippedCount = Math.max(
      gradedSubmissionCount - questionAnswers.length,
      0,
    );
    const missCount = Math.max(gradedSubmissionCount - correctCount, 0);

    const wrongAnswerCounts = new Map<string, number>();
    for (const answer of questionAnswers) {
      if (answer.isCorrect) continue;
      const value = (answer.selectedOptionText ?? answer.textAnswer ?? "").trim();
      if (!value) continue;
      wrongAnswerCounts.set(value, (wrongAnswerCounts.get(value) ?? 0) + 1);
    }

    const [topWrongAnswer = null, topWrongAnswerCount = 0] =
      [...wrongAnswerCounts.entries()].sort((left, right) => {
        if (right[1] !== left[1]) return right[1] - left[1];
        return left[0].localeCompare(right[0]);
      })[0] ?? [];

    return {
      id: question.id,
      text: question.questionText,
      correctCount,
      total: gradedSubmissionCount,
      correctRate:
        gradedSubmissionCount > 0
          ? Math.round((correctCount / gradedSubmissionCount) * 100)
          : 0,
      missCount,
      skippedCount,
      topWrongAnswer,
      topWrongAnswerCount,
    };
  });

  // Sort for most missed (highest incorrect count)
  const mostMissed = [...stats]
    .sort((a, b) => {
      if (b.missCount !== a.missCount) return b.missCount - a.missCount;
      return a.correctRate - b.correctRate;
    })
    .slice(0, 5);

  // Sort for most correct (highest correct count)
  const mostCorrect = [...stats]
    .sort((a, b) => {
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
      return a.missCount - b.missCount;
    })
    .slice(0, 5);

  return success(c, { questionStats: stats, mostMissed, mostCorrect });
});

// GET /exam/:examId/summary — Exam-level analytics
analyticsRoutes.get("/exam/:examId/summary", async (c) => {
  const user = c.get("user");
  const examId = c.req.param("examId");
  const db = getDb(c.env.educore);

  // Verify exam belongs to teacher
  const [exam] = await db
    .select({ id: exams.id, passScore: exams.passScore })
    .from(exams)
    .where(
      and(
        eq(exams.id, examId),
        eq(exams.teacherId, user.id)
      )
    )
    .limit(1);

  if (!exam) {
    return notFound(c, "Exam");
  }

  const passScore = exam.passScore ?? 50;

  // Get score statistics from graded sessions
  const [scoreStats] = await db
    .select({
      averageScore: sql<number | null>`avg(${normalizedScorePercent})`,
      highestScore: sql<number | null>`max(${normalizedScorePercent})`,
      lowestScore: sql<number | null>`min(${normalizedScorePercent})`,
      totalStudents: count(),
      passCount: sql<number>`sum(case when ${normalizedScorePercent} >= ${passScore} then 1 else 0 end)`,
      flaggedCount: sql<number>`sum(case when ${examSessions.isFlagged} = 1 then 1 else 0 end)`,
    })
    .from(examSessions)
    .where(
      and(
        eq(examSessions.examId, examId),
        eq(examSessions.status, "graded"),
        sql`${examSessions.score} IS NOT NULL`,
      )
    );

  const totalStudents = scoreStats?.totalStudents ?? 0;
  const passCount = scoreStats?.passCount ?? 0;

  return success(c, {
    averageScore: scoreStats?.averageScore !== null
      ? Math.round(scoreStats.averageScore * 100) / 100
      : null,
    highestScore: scoreStats?.highestScore ?? null,
    lowestScore: scoreStats?.lowestScore ?? null,
    passRate: totalStudents > 0 ? Math.round((passCount / totalStudents) * 100) : 0,
    totalStudents,
    flaggedCount: scoreStats?.flaggedCount ?? 0,
  });
});

// GET /teacher-overview — Stats + monthly trends for the analytics tab
analyticsRoutes.get("/teacher-overview", async (c) => {
  const user = c.get("user");
  const db = getDb(c.env.educore);

  // Unique classes
  const classRows = await db
    .select({ className: exams.className })
    .from(exams)
    .where(and(eq(exams.teacherId, user.id), sql`${exams.className} IS NOT NULL AND ${exams.className} != ''`))
    .groupBy(exams.className);
  const totalClasses = classRows.length;

  // Unique students across all exams
  const [studentRow] = await db
    .select({ cnt: sql<number>`count(distinct ${examSessions.studentId})` })
    .from(examSessions)
    .innerJoin(exams, eq(examSessions.examId, exams.id))
    .where(eq(exams.teacherId, user.id));
  const totalStudents = Number(studentRow?.cnt ?? 0);

  // Submissions in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 19).replace("T", " ");
  const [weeklyRow] = await db
    .select({ cnt: count() })
    .from(examSessions)
    .innerJoin(exams, eq(examSessions.examId, exams.id))
    .where(
      and(
        eq(exams.teacherId, user.id),
        sql`${examSessions.status} IN ('submitted', 'graded')`,
        sql`${examSessions.submittedAt} >= ${sevenDaysAgoStr}`,
      ),
    );
  const weeklySubmissions = Number(weeklyRow?.cnt ?? 0);

  // Total submissions
  const [totalRow] = await db
    .select({ cnt: count() })
    .from(examSessions)
    .innerJoin(exams, eq(examSessions.examId, exams.id))
    .where(
      and(
        eq(exams.teacherId, user.id),
        sql`${examSessions.status} IN ('submitted', 'graded')`,
      ),
    );
  const totalSubmissions = Number(totalRow?.cnt ?? 0);

  // Monthly averages for graded sessions only
  const monthlyRows = await db
    .select({
      month: sql<string>`strftime('%Y-%m', ${examSessions.submittedAt})`,
      avgScore: sql<number | null>`avg(${normalizedScorePercent})`,
      cnt: count(),
      passCount: sql<number>`sum(case when ${normalizedScorePercent} >= 60 then 1 else 0 end)`,
    })
    .from(examSessions)
    .innerJoin(exams, eq(examSessions.examId, exams.id))
    .where(
      and(
        eq(exams.teacherId, user.id),
        eq(examSessions.status, "graded"),
        sql`${examSessions.submittedAt} IS NOT NULL`,
        sql`${examSessions.score} IS NOT NULL`,
      ),
    )
    .groupBy(sql`strftime('%Y-%m', ${examSessions.submittedAt})`)
    .orderBy(sql`strftime('%Y-%m', ${examSessions.submittedAt})`);

  const monthlyData = monthlyRows.map((row) => ({
    month: row.month,
    avgScore:
      row.avgScore !== null
        ? Math.round(Number(row.avgScore) * 10) / 10
        : null,
    passRate: row.cnt > 0 ? Math.round((Number(row.passCount) / row.cnt) * 100) : null,
    count: row.cnt,
  }));

  return success(c, {
    totalClasses,
    totalStudents,
    weeklySubmissions,
    totalSubmissions,
    monthlyData,
  });
});

export default analyticsRoutes;
