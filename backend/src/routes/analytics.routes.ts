import { Hono } from "hono";
import { eq, and, desc, sql, count } from "drizzle-orm";
import {
  getDb,
  exams,
  examSessions,
  questions,
  studentAnswers,
  options,
} from "../db";
import type { AppEnv } from "../types";
import { success, notFound, error } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/role-guard";

const analyticsRoutes = new Hono<AppEnv>();

// Apply auth + teacher role globally
analyticsRoutes.use("*", authMiddleware, requireRole("teacher"));

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

  // Get 5 most recent exams with student count and average score
  const recentExams = await db
    .select({
      id: exams.id,
      title: exams.title,
      status: exams.status,
      createdAt: exams.createdAt,
      studentCount: sql<number>`count(distinct ${examSessions.studentId})`,
      averageScore: sql<number | null>`avg(${examSessions.score})`,
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

  return success(c, {
    totalExams,
    totalStudents,
    activeExams,
    recentExams: formattedRecentExams,
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
      averageScore: sql<number | null>`avg(${examSessions.score})`,
      highestScore: sql<number | null>`max(${examSessions.score})`,
      lowestScore: sql<number | null>`min(${examSessions.score})`,
      totalStudents: count(),
      passCount: sql<number>`sum(case when ${examSessions.score} >= ${passScore} then 1 else 0 end)`,
      flaggedCount: sql<number>`sum(case when ${examSessions.isFlagged} = 1 then 1 else 0 end)`,
    })
    .from(examSessions)
    .where(
      and(
        eq(examSessions.examId, examId),
        eq(examSessions.status, "graded")
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

  // Monthly averages — last 12 months
  const monthlyRows = await db
    .select({
      month: sql<string>`strftime('%Y-%m', ${examSessions.submittedAt})`,
      avgScore: sql<number | null>`avg(case when ${examSessions.totalPoints} > 0 then ${examSessions.score} * 100.0 / ${examSessions.totalPoints} else ${examSessions.score} end)`,
      cnt: count(),
      passCount: sql<number>`sum(case when ${examSessions.totalPoints} > 0 and ${examSessions.score} * 100.0 / ${examSessions.totalPoints} >= 60 then 1 when (${examSessions.totalPoints} = 0 or ${examSessions.totalPoints} is null) and ${examSessions.score} >= 60 then 1 else 0 end)`,
    })
    .from(examSessions)
    .innerJoin(exams, eq(examSessions.examId, exams.id))
    .where(
      and(
        eq(exams.teacherId, user.id),
        sql`${examSessions.status} IN ('submitted', 'graded')`,
        sql`${examSessions.submittedAt} IS NOT NULL`,
      ),
    )
    .groupBy(sql`strftime('%Y-%m', ${examSessions.submittedAt})`)
    .orderBy(sql`strftime('%Y-%m', ${examSessions.submittedAt})`);

  const monthlyData = monthlyRows.map((row) => ({
    month: row.month,
    avgScore: row.avgScore !== null ? Math.round(Number(row.avgScore)) : null,
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
