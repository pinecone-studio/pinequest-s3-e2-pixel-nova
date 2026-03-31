import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { getDb, exams, examSessions, studentAnswers, questions, options, students, xpTransactions } from "../db";
import type { AppEnv } from "../types";
import { success, error, notFound, forbidden } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/role-guard";
import { newId } from "../utils/id";
import { getLevel } from "../utils/level-calc";
import { awardXpForGrading } from "../utils/xp-award";
import { parseExamDate } from "../utils/exam-time";
import {
  enrichTeacherNotificationTargets,
  notifyStudentLateEntry,
  notifyStudentSubmissionSaved,
  notifyTeacherStudentJoined,
  notifyTeacherStudentSubmitted,
} from "../services/notifications";

const getEffectiveExamStart = (exam: { startedAt?: string | null; scheduledAt?: string | null }) =>
  parseExamDate(exam.startedAt) ?? parseExamDate(exam.scheduledAt);

const EARTH_RADIUS_METERS = 6371000;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const calculateDistanceMeters = (
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number,
) => {
  const latDelta = toRadians(toLatitude - fromLatitude);
  const lonDelta = toRadians(toLongitude - fromLongitude);
  const startLat = toRadians(fromLatitude);
  const endLat = toRadians(toLatitude);

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lonDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getLocationGuard = (exam: {
  locationPolicy?: string | null;
  locationLatitude?: number | null;
  locationLongitude?: number | null;
  allowedRadiusMeters?: number | null;
  locationLabel?: string | null;
}) => {
  const isRestricted = exam.locationPolicy === "school_only";
  const hasCoordinates =
    typeof exam.locationLatitude === "number" &&
    typeof exam.locationLongitude === "number";

  return {
    isRestricted,
    hasCoordinates,
    locationLabel: exam.locationLabel?.trim() || "Сургуулийн бүс",
    radiusMeters: Math.max(100, Number(exam.allowedRadiusMeters ?? 3000)),
  };
};

const sessionRoutes = new Hono<AppEnv>();

sessionRoutes.use("*", authMiddleware);

// ---------------------------------------------------------------------------
// POST /join — Student joins an exam by room code
// ---------------------------------------------------------------------------
const joinSchema = z.object({
  roomCode: z.string().min(1),
  location: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      accuracy: z.number().nonnegative().optional(),
    })
    .optional(),
});

