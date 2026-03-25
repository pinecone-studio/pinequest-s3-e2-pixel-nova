import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { getDb, exams, questions, options, questionBank, questionBankOptions, subjects } from "../db";
import type { AppEnv } from "../types";
import { success, error, notFound } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/role-guard";
import { newId } from "../utils/id";
import { parsePdf, PdfParseError } from "../utils/pdf-parser";
import { extractQuestions } from "../utils/ai-extractor";

const pdfRoutes = new Hono<AppEnv>();

pdfRoutes.use("*", authMiddleware);
pdfRoutes.use("*", requireRole("teacher"));

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ---------------------------------------------------------------------------
// POST /upload — Upload a PDF file to R2
// ---------------------------------------------------------------------------
pdfRoutes.post("/upload", async (c) => {
  try {
    const teacherId = c.get("user").id;
    const formData = await c.req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return error(c, "BAD_REQUEST", "No file provided", 400);
    }

    if (file.type !== "application/pdf") {
      return error(c, "BAD_REQUEST", "File must be a PDF", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return error(c, "BAD_REQUEST", "PDF must be under 10MB", 400);
    }

    const fileKey = newId();
    const r2Key = `pdfs/${teacherId}/${fileKey}.pdf`;
    const buffer = await file.arrayBuffer();

    // Validate PDF is typed (has extractable text) and get page count
    let pageCount: number;
    try {
      const parsed = await parsePdf(new Uint8Array(buffer));
      pageCount = parsed.pageCount;
    } catch (err) {
      if (err instanceof PdfParseError) {
        return error(c, err.code, err.message, 400);
      }
      throw err;
    }

    // Store in R2
    await c.env.EXAM_FILES.put(r2Key, buffer, {
      customMetadata: {
        teacherId,
        fileName: file.name,
        pageCount: String(pageCount),
      },
    });

    return success(c, { fileKey, fileName: file.name, pageCount }, 201);
  } catch (err) {
    return error(c, "INTERNAL_ERROR", "Failed to upload PDF", 500);
  }
});

// ---------------------------------------------------------------------------
// POST /extract — Parse PDF and extract questions via AI
// ---------------------------------------------------------------------------
const extractSchema = z.object({
  fileKey: z.string().min(1),
});

pdfRoutes.post("/extract", zValidator("json", extractSchema), async (c) => {
  try {
    const teacherId = c.get("user").id;
    const { fileKey } = c.req.valid("json");

    // Fetch PDF from R2
    const r2Key = `pdfs/${teacherId}/${fileKey}.pdf`;
    const r2Object = await c.env.EXAM_FILES.get(r2Key);

    if (!r2Object) {
      return notFound(c, "PDF file");
    }

    const buffer = new Uint8Array(await r2Object.arrayBuffer());

    // Parse PDF text
    let parsed;
    try {
      parsed = await parsePdf(buffer);
    } catch (err) {
      if (err instanceof PdfParseError) {
        return error(c, err.code, err.message, 400);
      }
      throw err;
    }

    // Extract questions via AI
    const result = await extractQuestions(c.env.AI, parsed.text, parsed.pageCount);

    return success(c, result);
  } catch (err) {
    return error(c, "INTERNAL_ERROR", "Failed to extract questions from PDF", 500);
  }
});

// ---------------------------------------------------------------------------
// POST /confirm — Save reviewed questions to exam or question bank
// ---------------------------------------------------------------------------
const questionSchema = z.object({
  type: z.enum(["multiple_choice", "true_false", "short_answer"]),
  questionText: z.string().min(1),
  options: z.array(z.object({
    label: z.string(),
    text: z.string(),
    isCorrect: z.boolean(),
  })).optional().default([]),
  difficulty: z.enum(["easy", "medium", "hard"]).optional().default("medium"),
  imageUrl: z.string().nullable().optional().default(null),
  correctAnswerText: z.string().nullable().optional().default(null),
});

const confirmSchema = z.object({
  destination: z.enum(["exam", "question_bank"]),
  examId: z.string().optional(),
  subjectId: z.string().optional(),
  questions: z.array(questionSchema).min(1).max(100),
}).refine(
  (data) => {
    if (data.destination === "exam" && !data.examId) return false;
    if (data.destination === "question_bank" && !data.subjectId) return false;
    return true;
  },
  { message: "examId required for exam destination, subjectId required for question_bank" },
);

pdfRoutes.post("/confirm", zValidator("json", confirmSchema), async (c) => {
  try {
    const teacherId = c.get("user").id;
    const body = c.req.valid("json");
    const db = getDb(c.env.educore);
    const ids: string[] = [];

    if (body.destination === "exam") {
      // Verify exam ownership
      const [exam] = await db
        .select()
        .from(exams)
        .where(and(eq(exams.id, body.examId!), eq(exams.teacherId, teacherId)))
        .limit(1);

      if (!exam) return notFound(c, "Exam");

      // Get current question count for orderIndex
      const existing = await db
        .select({ count: sql<number>`count(*)` })
        .from(questions)
        .where(eq(questions.examId, body.examId!));
      let orderIndex = existing[0]?.count ?? 0;

      const now = new Date().toISOString();

      for (const q of body.questions) {
        const questionId = newId();
        ids.push(questionId);

        await db.insert(questions).values({
          id: questionId,
          examId: body.examId!,
          type: q.type,
          questionText: q.questionText,
          difficulty: q.difficulty,
          imageUrl: q.imageUrl,
          correctAnswerText: q.correctAnswerText,
          points: 1,
          orderIndex: orderIndex++,
          createdAt: now,
          updatedAt: now,
        });

        if (q.options.length > 0) {
          const optValues = q.options.map((opt, idx) => ({
            id: newId(),
            questionId,
            label: opt.label,
            text: opt.text,
            isCorrect: opt.isCorrect,
            orderIndex: idx,
          }));
          await db.insert(options).values(optValues);
        }
      }
    } else {
      // question_bank destination — verify subject exists
      const [subject] = await db
        .select()
        .from(subjects)
        .where(eq(subjects.id, body.subjectId!))
        .limit(1);

      if (!subject) return notFound(c, "Subject");

      const now = new Date().toISOString();

      for (const q of body.questions) {
        const bankId = newId();
        ids.push(bankId);

        await db.insert(questionBank).values({
          id: bankId,
          teacherId,
          subjectId: body.subjectId,
          type: q.type,
          difficulty: q.difficulty,
          questionText: q.questionText,
          imageUrl: q.imageUrl,
          correctAnswerText: q.correctAnswerText,
          createdAt: now,
          updatedAt: now,
        });

        if (q.options.length > 0) {
          const optValues = q.options.map((opt, idx) => ({
            id: newId(),
            bankQuestionId: bankId,
            label: opt.label,
            text: opt.text,
            isCorrect: opt.isCorrect,
            orderIndex: idx,
          }));
          await db.insert(questionBankOptions).values(optValues);
        }
      }
    }

    return success(c, {
      saved: body.questions.length,
      destination: body.destination,
      ids,
    }, 201);
  } catch (err) {
    return error(c, "INTERNAL_ERROR", "Failed to save questions", 500);
  }
});

export default pdfRoutes;
