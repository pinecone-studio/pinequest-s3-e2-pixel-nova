import { Hono } from "hono";
import { getDb, students, exams, examSessions, questions, studentAnswers, options } from "../db";
import { and, eq, sql } from "drizzle-orm";
import type { AppEnv } from "../types";
import { success, notFound } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/role-guard";

const teacherRoutes = new Hono<AppEnv>();

// Apply auth + teacher role globally
teacherRoutes.use("*", authMiddleware, requireRole("teacher"));

// GET /students/:id/profile — teacher view of a student's profile
teacherRoutes.get("/students/:id/profile", async (c) => {
  const studentId = c.req.param("id");
  const db = getDb(c.env.educore);

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  if (!student) {
    return notFound(c, "Student");
  }

  return success(c, {
    id: student.id,
    code: student.code,
    fullName: student.fullName,
    email: student.email,
    avatarUrl: student.avatarUrl,
    phone: student.phone,
    school: student.school,
    grade: student.grade,
    bio: student.bio,
    xp: student.xp,
    level: student.level,
  });
});

// GET /exams/:examId/submissions — list graded sessions for an exam
teacherRoutes.get("/exams/:examId/submissions", async (c) => {
  const teacherId = c.get("user").id;
  const examId = c.req.param("examId");
  const db = getDb(c.env.educore);

  const [exam] = await db
    .select()
    .from(exams)
    .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)))
    .limit(1);

  if (!exam) {
    return notFound(c, "Exam");
  }

  const submissions = await db
    .select({
      id: examSessions.id,
      examId: examSessions.examId,
      studentId: examSessions.studentId,
      studentName: students.fullName,
      score: examSessions.score,
      totalPoints: examSessions.totalPoints,
      percentage: examSessions.score,
      submittedAt: examSessions.submittedAt,
      isFlagged: examSessions.isFlagged,
      flagCount: examSessions.flagCount,
    })
    .from(examSessions)
    .innerJoin(students, eq(examSessions.studentId, students.id))
    .where(and(eq(examSessions.examId, examId), eq(examSessions.status, "graded")))
    .orderBy(examSessions.submittedAt);

  return success(c, submissions);
});

// GET /sessions/:sessionId/result — detailed result for teacher
teacherRoutes.get("/sessions/:sessionId/result", async (c) => {
  const teacherId = c.get("user").id;
  const sessionId = c.req.param("sessionId");
  const db = getDb(c.env.educore);

  const [session] = await db
    .select()
    .from(examSessions)
    .where(eq(examSessions.id, sessionId))
    .limit(1);

  if (!session) {
    return notFound(c, "Session");
  }

  const [exam] = await db
    .select()
    .from(exams)
    .where(and(eq(exams.id, session.examId), eq(exams.teacherId, teacherId)))
    .limit(1);

  if (!exam) {
    return notFound(c, "Exam");
  }

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, session.studentId))
    .limit(1);

  const answers = await db
    .select({
      questionId: studentAnswers.questionId,
      selectedOptionId: studentAnswers.selectedOptionId,
      textAnswer: studentAnswers.textAnswer,
      isCorrect: studentAnswers.isCorrect,
      pointsEarned: studentAnswers.pointsEarned,
      questionText: questions.questionText,
      questionType: questions.type,
      points: questions.points,
      correctAnswerText: questions.correctAnswerText,
    })
    .from(studentAnswers)
    .innerJoin(questions, eq(studentAnswers.questionId, questions.id))
    .where(eq(studentAnswers.sessionId, sessionId))
    .orderBy(questions.orderIndex);

  const questionIds = answers.map((a) => a.questionId);
  const allOptions = questionIds.length > 0
    ? await db
        .select()
        .from(options)
        .where(
          sql`${options.questionId} IN (${sql.join(questionIds.map((id) => sql`${id}`), sql`, `)})`
        )
        .orderBy(options.orderIndex)
    : [];

  const optionsByQuestion = new Map<string, typeof allOptions>();
  for (const opt of allOptions) {
    const list = optionsByQuestion.get(opt.questionId) ?? [];
    list.push(opt);
    optionsByQuestion.set(opt.questionId, list);
  }

  const detailedAnswers = answers.map((a) => ({
    questionId: a.questionId,
    questionText: a.questionText,
    questionType: a.questionType,
    points: a.points,
    correctAnswerText: a.correctAnswerText,
    selectedOptionId: a.selectedOptionId,
    textAnswer: a.textAnswer,
    isCorrect: a.isCorrect,
    pointsEarned: a.pointsEarned,
    options: (optionsByQuestion.get(a.questionId) ?? []).map((opt) => ({
      id: opt.id,
      label: opt.label,
      text: opt.text,
      imageUrl: opt.imageUrl,
      isCorrect: opt.isCorrect,
    })),
  }));

  return success(c, {
    sessionId: session.id,
    examId: exam.id,
    title: exam.title,
    score: session.score,
    totalPoints: session.totalPoints,
    earnedPoints: session.earnedPoints,
    submittedAt: session.submittedAt,
    student: student
      ? {
          id: student.id,
          fullName: student.fullName,
          email: student.email,
          avatarUrl: student.avatarUrl,
        }
      : null,
    answers: detailedAnswers,
  });
});

export default teacherRoutes;