sessionRoutes.post("/join", requireRole("student"), zValidator("json", joinSchema), async (c) => {
  const { roomCode, location } = c.req.valid("json");
  const user = c.get("user");
  const db = getDb(c.env.educore);

  // Find exam by roomCode (scheduled or active)
  const [exam] = await db
    .select()
    .from(exams)
    .where(
      and(
        eq(exams.roomCode, roomCode),
        sql`${exams.status} IN (${sql.join(["scheduled", "active"].map((s) => sql`${s}`), sql`, `)})`,
      ),
    )
    .limit(1);

  if (!exam) {
    return error(c, "EXAM_NOT_FOUND", "No active exam found with this room code", 404);
  }

  const now = new Date();
  const scheduledAt = parseExamDate(exam.scheduledAt);

  if (exam.status === "scheduled") {
    if (!scheduledAt || now >= scheduledAt) {
      // Auto-start if scheduled time has passed
      const startedAt = exam.startedAt ?? now.toISOString();
      await db
        .update(exams)
        .set({
          status: "active",
          startedAt,
          updatedAt: now.toISOString(),
        })
        .where(eq(exams.id, exam.id));
      exam.status = "active";
      exam.startedAt = startedAt;
    }
  }

  const startTime = getEffectiveExamStart(exam) ?? scheduledAt;
  const isLateEntry = startTime
    ? now.getTime() - startTime.getTime() > 5 * 60 * 1000
    : false;
  const locationGuard = getLocationGuard(exam);
  const locationCheckedAt = now.toISOString();

  const evaluateJoinLocation = () => {
    if (!locationGuard.isRestricted) {
      return {
        allowed: true,
        status: "not_required",
        distanceMeters: null as number | null,
      };
    }

    if (!locationGuard.hasCoordinates) {
      return {
        allowed: true,
        status: "not_checked",
        distanceMeters: null as number | null,
      };
    }

    if (!location) {
      return {
        allowed: false,
        status: "not_checked",
        distanceMeters: null as number | null,
      };
    }

    const distanceMeters = calculateDistanceMeters(
      Number(location.latitude),
      Number(location.longitude),
      Number(exam.locationLatitude),
      Number(exam.locationLongitude),
    );
    const accuracyPadding = Math.min(Math.max(Number(location.accuracy ?? 0), 0), 1000);
    const allowedBoundary = locationGuard.radiusMeters + accuracyPadding;
    const edgeBoundary = locationGuard.radiusMeters + accuracyPadding + 250;

    if (distanceMeters <= allowedBoundary) {
      return {
        allowed: true,
        status: distanceMeters <= locationGuard.radiusMeters ? "inside" : "near_edge",
        distanceMeters,
      };
    }

    return {
      allowed: false,
      status: distanceMeters <= edgeBoundary ? "near_edge" : "outside",
      distanceMeters,
    };
  };

  const locationDecision = evaluateJoinLocation();

  if (!locationDecision.allowed) {
    if (!location) {
      return error(
        c,
        "LOCATION_REQUIRED",
        `${locationGuard.locationLabel}-ээс шалгалт өгөх тул байршлаа зөвшөөрнө үү.`,
        403,
      );
    }

    const distanceKm = ((locationDecision.distanceMeters ?? 0) / 1000).toFixed(1);
    return error(
      c,
      "LOCATION_OUTSIDE_ALLOWED_AREA",
      `Та ${locationGuard.locationLabel}-ээс ${distanceKm} км зайд байна. Энэ шалгалтыг зөвшөөрөгдсөн бүсээс өгнө.`,
      403,
    );
  }

  // Get question count
  const [questionCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(questions)
    .where(eq(questions.examId, exam.id));
  const totalQuestions = Number(questionCount?.count ?? 0);

  // Check if student already joined
  const [existing] = await db
    .select()
    .from(examSessions)
    .where(and(eq(examSessions.examId, exam.id), eq(examSessions.studentId, user.id)))
    .limit(1);

  if (existing) {
    if (isLateEntry && existing.status === "joined") {
      await db
        .update(examSessions)
        .set({ status: "late" })
        .where(eq(examSessions.id, existing.id));
      existing.status = "late";

      await notifyStudentLateEntry(
        db,
        user.id,
        exam.id,
        existing.id,
        startTime
          ? Math.max(
              0,
              Math.ceil(
                (startTime.getTime() + exam.durationMin * 60 * 1000 - now.getTime()) /
                  60000,
              ),
            )
          : exam.durationMin,
      );
    }

    await db
      .update(examSessions)
      .set({
        joinLocationStatus: locationDecision.status,
        joinDistanceMeters: locationDecision.distanceMeters,
        joinLatitude: location?.latitude ?? null,
        joinLongitude: location?.longitude ?? null,
        joinLocationCheckedAt: locationCheckedAt,
      })
      .where(eq(examSessions.id, existing.id));

    return success(c, {
      sessionId: existing.id,
      status: exam.status,
      sessionStatus: existing.status,
      entryStatus: existing.status === "late" ? "late" : "on_time",
      scheduledAt: exam.scheduledAt,
      startedAt: exam.startedAt,
      exam: {
        id: exam.id,
        title: exam.title,
        durationMin: exam.durationMin,
        questionCount: totalQuestions,
      },
    });
  }

  // Create session
  const sessionId = newId();
  await db.insert(examSessions).values({
    id: sessionId,
    examId: exam.id,
    studentId: user.id,
    status: isLateEntry ? "late" : "joined",
    joinLocationStatus: locationDecision.status,
    joinDistanceMeters: locationDecision.distanceMeters,
    joinLatitude: location?.latitude ?? null,
    joinLongitude: location?.longitude ?? null,
    joinLocationCheckedAt: locationCheckedAt,
  });

  const targets = await enrichTeacherNotificationTargets(db, exam.id, user.id);
  if (targets.teacherId) {
    await notifyTeacherStudentJoined(
      db,
      targets.teacherId,
      exam.id,
      sessionId,
      user.id,
      targets.studentName,
      isLateEntry,
    );
  }

  if (isLateEntry) {
    await notifyStudentLateEntry(
      db,
      user.id,
      exam.id,
      sessionId,
      startTime
        ? Math.max(
            0,
            Math.ceil(
              (startTime.getTime() + exam.durationMin * 60 * 1000 - now.getTime()) /
                60000,
            ),
          )
        : exam.durationMin,
    );
  }

  return success(c, {
    sessionId,
    status: exam.status,
    sessionStatus: isLateEntry ? "late" : "joined",
    entryStatus: isLateEntry ? "late" : "on_time",
    scheduledAt: exam.scheduledAt,
    startedAt: exam.startedAt,
    exam: {
      id: exam.id,
      title: exam.title,
      durationMin: exam.durationMin,
      questionCount: totalQuestions,
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
      status: exam.status,
      scheduledAt: exam.scheduledAt,
      startedAt: exam.startedAt,
      finishedAt: exam.finishedAt,
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

  if (session.status !== "joined" && session.status !== "late") {
    return error(
      c,
      "INVALID_STATUS",
      "Session must be in 'joined' or 'late' status to start",
      400,
    );
  }

  const [exam] = await db
    .select()
    .from(exams)
    .where(eq(exams.id, session.examId))
    .limit(1);

  if (!exam) {
    return notFound(c, "Exam");
  }

  const nowDate = new Date();
  const scheduledAt = parseExamDate(exam.scheduledAt);

  if (exam.status === "scheduled" && scheduledAt) {
    if (nowDate.getTime() < scheduledAt.getTime()) {
      return error(
        c,
        "NOT_STARTED",
        "Шалгалт хараахан эхлээгүй байна. Хүлээнэ үү.",
        409,
      );
    }

    const startedAt = exam.startedAt ?? nowDate.toISOString();
    await db
      .update(exams)
      .set({
        status: "active",
        startedAt,
        updatedAt: nowDate.toISOString(),
      })
      .where(eq(exams.id, exam.id));

    exam.status = "active";
    exam.startedAt = startedAt;
  }

  const effectiveStart = getEffectiveExamStart(exam) ?? nowDate;
  const startedAt = effectiveStart.toISOString();

  await db
    .update(examSessions)
    .set({ status: "in_progress", startedAt })
    .where(eq(examSessions.id, sessionId));

  return success(c, { sessionId, status: "in_progress", startedAt });
});

// ---------------------------------------------------------------------------
// POST /:sessionId/answer — Submit an answer
// ---------------------------------------------------------------------------
const singleAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionId: z.string().optional(),
  textAnswer: z.string().optional(),
});

const batchAnswerItemSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionId: z.string().optional(),
  textAnswer: z.string().optional(),
});

