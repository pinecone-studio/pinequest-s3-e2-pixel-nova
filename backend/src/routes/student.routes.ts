import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getDb, examSessions, exams, studentAnswers, questions, options } from "../db";
import type { AppEnv } from "../types";
import { success, notFound } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/role-guard";
import { students } from "../db";

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

// GET /term-rank — current student's rank among students with graded sessions
studentRoutes.get("/term-rank", async (c) => {
  const user = c.get("user");
  const db = getDb(c.env.educore);

  const gradedSessions = await db
    .select({
      studentId: examSessions.studentId,
      score: examSessions.score,
    })
    .from(examSessions)
    .where(eq(examSessions.status, "graded"));

  const statsByStudent = new Map<
    string,
    { totalScore: number; examCount: number }
  >();

  for (const session of gradedSessions) {
    if (typeof session.score !== "number") continue;
    const current = statsByStudent.get(session.studentId) ?? {
      totalScore: 0,
      examCount: 0,
    };
    current.totalScore += session.score;
    current.examCount += 1;
    statsByStudent.set(session.studentId, current);
  }

  const rankedStudents = [...statsByStudent.entries()]
    .map(([studentId, stats]) => ({
      studentId,
      examCount: stats.examCount,
      averageScore: stats.examCount > 0 ? stats.totalScore / stats.examCount : 0,
    }))
    .sort((left, right) => {
      if (right.averageScore !== left.averageScore) {
        return right.averageScore - left.averageScore;
      }
      if (right.examCount !== left.examCount) {
        return right.examCount - left.examCount;
      }
      return left.studentId.localeCompare(right.studentId);
    });

  const currentIndex = rankedStudents.findIndex(
    (entry) => entry.studentId === user.id,
  );

  return success(c, {
    rank: currentIndex >= 0 ? currentIndex + 1 : null,
    totalStudents: rankedStudents.length,
    termExamCount:
      currentIndex >= 0 ? rankedStudents[currentIndex]?.examCount ?? 0 : 0,
  });
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

const profileSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  school: z.string().optional().or(z.literal("")),
  grade: z.string().optional().or(z.literal("")),
  groupName: z.string().optional().or(z.literal("")),
  bio: z.string().optional().or(z.literal("")),
});

// GET /profile — current student's profile
studentRoutes.get("/profile", async (c) => {
  const user = c.get("user");
  const db = getDb(c.env.educore);

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, user.id))
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
    groupName: student.groupName,
    bio: student.bio,
    xp: student.xp,
    level: student.level,
  });
});

// PUT /profile — update current student's profile
studentRoutes.put("/profile", zValidator("json", profileSchema), async (c) => {
  const user = c.get("user");
  const db = getDb(c.env.educore);
  const payload = c.req.valid("json");

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, user.id))
    .limit(1);

  if (!student) {
    return notFound(c, "Student");
  }

  await db
    .update(students)
    .set({
      fullName: payload.fullName,
      email: payload.email || null,
      avatarUrl: payload.avatarUrl || null,
      phone: payload.phone || null,
      school: payload.school || null,
      grade: payload.grade || null,
      groupName: payload.groupName || null,
      bio: payload.bio || null,
    })
    .where(eq(students.id, user.id));

  return success(c, {
    ...payload,
  });
});

export default studentRoutes;
