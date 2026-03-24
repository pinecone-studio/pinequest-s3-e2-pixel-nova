import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { getDb, exams, examSessions, studentAnswers, questions, options, students } from "../db";
import type { AppEnv } from "../types";
import { success, error, notFound, forbidden } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/role-guard";
import { newId } from "../utils/id";

const sessionRoutes = new Hono<AppEnv>();

sessionRoutes.use("*", authMiddleware);

// ---------------------------------------------------------------------------
// POST /join — Student joins an exam by room code
// ---------------------------------------------------------------------------
const joinSchema = z.object({
  roomCode: z.string().min(1),
});

sessionRoutes.post("/join", requireRole("student"), zValidator("json", joinSchema), async (c) => {
  const { roomCode } = c.req.valid("json");
  const user = c.get("user");
  const db = getDb(c.env.educore);

  // Find active exam by roomCode
  const [exam] = await db
    .select()
    .from(exams)
    .where(and(eq(exams.roomCode, roomCode), eq(exams.status, "active")))
    .limit(1);

  if (!exam) {
    return error(c, "EXAM_NOT_FOUND", "No active exam found with this room code", 404);
  }

  // Check if student already joined
  const [existing] = await db
    .select()
    .from(examSessions)
    .where(and(eq(examSessions.examId, exam.id), eq(examSessions.studentId, user.id)))
    .limit(1);

  if (existing) {
    return error(c, "ALREADY_JOINED", "You have already joined this exam", 409);
  }

  // Get question count
  const [questionCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(questions)
    .where(eq(questions.examId, exam.id));

  // Create session
  const sessionId = newId();
  await db.insert(examSessions).values({
    id: sessionId,
    examId: exam.id,
    studentId: user.id,
    status: "joined",
  });

  return success(c, {
    sessionId,
    exam: {
      id: exam.id,
      title: exam.title,
      durationMin: exam.durationMin,
      questionCount: questionCount.count,
    },
  }, 201);
});

// ---------------------------------------------------------------------------
// GET /:sessionId — Get session with exam questions (correct answers hidden)
// ---------------------------------------------------------------------------
sessionRoutes.get("/:sessionId", requireRole("student"), async (c) => {
  const sessionId = c.req.param("sessionId");
  const user = c.get("user");
  const db = getDb(c.env.educore);

  // Fetch session and verify ownership
  const [session] = await db
    .select()
    .from(examSessions)
    .where(and(eq(examSessions.id, sessionId), eq(examSessions.studentId, user.id)))
    .limit(1);

  if (!session) {
    return notFound(c, "Session");
  }

  // Fetch exam info
  const [exam] = await db
    .select()
    .from(exams)
    .where(eq(exams.id, session.examId))
    .limit(1);

  if (!exam) {
    return notFound(c, "Exam");
  }

  // Fetch questions (without correctAnswerText)
  const examQuestions = await db
    .select({
      id: questions.id,
      type: questions.type,
      questionText: questions.questionText,
      imageUrl: questions.imageUrl,
      audioUrl: questions.audioUrl,
      points: questions.points,
      orderIndex: questions.orderIndex,
      difficulty: questions.difficulty,
      topic: questions.topic,
    })
    .from(questions)
    .where(eq(questions.examId, session.examId))
    .orderBy(questions.orderIndex);

  // Fetch options for all questions (without isCorrect)
  const questionIds = examQuestions.map((q) => q.id);
  const allOptions = questionIds.length > 0
    ? await db
        .select({
          id: options.id,
          questionId: options.questionId,
          label: options.label,
          text: options.text,
          imageUrl: options.imageUrl,
          orderIndex: options.orderIndex,
        })
        .from(options)
        .where(
          sql`${options.questionId} IN (${sql.join(questionIds.map((id) => sql`${id}`), sql`, `)})`
        )
        .orderBy(options.orderIndex)
    : [];

  // Group options by question
  const optionsByQuestion = new Map<string, typeof allOptions>();
  for (const opt of allOptions) {
    const list = optionsByQuestion.get(opt.questionId) ?? [];
    list.push(opt);
    optionsByQuestion.set(opt.questionId, list);
  }

  const questionsWithOptions = examQuestions.map((q) => ({
    ...q,
    options: optionsByQuestion.get(q.id) ?? [],
  }));

  return success(c, {
    session: {
      id: session.id,
      status: session.status,
      startedAt: session.startedAt,
      submittedAt: session.submittedAt,
    },
    exam: {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      durationMin: exam.durationMin,
    },
    questions: questionsWithOptions,
  });
});

// ---------------------------------------------------------------------------
// POST /:sessionId/start — Start taking the exam
// ---------------------------------------------------------------------------
sessionRoutes.post("/:sessionId/start", requireRole("student"), async (c) => {
  const sessionId = c.req.param("sessionId");
  const user = c.get("user");
  const db = getDb(c.env.educore);

  const [session] = await db
    .select()
    .from(examSessions)
    .where(and(eq(examSessions.id, sessionId), eq(examSessions.studentId, user.id)))
    .limit(1);

  if (!session) {
    return notFound(c, "Session");
  }

  if (session.status !== "joined") {
    return error(c, "INVALID_STATUS", "Session must be in 'joined' status to start", 400);
  }

  const now = new Date().toISOString();
  await db
    .update(examSessions)
    .set({ status: "in_progress", startedAt: now })
    .where(eq(examSessions.id, sessionId));

  return success(c, { sessionId, status: "in_progress", startedAt: now });
});

// ---------------------------------------------------------------------------
// POST /:sessionId/answer — Submit an answer
// ---------------------------------------------------------------------------
const answerSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionId: z.string().optional(),
  textAnswer: z.string().optional(),
});