const answerSchema = z.union([
  singleAnswerSchema,
  z.object({
    answers: z.array(batchAnswerItemSchema).min(1),
  }),
]);

sessionRoutes.post("/:sessionId/answer", requireRole("student"), zValidator("json", answerSchema), async (c) => {
  const sessionId = c.req.param("sessionId");
  const payload = c.req.valid("json");
  const user = c.get("user");
  const db = getDb(c.env.educore);
  const answersToPersist = "answers" in payload ? payload.answers : [payload];

  // Verify session ownership and status
  const [session] = await db
    .select()
    .from(examSessions)
    .where(and(eq(examSessions.id, sessionId), eq(examSessions.studentId, user.id)))
    .limit(1);

  if (!session) {
    return notFound(c, "Session");
  }

  if (!["in_progress", "late", "joined"].includes(session.status)) {
    return error(c, "INVALID_STATUS", "Session is not in progress", 400);
  }

  // Verify exam hasn't expired using the shared exam schedule rather than a student's join time
  const [exam] = await db
    .select()
    .from(exams)
    .where(eq(exams.id, session.examId))
    .limit(1);

  if (!exam) {
    return notFound(c, "Exam");
  }

  const effectiveStart = getEffectiveExamStart(exam);
  if (session.status !== "in_progress") {
    const startedAt = session.startedAt ?? effectiveStart?.toISOString() ?? new Date().toISOString();
    await db
      .update(examSessions)
      .set({
        status: "in_progress",
        startedAt,
      })
      .where(eq(examSessions.id, sessionId));
    session.status = "in_progress";
    session.startedAt = startedAt;
  }

  if (effectiveStart) {
    const expiresAt = effectiveStart.getTime() + exam.durationMin * 60 * 1000;
    if (Date.now() > expiresAt) {
      return error(c, "EXAM_EXPIRED", "The exam time has expired", 400);
    }
  }

  const now = new Date().toISOString();
  const persistedAnswers: { questionId: string; answerId: string; updated: boolean }[] = [];

  for (const answer of answersToPersist) {
    const { questionId, selectedOptionId, textAnswer } = answer;
    const [existing] = await db
      .select()
      .from(studentAnswers)
      .where(and(eq(studentAnswers.sessionId, sessionId), eq(studentAnswers.questionId, questionId)))
      .limit(1);

    if (existing) {
      await db
        .update(studentAnswers)
        .set({
          selectedOptionId: selectedOptionId ?? null,
          textAnswer: textAnswer ?? null,
          answeredAt: now,
        })
        .where(eq(studentAnswers.id, existing.id));

      persistedAnswers.push({
        questionId,
        answerId: existing.id,
        updated: true,
      });
      continue;
    }

    const answerId = newId();
    await db.insert(studentAnswers).values({
      id: answerId,
      sessionId,
      questionId,
      selectedOptionId: selectedOptionId ?? null,
      textAnswer: textAnswer ?? null,
      answeredAt: now,
    });

    persistedAnswers.push({
      questionId,
      answerId,
      updated: false,
    });
  }

  await notifyStudentSubmissionSaved(db, user.id, exam.id, sessionId);

  if ("answers" in payload) {
    const createdOnly = persistedAnswers.every((item) => !item.updated);
    return success(
      c,
      {
        answers: persistedAnswers,
        count: persistedAnswers.length,
      },
      createdOnly ? 201 : 200,
    );
  }

  const [persisted] = persistedAnswers;
  return success(
    c,
    {
      answerId: persisted.answerId,
      updated: persisted.updated,
    },
    persisted.updated ? 200 : 201,
  );
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

  if (!["in_progress", "late", "joined"].includes(session.status)) {
    return error(c, "INVALID_STATUS", "Session must be in 'in_progress', 'late', or 'joined' status to submit", 400);
  }

  // Fetch exam and questions for grading
  const [exam] = await db
    .select()
    .from(exams)
    .where(eq(exams.id, session.examId))
    .limit(1);

  if (!exam) {
    return notFound(c, "Exam");
  }

  const effectiveStart = getEffectiveExamStart(exam);
  if (session.status !== "in_progress") {
    const startedAt = session.startedAt ?? effectiveStart?.toISOString() ?? new Date().toISOString();
    await db
      .update(examSessions)
      .set({
        status: "in_progress",
        startedAt,
      })
      .where(eq(examSessions.id, sessionId));
    session.status = "in_progress";
    session.startedAt = startedAt;
  }

  const examQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.examId, exam.id));

  const questionIds = examQuestions.map((q) => q.id);
  const questionOptions = questionIds.length > 0
    ? await db
        .select()
        .from(options)
        .where(
          sql`${options.questionId} IN (${sql.join(questionIds.map((id) => sql`${id}`), sql`, `)})`
        )
    : [];

  const optionsByQuestion = new Map<string, typeof questionOptions>();
  for (const opt of questionOptions) {
    const list = optionsByQuestion.get(opt.questionId) ?? [];
    list.push(opt);
    optionsByQuestion.set(opt.questionId, list);
  }

  const answers = await db
    .select()
    .from(studentAnswers)
    .where(eq(studentAnswers.sessionId, sessionId));

  const answerByQuestion = new Map(
    answers.map((answer) => [answer.questionId, answer]),
  );

  let totalPoints = 0;
  let earnedPoints = 0;

  for (const question of examQuestions) {
    totalPoints += Number(question.points ?? 1);
    const answer = answerByQuestion.get(question.id);
    if (!answer) {
      continue;
    }

    const possibleOptions = optionsByQuestion.get(question.id) ?? [];
    const correctOption = possibleOptions.find((opt) => opt.isCorrect);
    const selectedOption = possibleOptions.find(
      (opt) => opt.id === answer.selectedOptionId,
    );
    const correctAnswerText =
      correctOption?.text ?? question.correctAnswerText ?? "";

    const normalizedCorrect = correctAnswerText.trim().toLowerCase();
    const normalizedSelected = (selectedOption?.text ?? answer.textAnswer ?? "")
      .trim()
      .toLowerCase();

    const isCorrect = normalizedCorrect.length > 0
      ? normalizedCorrect === normalizedSelected
      : false;
    const pointsEarned = isCorrect ? Number(question.points ?? 1) : 0;
    earnedPoints += pointsEarned;

    await db
      .update(studentAnswers)
      .set({
        isCorrect,
        pointsEarned,
      })
      .where(eq(studentAnswers.id, answer.id));
  }

  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  const now = new Date().toISOString();
  await db
    .update(examSessions)
    .set({
      status: "graded",
      submittedAt: now,
      score: percentage,
      totalPoints,
      earnedPoints,
    })
    .where(eq(examSessions.id, sessionId));

  // XP calculation (simple tiered)
  const xpEarned =
    percentage >= 90 ? 100 :
    percentage >= 80 ? 80 :
    percentage >= 70 ? 60 :
    percentage >= 60 ? 40 :
    percentage >= 50 ? 20 : 10;

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, user.id))
    .limit(1);

  if (student) {
    const nextXp = student.xp + xpEarned;
    const nextLevel = getLevel(nextXp);
    await db
      .update(students)
      .set({ xp: nextXp, level: nextLevel })
      .where(eq(students.id, user.id));

    await db.insert(xpTransactions).values({
      id: newId(),
      studentId: student.id,
      amount: xpEarned,
      reason: "exam_completed",
      referenceId: sessionId,
    });
  }

  const targets = await enrichTeacherNotificationTargets(db, exam.id, user.id);
  if (targets.teacherId) {
    await notifyTeacherStudentSubmitted(
      db,
      targets.teacherId,
      exam.id,
      sessionId,
      user.id,
      targets.studentName,
    );
  }

  return success(c, {
    sessionId,
    status: "graded",
    submittedAt: now,
    score: percentage,
    totalPoints,
    earnedPoints,
    xpEarned,
  });
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

  const [exam] = await db
    .select()
    .from(exams)
    .where(eq(exams.id, session.examId))
    .limit(1);

  if (!exam) {
    return notFound(c, "Exam");
  }

  if (exam.status !== "finished") {
    return error(
      c,
      "RESULTS_PENDING",
      "Шалгалт дуусаагүй тул дүн хараахан гараагүй байна.",
      409,
    );
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

// ---------------------------------------------------------------------------
// POST /:sessionId/grade — Auto-grade a submitted session (teacher only)
// ---------------------------------------------------------------------------
sessionRoutes.post("/:sessionId/grade", requireRole("teacher"), async (c) => {
  const sessionId = c.req.param("sessionId");
  const teacherId = c.get("user").id;
  const db = getDb(c.env.educore);

  // Fetch session
  const [session] = await db
    .select()
    .from(examSessions)
    .where(eq(examSessions.id, sessionId))
    .limit(1);

  if (!session) return notFound(c, "Session");

  // Verify teacher owns the exam
  const [exam] = await db
    .select()
    .from(exams)
    .where(and(eq(exams.id, session.examId), eq(exams.teacherId, teacherId)))
    .limit(1);

  if (!exam) return notFound(c, "Exam");

  if (session.status !== "submitted") {
    return error(c, "INVALID_STATUS", "Session must be in 'submitted' status to grade", 400);
  }

  // Fetch all questions for the exam
  const examQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.examId, session.examId));

  // Build a map of correct option IDs for MC/TF questions
  const mcQuestionIds = examQuestions
    .filter((q) => q.type === "multiple_choice" || q.type === "true_false")
    .map((q) => q.id);

  const correctOptions = mcQuestionIds.length > 0
    ? await db
        .select()
        .from(options)
        .where(
          and(
            sql`${options.questionId} IN (${sql.join(mcQuestionIds.map((id) => sql`${id}`), sql`, `)})`,
            eq(options.isCorrect, true),
          ),
        )
    : [];

  const correctOptionByQuestion = new Map<string, string>();
  for (const opt of correctOptions) {
    correctOptionByQuestion.set(opt.questionId, opt.id);
  }

  // Build question map for points and type lookup
  const questionMap = new Map(examQuestions.map((q) => [q.id, q]));

  // Fetch student answers
  const answers = await db
    .select()
    .from(studentAnswers)
    .where(eq(studentAnswers.sessionId, sessionId));

  let earnedPoints = 0;
  let totalPoints = 0;

  for (const q of examQuestions) {
    totalPoints += q.points;
  }

  // Grade each answer
  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) continue;

    let isCorrect = false;
    let pointsEarned = 0;

    if (question.type === "multiple_choice" || question.type === "true_false") {
      const correctOptId = correctOptionByQuestion.get(question.id);
      isCorrect = answer.selectedOptionId === correctOptId;
    } else if (question.type === "short_answer") {
      isCorrect =
        !!question.correctAnswerText &&
        !!answer.textAnswer &&
        answer.textAnswer.trim().toLowerCase() === question.correctAnswerText.trim().toLowerCase();
    }

    if (isCorrect) {
      pointsEarned = question.points;
      earnedPoints += pointsEarned;
    }

    await db
      .update(studentAnswers)
      .set({ isCorrect, pointsEarned })
      .where(eq(studentAnswers.id, answer.id));
  }

  // Calculate score as percentage
  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  // Update session
  await db
    .update(examSessions)
    .set({ status: "graded", score, earnedPoints, totalPoints })
    .where(eq(examSessions.id, sessionId));

  // Award XP
  await awardXpForGrading({
    db,
    studentId: session.studentId,
    sessionId,
    score,
    passScore: exam.passScore ?? 50,
    totalPoints,
    earnedPoints,
  });

  const [graded] = await db
    .select()
    .from(examSessions)
    .where(eq(examSessions.id, sessionId))
    .limit(1);

  return success(c, graded);
});

