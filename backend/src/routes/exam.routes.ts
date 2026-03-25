import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { getDb, exams, questions, options, subjects } from "../db";
import type { AppEnv } from "../types";
import { success, error, notFound } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/role-guard";
import { newId } from "../utils/id";
import { generateRoomCode } from "../utils/room-code";

const examRoutes = new Hono<AppEnv>();

examRoutes.use("*", authMiddleware);
examRoutes.use("*", requireRole("teacher"));

// ──────────────────────────────────────────────
// POST / — Create exam
// ──────────────────────────────────────────────
examRoutes.post(
  "/",
  zValidator(
    "json",
    z.object({
      subjectId: z.string().optional(),
      title: z.string(),
      description: z.string().optional(),
      durationMin: z.number().int().positive().optional(),
      passScore: z.number().int().min(0).max(100).optional(),
      shuffleQuestions: z.boolean().optional(),
    }),
  ),
  async (c) => {
    try {
      const body = c.req.valid("json");
      const teacherId = c.get("user").id;
      const db = getDb(c.env.educore);

      const ensureDefaultSubject = async () => {
        const [existing] = await db
          .select()
          .from(subjects)
          .where(eq(subjects.code, "GENERAL"))
          .limit(1);
        if (existing) return existing.id;
        const id = newId();
        await db.insert(subjects).values({
          id,
          name: "Ерөнхий",
          code: "GENERAL",
          description: "Анхдагч ерөнхий хичээл",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return id;
      };

      const subjectId = body.subjectId ?? (await ensureDefaultSubject());

      const id = newId();
      const now = new Date().toISOString();

      await db.insert(exams).values({
        id,
        teacherId,
        subjectId,
        title: body.title,
        description: body.description,
        durationMin: body.durationMin ?? 60,
        passScore: body.passScore ?? 50,
        shuffleQuestions: body.shuffleQuestions ?? false,
        createdAt: now,
        updatedAt: now,
      });

      const [created] = await db
        .select()
        .from(exams)
        .where(eq(exams.id, id))
        .limit(1);

      return success(c, created, 201);
    } catch (err) {
      return error(c, "INTERNAL_ERROR", "Failed to create exam", 500);
    }
  },
);

// ──────────────────────────────────────────────
// GET / — List teacher's exams
// ──────────────────────────────────────────────
examRoutes.get("/", async (c) => {
  try {
    const teacherId = c.get("user").id;
    const db = getDb(c.env.educore);

    const teacherExams = await db
      .select()
      .from(exams)
      .where(eq(exams.teacherId, teacherId));

    return success(c, teacherExams);
  } catch (err) {
    return error(c, "INTERNAL_ERROR", "Failed to fetch exams", 500);
  }
});

// ──────────────────────────────────────────────
// GET /:examId — Get exam with questions and options
// ──────────────────────────────────────────────
examRoutes.get("/:examId", async (c) => {
  try {
    const examId = c.req.param("examId");
    const teacherId = c.get("user").id;
    const db = getDb(c.env.educore);

    const [exam] = await db
      .select()
      .from(exams)
      .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)))
      .limit(1);

    if (!exam) {
      return notFound(c, "Exam");
    }

    const examQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.examId, examId));

    const questionsWithOptions = await Promise.all(
      examQuestions.map(async (question) => {
        const questionOptions = await db
          .select()
          .from(options)
          .where(eq(options.questionId, question.id));

        return { ...question, options: questionOptions };
      }),
    );

    return success(c, { ...exam, questions: questionsWithOptions });
  } catch (err) {
    return error(c, "INTERNAL_ERROR", "Failed to fetch exam", 500);
  }
});

