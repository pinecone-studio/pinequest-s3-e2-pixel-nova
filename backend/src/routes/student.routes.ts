import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { getDb, examSessions, exams, studentAnswers, questions, options } from "../db";
import type { AppEnv } from "../types";
import { success, notFound } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/role-guard";

const studentRoutes = new Hono<AppEnv>();

// Apply auth + student role globally
studentRoutes.use("*", authMiddleware, requireRole("student"));

// GET /exams — List student's exam sessions with exam info
studentRoutes.get("/exams", async (c) => {
  const user = c.get("user");
  const db = getDb(c.env.educore);

  const sessions = await db
    .select({
      examId: examSessions.examId,
      title: exams.title,
      sessionStatus: examSessions.status,
      score: examSessions.score,
      startedAt: examSessions.startedAt,
      submittedAt: examSessions.submittedAt,
    })
    .from(examSessions)
    .innerJoin(exams, eq(examSessions.examId, exams.id))
    .where(eq(examSessions.studentId, user.id));

  return success(c, sessions);
});

// GET /results — All past results (graded sessions)
studentRoutes.get("/results", async (c) => {
  const user = c.get("user");
  const db = getDb(c.env.educore);

  const results = await db
    .select({
      sessionId: examSessions.id,
      examId: examSessions.examId,
      title: exams.title,
      score: examSessions.score,
      totalPoints: examSessions.totalPoints,
      earnedPoints: examSessions.earnedPoints,
      startedAt: examSessions.startedAt,
      submittedAt: examSessions.submittedAt,
    })
    .from(examSessions)
    .innerJoin(exams, eq(examSessions.examId, exams.id))
    .where(
      and(
        eq(examSessions.studentId, user.id),
        eq(examSessions.status, "graded")
      )
    );

  return success(c, results);
});

// GET /results/:sessionId — Detailed result
studentRoutes.get("/results/:sessionId", async (c) => {
  const user = c.get("user");
  const sessionId = c.req.param("sessionId");
  const db = getDb(c.env.educore);

  // Verify session belongs to student and is graded
  const [session] = await db
    .select()
    .from(examSessions)
    .where(
      and(
        eq(examSessions.id, sessionId),
        eq(examSessions.studentId, user.id),
        eq(examSessions.status, "graded")
      )
    )
    .limit(1);

  if (!session) {
    return notFound(c, "Session");
  }

  // Get exam info
  const [exam] = await db
    .select()
    .from(exams)
    .where(eq(exams.id, session.examId))
    .limit(1);

  if (!exam) {
    return notFound(c, "Exam");
  }

  // Get all student answers with question and option details
  const answers = await db
    .select({
      questionId: studentAnswers.questionId,
      questionText: questions.questionText,
      selectedOptionId: studentAnswers.selectedOptionId,
      textAnswer: studentAnswers.textAnswer,
      isCorrect: studentAnswers.isCorrect,
      pointsEarned: studentAnswers.pointsEarned,
      points: questions.points,
    })
    .from(studentAnswers)
    .innerJoin(questions, eq(studentAnswers.questionId, questions.id))
    .where(eq(studentAnswers.sessionId, sessionId));

  // For each answer, resolve selected answer text and correct answer text
  const breakdown = await Promise.all(
    answers.map(async (answer) => {
      let selectedAnswerText: string | null = null;
      let correctAnswerText: string | null = null;

      if (answer.selectedOptionId) {
        const [selectedOption] = await db
          .select({ text: options.text })
          .from(options)
          .where(eq(options.id, answer.selectedOptionId))
          .limit(1);
        selectedAnswerText = selectedOption?.text ?? null;
      } else {
        selectedAnswerText = answer.textAnswer;
      }

      // Get correct option for this question
      const [correctOption] = await db
        .select({ text: options.text })
        .from(options)
        .where(
          and(
            eq(options.questionId, answer.questionId),
            eq(options.isCorrect, true)
          )
        )
        .limit(1);
      correctAnswerText = correctOption?.text ?? null;

      return {
        questionText: answer.questionText,
        selectedAnswer: selectedAnswerText,
        correctAnswer: correctAnswerText,
        isCorrect: answer.isCorrect,
        points: answer.points,
        pointsEarned: answer.pointsEarned,
      };
    })
  );

  return success(c, {
    sessionId: session.id,
    examId: exam.id,
    title: exam.title,
    description: exam.description,
    score: session.score,
    totalPoints: session.totalPoints,
    earnedPoints: session.earnedPoints,
    startedAt: session.startedAt,
    submittedAt: session.submittedAt,
    answers: breakdown,
  });
});

export default studentRoutes;
