import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, like, sql, asc, desc } from "drizzle-orm";
import { getDb, questionBank, questionBankOptions, exams, questions, options } from "../db";
import type { AppEnv } from "../types";
import { success, error, notFound, paginated } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/role-guard";
import { newId } from "../utils/id";

const questionBankRoutes = new Hono<AppEnv>();

questionBankRoutes.use("*", authMiddleware);
questionBankRoutes.use("*", requireRole("teacher"));

// POST / — Create bank question with options
questionBankRoutes.post(
  "/",
  zValidator("json", z.object({
    type: z.string().min(1),
    questionText: z.string().min(1),
    subjectId: z.string().optional(),
    difficulty: z.string().optional(),
    imageUrl: z.string().optional(),
    audioUrl: z.string().optional(),
    explanation: z.string().optional(),
    correctAnswerText: z.string().optional(),
    tags: z.array(z.string()).optional(),
    options: z.array(z.object({
      label: z.string(),
      text: z.string(),
      imageUrl: z.string().optional(),
      isCorrect: z.boolean(),
    })).optional(),
  })),
  async (c) => {
    try {
      const body = c.req.valid("json");
      const teacherId = c.get("user").id;
      const db = getDb(c.env.educore);
      const id = newId();
      const now = new Date().toISOString();

      await db.insert(questionBank).values({
        id,
        teacherId,
        subjectId: body.subjectId,
        type: body.type,
        difficulty: body.difficulty ?? "medium",
        questionText: body.questionText,
        imageUrl: body.imageUrl,
        audioUrl: body.audioUrl,
        explanation: body.explanation,
        correctAnswerText: body.correctAnswerText,
        tags: body.tags ? JSON.stringify(body.tags) : null,
        createdAt: now,
        updatedAt: now,
      });

      if (body.options && body.options.length > 0) {
        const optionValues = body.options.map((opt, idx) => ({
          id: newId(),
          bankQuestionId: id,
          label: opt.label,
          text: opt.text,
          imageUrl: opt.imageUrl,
          isCorrect: opt.isCorrect,
          orderIndex: idx,
        }));
        await db.insert(questionBankOptions).values(optionValues);
      }

      const [created] = await db.select().from(questionBank).where(eq(questionBank.id, id)).limit(1);
      const createdOptions = await db.select().from(questionBankOptions).where(eq(questionBankOptions.bankQuestionId, id));

      return success(c, { ...created, options: createdOptions }, 201);
    } catch (err) {
      return error(c, "INTERNAL_ERROR", "Failed to create bank question", 500);
    }
  },
);

// GET / — List bank questions with filtering and pagination
questionBankRoutes.get("/", async (c) => {
  try {
    const teacherId = c.get("user").id;
    const db = getDb(c.env.educore);

    // Parse query params
    const subjectId = c.req.query("subjectId");
    const difficulty = c.req.query("difficulty");
    const type = c.req.query("type");
    const search = c.req.query("search");
    const sort = c.req.query("sort") ?? "newest";
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20", 10) || 20));
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [eq(questionBank.teacherId, teacherId)];

    if (subjectId) {
      conditions.push(eq(questionBank.subjectId, subjectId));
    }
    if (difficulty) {
      conditions.push(eq(questionBank.difficulty, difficulty));
    }
    if (type) {
      conditions.push(eq(questionBank.type, type));
    }
    if (search) {
      const escaped = search.replace(/%/g, "\\%").replace(/_/g, "\\_");
      conditions.push(like(questionBank.questionText, `%${escaped}%`));
    }

    const whereClause = and(...conditions);

    // Count total matching rows
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(questionBank)
      .where(whereClause);

    // Determine sort order
    let orderBy;
    switch (sort) {
      case "oldest":
        orderBy = asc(questionBank.createdAt);
        break;
      case "most_used":
        orderBy = desc(questionBank.usageCount);
        break;
      case "newest":
      default:
        orderBy = desc(questionBank.createdAt);
        break;
    }

    // Fetch paginated results
    const bankQuestions = await db
      .select()
      .from(questionBank)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return paginated(c, bankQuestions, page, limit, total);
  } catch (err) {
    return error(c, "INTERNAL_ERROR", "Failed to fetch bank questions", 500);
  }
});