sessionRoutes.post("/:sessionId/answer", requireRole("student"), zValidator("json", answerSchema), async (c) => {
  const sessionId = c.req.param("sessionId");
  const { questionId, selectedOptionId, textAnswer } = c.req.valid("json");
  const user = c.get("user");
  const db = getDb(c.env.educore);

  // Verify session ownership and status
  const [session] = await db
    .select()
    .from(examSessions)
    .where(and(eq(examSessions.id, sessionId), eq(examSessions.studentId, user.id)))
    .limit(1);

  if (!session) {
    return notFound(c, "Session");
  }

  if (session.status !== "in_progress") {
    return error(c, "INVALID_STATUS", "Session is not in progress", 400);
  }

  // Verify exam hasn't expired (startedAt + durationMin)
  const [exam] = await db
    .select()
    .from(exams)
    .where(eq(exams.id, session.examId))
    .limit(1);

  if (!exam) {
    return notFound(c, "Exam");
  }

  if (session.startedAt) {
    const startTime = new Date(session.startedAt).getTime();
    const expiresAt = startTime + exam.durationMin * 60 * 1000;
    if (Date.now() > expiresAt) {
      return error(c, "EXAM_EXPIRED", "The exam time has expired", 400);
    }
  }

  // Check if answer already exists for this question in this session
  const [existing] = await db
    .select()
    .from(studentAnswers)
    .where(and(eq(studentAnswers.sessionId, sessionId), eq(studentAnswers.questionId, questionId)))
    .limit(1);

  const now = new Date().toISOString();

  if (existing) {
    // Update existing answer
    await db
      .update(studentAnswers)
      .set({
        selectedOptionId: selectedOptionId ?? null,
        textAnswer: textAnswer ?? null,
        answeredAt: now,
      })
      .where(eq(studentAnswers.id, existing.id));

    return success(c, { answerId: existing.id, updated: true });
  }

  // Insert new answer
  const answerId = newId();
  await db.insert(studentAnswers).values({
    id: answerId,
    sessionId,
    questionId,
    selectedOptionId: selectedOptionId ?? null,
    textAnswer: textAnswer ?? null,
    answeredAt: now,
  });

  return success(c, { answerId, updated: false }, 201);
});

// ---------------------------------------------------------------------------
// POST /:sessionId/submit — Submit the exam
// ---------------------------------------------------------------------------
sessionRoutes.post("/:sessionId/submit", requireRole("student"), async (c) => {
  const sessionId = c.req.param("sessionId");
  const user = c.get("user");
  const db = getDb(c.env.educore);

  const [session] = await db
    .select()
    .from(examSessions)
    .where(and(eq(examSessions.id, sessionId), eq(examSessions.studentId, user.id)))
    .limit(1);

  if (!session) {
    return notFound(c, "Session");
  }

  if (session.status !== "in_progress") {
    return error(c, "INVALID_STATUS", "Session must be in 'in_progress' status to submit", 400);
  }

  const now = new Date().toISOString();
  await db
    .update(examSessions)
    .set({ status: "submitted", submittedAt: now })
    .where(eq(examSessions.id, sessionId));

  return success(c, { sessionId, status: "submitted", submittedAt: now });
});

// ---------------------------------------------------------------------------
// GET /:sessionId/result — Get graded result
// ---------------------------------------------------------------------------
sessionRoutes.get("/:sessionId/result", requireRole("student"), async (c) => {
  const sessionId = c.req.param("sessionId");
  const user = c.get("user");
  const db = getDb(c.env.educore);

  const [session] = await db
    .select()
    .from(examSessions)
    .where(and(eq(examSessions.id, sessionId), eq(examSessions.studentId, user.id)))
    .limit(1);

  if (!session) {
    return notFound(c, "Session");
  }

  if (session.status !== "graded") {
    return error(c, "NOT_GRADED", "Results are only available after grading", 400);
  }

  // Fetch all answers for this session with question and option details
  const answers = await db
    .select({
      answerId: studentAnswers.id,
      questionId: studentAnswers.questionId,
      selectedOptionId: studentAnswers.selectedOptionId,
      textAnswer: studentAnswers.textAnswer,
      isCorrect: studentAnswers.isCorrect,
      pointsEarned: studentAnswers.pointsEarned,
      answeredAt: studentAnswers.answeredAt,
      questionText: questions.questionText,
      questionType: questions.type,
      points: questions.points,
      correctAnswerText: questions.correctAnswerText,
    })
    .from(studentAnswers)
    .innerJoin(questions, eq(studentAnswers.questionId, questions.id))
    .where(eq(studentAnswers.sessionId, sessionId))
    .orderBy(questions.orderIndex);

  // Gather question IDs to fetch options
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
    status: session.status,
    score: session.score,
    earnedPoints: session.earnedPoints,
    totalPoints: session.totalPoints,
    submittedAt: session.submittedAt,
    answers: detailedAnswers,
  });
});

export default sessionRoutes;