// ──────────────────────────────────────────────
// PUT /:examId — Update exam metadata
// ──────────────────────────────────────────────
examRoutes.put(
  "/:examId",
  zValidator(
    "json",
    z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      durationMin: z.number().int().positive().optional(),
      passScore: z.number().int().min(0).max(100).optional(),
      shuffleQuestions: z.boolean().optional(),
      subjectId: z.string().optional(),
    }),
  ),
  async (c) => {
    try {
      const examId = c.req.param("examId");
      const teacherId = c.get("user").id;
      const body = c.req.valid("json");
      const db = getDb(c.env.educore);

      const [exam] = await db
        .select()
        .from(exams)
        .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)))
        .limit(1);

      if (!exam) {
        return notFound(c, "Exam");
      }

      const updates: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };

      if (body.title !== undefined) updates.title = body.title;
      if (body.description !== undefined)
        updates.description = body.description;
      if (body.durationMin !== undefined)
        updates.durationMin = body.durationMin;
      if (body.passScore !== undefined) updates.passScore = body.passScore;
      if (body.shuffleQuestions !== undefined)
        updates.shuffleQuestions = body.shuffleQuestions;
      if (body.subjectId !== undefined) updates.subjectId = body.subjectId;

      await db.update(exams).set(updates).where(eq(exams.id, examId));

      const [updated] = await db
        .select()
        .from(exams)
        .where(eq(exams.id, examId))
        .limit(1);

      return success(c, updated);
    } catch (err) {
      return error(c, "INTERNAL_ERROR", "Failed to update exam", 500);
    }
  },
);

// ──────────────────────────────────────────────
// DELETE /:examId — Delete exam (draft only)
// ──────────────────────────────────────────────
examRoutes.delete("/:examId", async (c) => {
  try {
    const examId = c.req.param("examId");
    const teacherId = c.get("user").id;
    const db = getDb(c.env.educore);

    const [exam] = await db
      .select()
      .from(exams)
      .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)))
      .limit(1);

    if (!exam) {
      return notFound(c, "Exam");
    }

    if (exam.status !== "draft") {
      return error(c, "BAD_REQUEST", "Only draft exams can be deleted", 400);
    }

    await db.delete(exams).where(eq(exams.id, examId));

    return success(c, { deleted: true });
  } catch (err) {
    return error(c, "INTERNAL_ERROR", "Failed to delete exam", 500);
  }
});

// ──────────────────────────────────────────────
// POST /:examId/questions — Add question with options
// ──────────────────────────────────────────────
examRoutes.post(
  "/:examId/questions",
  zValidator(
    "json",
    z.object({
      type: z.string(),
      questionText: z.string(),
      topic: z.string().optional(),
      difficulty: z.string().optional(),
      imageUrl: z.string().optional(),
      audioUrl: z.string().optional(),
      explanation: z.string().optional(),
      correctAnswerText: z.string().optional(),
      points: z.number().optional(),
      options: z
        .array(
          z.object({
            label: z.string(),
            text: z.string(),
            imageUrl: z.string().optional(),
            isCorrect: z.boolean(),
          }),
        )
        .optional(),
    }),
  ),
  async (c) => {
    try {
      const examId = c.req.param("examId");
      const teacherId = c.get("user").id;
      const body = c.req.valid("json");
      const db = getDb(c.env.educore);

      const [exam] = await db
        .select()
        .from(exams)
        .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)))
        .limit(1);

      if (!exam) {
        return notFound(c, "Exam");
      }

      // Determine orderIndex based on existing question count
      const existingQuestions = await db
        .select()
        .from(questions)
        .where(eq(questions.examId, examId));

      const orderIndex = existingQuestions.length;
      const questionId = newId();
      const now = new Date().toISOString();

      await db.insert(questions).values({
        id: questionId,
        examId,
        type: body.type,
        questionText: body.questionText,
        topic: body.topic,
        difficulty: body.difficulty ?? "medium",
        imageUrl: body.imageUrl,
        audioUrl: body.audioUrl,
        explanation: body.explanation,
        correctAnswerText: body.correctAnswerText,
        points: body.points ?? 1,
        orderIndex,
        createdAt: now,
        updatedAt: now,
      });

      // Insert options if provided
      if (body.options && body.options.length > 0) {
        const optionValues = body.options.map((opt, idx) => ({
          id: newId(),
          questionId,
          label: opt.label,
          text: opt.text,
          imageUrl: opt.imageUrl,
          isCorrect: opt.isCorrect,
          orderIndex: idx,
        }));

        await db.insert(options).values(optionValues);
      }

      const [createdQuestion] = await db
        .select()
        .from(questions)
        .where(eq(questions.id, questionId))
        .limit(1);

      const createdOptions = await db
        .select()
        .from(options)
        .where(eq(options.questionId, questionId));

      return success(c, { ...createdQuestion, options: createdOptions }, 201);
    } catch (err) {
      return error(c, "INTERNAL_ERROR", "Failed to add question", 500);
    }
  },
);