// ---------------------------------------------------------------------------
// POST /:sessionId/grade-manual — Teacher manually grades individual answers
// ---------------------------------------------------------------------------
const manualGradeSchema = z.object({
  grades: z.array(
    z.object({
      answerId: z.string().min(1),
      pointsEarned: z.number().min(0),
      isCorrect: z.boolean(),
    })
  ).min(1),
});

sessionRoutes.post("/:sessionId/grade-manual", requireRole("teacher"), zValidator("json", manualGradeSchema), async (c) => {
  const sessionId = c.req.param("sessionId");
  const teacherId = c.get("user").id;
  const db = getDb(c.env.educore);

  // Fetch session
  const [session] = await db
    .select()
    .from(examSessions)
    .where(eq(examSessions.id, sessionId))
    .limit(1);

  if (!session) return notFound(c, "Session");

  // Verify teacher owns the exam
  const [exam] = await db
    .select()
    .from(exams)
    .where(and(eq(exams.id, session.examId), eq(exams.teacherId, teacherId)))
    .limit(1);

  if (!exam) return notFound(c, "Exam");

  if (session.status !== "submitted" && session.status !== "graded") {
    return error(c, "INVALID_STATUS", "Session must be in 'submitted' or 'graded' status to grade", 400);
  }

  const { grades } = c.req.valid("json");

  // Update each answer with the manual grade
  for (const grade of grades) {
    await db
      .update(studentAnswers)
      .set({ isCorrect: grade.isCorrect, pointsEarned: grade.pointsEarned })
      .where(and(eq(studentAnswers.id, grade.answerId), eq(studentAnswers.sessionId, sessionId)));
  }

  // Recalculate total earnedPoints from all answers in this session
  const allAnswers = await db
    .select({ pointsEarned: studentAnswers.pointsEarned })
    .from(studentAnswers)
    .where(eq(studentAnswers.sessionId, sessionId));

  let earnedPoints = 0;
  for (const a of allAnswers) {
    earnedPoints += a.pointsEarned ?? 0;
  }

  // Calculate totalPoints from exam questions
  const examQuestions = await db
    .select({ points: questions.points })
    .from(questions)
    .where(eq(questions.examId, session.examId));

  let totalPoints = 0;
  for (const q of examQuestions) {
    totalPoints += q.points;
  }

  // Recalculate score percentage
  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  // Update session
  await db
    .update(examSessions)
    .set({ status: "graded", score, earnedPoints, totalPoints })
    .where(eq(examSessions.id, sessionId));

  // Return updated session
  const [updated] = await db
    .select()
    .from(examSessions)
    .where(eq(examSessions.id, sessionId))
    .limit(1);

  return success(c, updated);
});

export default sessionRoutes;