// GET /:id — Get single bank question with options
questionBankRoutes.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const teacherId = c.get("user").id;
    const db = getDb(c.env.educore);

    const [question] = await db.select().from(questionBank)
      .where(and(eq(questionBank.id, id), eq(questionBank.teacherId, teacherId)))
      .limit(1);

    if (!question) return notFound(c, "Bank question");

    const bankOptions = await db.select().from(questionBankOptions)
      .where(eq(questionBankOptions.bankQuestionId, id));

    return success(c, { ...question, options: bankOptions });
  } catch (err) {
    return error(c, "INTERNAL_ERROR", "Failed to fetch bank question", 500);
  }
});

// DELETE /:id — Delete bank question
questionBankRoutes.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const teacherId = c.get("user").id;
    const db = getDb(c.env.educore);

    const [existing] = await db.select().from(questionBank)
      .where(and(eq(questionBank.id, id), eq(questionBank.teacherId, teacherId)))
      .limit(1);

    if (!existing) return notFound(c, "Bank question");

    await db.delete(questionBank).where(eq(questionBank.id, id));
    return success(c, { deleted: true });
  } catch (err) {
    return error(c, "INTERNAL_ERROR", "Failed to delete bank question", 500);
  }
});

// POST /:id/copy-to-exam — Copy bank question to an exam
questionBankRoutes.post(
  "/:id/copy-to-exam",
  zValidator("json", z.object({ examId: z.string().min(1) })),
  async (c) => {
    try {
      const bankId = c.req.param("id");
      const { examId } = c.req.valid("json");
      const teacherId = c.get("user").id;
      const db = getDb(c.env.educore);

      // Verify bank question ownership
      const [bankQuestion] = await db.select().from(questionBank)
        .where(and(eq(questionBank.id, bankId), eq(questionBank.teacherId, teacherId)))
        .limit(1);

      if (!bankQuestion) return notFound(c, "Bank question");

      // Verify exam ownership
      const [exam] = await db.select().from(exams)
        .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)))
        .limit(1);

      if (!exam) return notFound(c, "Exam");

      // Get bank options
      const bankOpts = await db.select().from(questionBankOptions)
        .where(eq(questionBankOptions.bankQuestionId, bankId));

      // Determine order index
      const existingQuestions = await db.select().from(questions)
        .where(eq(questions.examId, examId));

      const questionId = newId();
      const now = new Date().toISOString();

      await db.insert(questions).values({
        id: questionId,
        examId,
        bankQuestionId: bankId,
        type: bankQuestion.type,
        difficulty: bankQuestion.difficulty,
        questionText: bankQuestion.questionText,
        imageUrl: bankQuestion.imageUrl,
        audioUrl: bankQuestion.audioUrl,
        explanation: bankQuestion.explanation,
        correctAnswerText: bankQuestion.correctAnswerText,
        points: 1,
        orderIndex: existingQuestions.length,
        createdAt: now,
        updatedAt: now,
      });

      if (bankOpts.length > 0) {
        const optValues = bankOpts.map((opt) => ({
          id: newId(),
          questionId,
          label: opt.label,
          text: opt.text,
          imageUrl: opt.imageUrl,
          isCorrect: opt.isCorrect,
          orderIndex: opt.orderIndex,
        }));
        await db.insert(options).values(optValues);
      }

      // Increment usage count
      await db.update(questionBank)
        .set({ usageCount: bankQuestion.usageCount + 1 })
        .where(eq(questionBank.id, bankId));

      return success(c, { questionId, copiedFrom: bankId, examId }, 201);
    } catch (err) {
      return error(c, "INTERNAL_ERROR", "Failed to copy question to exam", 500);
    }
  },
);

export default questionBankRoutes;