// ──────────────────────────────────────────────
// PUT /:examId/questions/:questionId — Update question
// ──────────────────────────────────────────────
examRoutes.put(
  "/:examId/questions/:questionId",
  zValidator(
    "json",
    z.object({
      type: z.string().optional(),
      questionText: z.string().optional(),
      topic: z.string().optional(),
      difficulty: z.string().optional(),
      imageUrl: z.string().optional(),
      audioUrl: z.string().optional(),
      explanation: z.string().optional(),
      correctAnswerText: z.string().optional(),
      points: z.number().optional(),
      options: z
        .array(
          z.object({
            label: z.string(),
            text: z.string(),
            imageUrl: z.string().optional(),
            isCorrect: z.boolean(),
          }),
        )
        .optional(),
    }),
  ),
  async (c) => {
    try {
      const examId = c.req.param("examId");
      const questionId = c.req.param("questionId");
      const teacherId = c.get("user").id;
      const body = c.req.valid("json");
      const db = getDb(c.env.educore);

      // Verify exam ownership
      const [exam] = await db
        .select()
        .from(exams)
        .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)))
        .limit(1);

      if (!exam) {
        return notFound(c, "Exam");
      }

      // Verify question belongs to exam
      const [question] = await db
        .select()
        .from(questions)
        .where(and(eq(questions.id, questionId), eq(questions.examId, examId)))
        .limit(1);

      if (!question) {
        return notFound(c, "Question");
      }

      // Build partial update
      const updates: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };

      if (body.type !== undefined) updates.type = body.type;
      if (body.questionText !== undefined)
        updates.questionText = body.questionText;
      if (body.topic !== undefined) updates.topic = body.topic;
      if (body.difficulty !== undefined) updates.difficulty = body.difficulty;
      if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl;
      if (body.audioUrl !== undefined) updates.audioUrl = body.audioUrl;
      if (body.explanation !== undefined)
        updates.explanation = body.explanation;
      if (body.correctAnswerText !== undefined)
        updates.correctAnswerText = body.correctAnswerText;
      if (body.points !== undefined) updates.points = body.points;

      await db
        .update(questions)
        .set(updates)
        .where(eq(questions.id, questionId));

      // Replace options if provided
      if (body.options !== undefined) {
        await db.delete(options).where(eq(options.questionId, questionId));

        if (body.options.length > 0) {
          const optionValues = body.options.map((opt, idx) => ({
            id: newId(),
            questionId,
            label: opt.label,
            text: opt.text,
            imageUrl: opt.imageUrl,
            isCorrect: opt.isCorrect,
            orderIndex: idx,
          }));

          await db.insert(options).values(optionValues);
        }
      }

      const [updatedQuestion] = await db
        .select()
        .from(questions)
        .where(eq(questions.id, questionId))
        .limit(1);

      const updatedOptions = await db
        .select()
        .from(options)
        .where(eq(options.questionId, questionId));

      return success(c, { ...updatedQuestion, options: updatedOptions });
    } catch (err) {
      return error(c, "INTERNAL_ERROR", "Failed to update question", 500);
    }
  },
);

// ──────────────────────────────────────────────
// DELETE /:examId/questions/:questionId — Delete question
// ──────────────────────────────────────────────
examRoutes.delete("/:examId/questions/:questionId", async (c) => {
  try {
    const examId = c.req.param("examId");
    const questionId = c.req.param("questionId");
    const teacherId = c.get("user").id;
    const db = getDb(c.env.educore);

    // Verify exam ownership
    const [exam] = await db
      .select()
      .from(exams)
      .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)))
      .limit(1);

    if (!exam) {
      return notFound(c, "Exam");
    }

    // Verify question belongs to exam
    const [question] = await db
      .select()
      .from(questions)
      .where(and(eq(questions.id, questionId), eq(questions.examId, examId)))
      .limit(1);

    if (!question) {
      return notFound(c, "Question");
    }

    await db.delete(questions).where(eq(questions.id, questionId));

    return success(c, { deleted: true });
  } catch (err) {
    return error(c, "INTERNAL_ERROR", "Failed to delete question", 500);
  }
});

// ──────────────────────────────────────────────
// POST /:examId/schedule — Schedule exam
// ──────────────────────────────────────────────
examRoutes.post(
  "/:examId/schedule",
  zValidator(
    "json",
    z.object({
      scheduledAt: z.string(),
    }),
  ),
  async (c) => {
    try {
      const examId = c.req.param("examId");
      const teacherId = c.get("user").id;
      const body = c.req.valid("json");
      const db = getDb(c.env.educore);

      const [exam] = await db
        .select()
        .from(exams)
        .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)))
        .limit(1);

      if (!exam) {
        return notFound(c, "Exam");
      }

      if (exam.status !== "draft") {
        return error(
          c,
          "BAD_REQUEST",
          "Only draft exams can be scheduled",
          400,
        );
      }

      const examQuestions = await db
        .select()
        .from(questions)
        .where(eq(questions.examId, examId));

      if (examQuestions.length === 0) {
        return error(
          c,
          "BAD_REQUEST",
          "Cannot schedule an exam with no questions",
          400,
        );
      }

      const roomCode = generateRoomCode();

      await db
        .update(exams)
        .set({
          status: "scheduled",
          scheduledAt: body.scheduledAt,
          roomCode,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(exams.id, examId));

      const [updated] = await db
        .select()
        .from(exams)
        .where(eq(exams.id, examId))
        .limit(1);

      return success(c, updated);
    } catch (err) {
      return error(c, "INTERNAL_ERROR", "Failed to schedule exam", 500);
    }
  },
);

// ──────────────────────────────────────────────
// POST /:examId/start — Start exam
// ──────────────────────────────────────────────
examRoutes.post("/:examId/start", async (c) => {
  try {
    const examId = c.req.param("examId");
    const teacherId = c.get("user").id;
    const db = getDb(c.env.educore);

    const [exam] = await db
      .select()
      .from(exams)
      .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)))
      .limit(1);

    if (!exam) {
      return notFound(c, "Exam");
    }

    if (exam.status !== "scheduled") {
      return error(
        c,
        "BAD_REQUEST",
        "Only scheduled exams can be started",
        400,
      );
    }

    const now = new Date().toISOString();

    await db
      .update(exams)
      .set({
        status: "active",
        startedAt: now,
        updatedAt: now,
      })
      .where(eq(exams.id, examId));

    const [updated] = await db
      .select()
      .from(exams)
      .where(eq(exams.id, examId))
      .limit(1);

    return success(c, updated);
  } catch (err) {
    return error(c, "INTERNAL_ERROR", "Failed to start exam", 500);
  }
});

// ──────────────────────────────────────────────
// POST /:examId/finish — Finish exam
// ──────────────────────────────────────────────
examRoutes.post("/:examId/finish", async (c) => {
  try {
    const examId = c.req.param("examId");
    const teacherId = c.get("user").id;
    const db = getDb(c.env.educore);

    const [exam] = await db
      .select()
      .from(exams)
      .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)))
      .limit(1);

    if (!exam) {
      return notFound(c, "Exam");
    }

    if (exam.status !== "active") {
      return error(c, "BAD_REQUEST", "Only active exams can be finished", 400);
    }

    const now = new Date().toISOString();

    await db
      .update(exams)
      .set({
        status: "finished",
        finishedAt: now,
        updatedAt: now,
      })
      .where(eq(exams.id, examId));

    const [updated] = await db
      .select()
      .from(exams)
      .where(eq(exams.id, examId))
      .limit(1);

    return success(c, updated);
  } catch (err) {
    return error(c, "INTERNAL_ERROR", "Failed to finish exam", 500);
  }
});

// ──────────────────────────────────────────────
// POST /:examId/archive — Archive a finished exam
// ──────────────────────────────────────────────
examRoutes.post("/:examId/archive", async (c) => {
  try {
    const examId = c.req.param("examId");
    const teacherId = c.get("user").id;
    const db = getDb(c.env.educore);

    const [exam] = await db
      .select()
      .from(exams)
      .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)))
      .limit(1);

    if (!exam) {
      return notFound(c, "Exam");
    }

    if (exam.status !== "finished") {
      return error(
        c,
        "BAD_REQUEST",
        "Only finished exams can be archived",
        400,
      );
    }

    const now = new Date().toISOString();

    await db
      .update(exams)
      .set({
        status: "archived",
        updatedAt: now,
      })
      .where(eq(exams.id, examId));

    const [updated] = await db
      .select()
      .from(exams)
      .where(eq(exams.id, examId))
      .limit(1);

    return success(c, updated);
  } catch (err) {
    return error(c, "INTERNAL_ERROR", "Failed to archive exam", 500);
  }
});

export default examRoutes;
