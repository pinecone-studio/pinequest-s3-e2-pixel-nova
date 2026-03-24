import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { getDb, savedExams, exams } from "../db";
import type { AppEnv } from "../types";
import { success, error, notFound } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/role-guard";
import { newId } from "../utils/id";

const savedRoutes = new Hono<AppEnv>();

// Apply auth + student role globally
savedRoutes.use("*", authMiddleware, requireRole("student"));

// POST /:examId — Save/bookmark exam
savedRoutes.post("/:examId", async (c) => {
  const user = c.get("user");
  const examId = c.req.param("examId");
  const db = getDb(c.env.educore);

  // Check exam exists
  const [exam] = await db
    .select({ id: exams.id })
    .from(exams)
    .where(eq(exams.id, examId))
    .limit(1);

  if (!exam) {
    return notFound(c, "Exam");
  }

  // Check if already saved
  const [existing] = await db
    .select({ id: savedExams.id })
    .from(savedExams)
    .where(
      and(
        eq(savedExams.studentId, user.id),
        eq(savedExams.examId, examId)
      )
    )
    .limit(1);

  if (existing) {
    return error(c, "ALREADY_SAVED", "Exam is already saved");
  }

  await db.insert(savedExams).values({
    id: newId(),
    studentId: user.id,
    examId,
  });

  return success(c, { message: "Exam saved successfully" }, 201);
});

// DELETE /:examId — Unsave exam
savedRoutes.delete("/:examId", async (c) => {
  const user = c.get("user");
  const examId = c.req.param("examId");
  const db = getDb(c.env.educore);

  const result = await db
    .delete(savedExams)
    .where(
      and(
        eq(savedExams.studentId, user.id),
        eq(savedExams.examId, examId)
      )
    )
    .returning({ id: savedExams.id });

  if (result.length === 0) {
    return notFound(c, "Saved exam");
  }

  return success(c, { message: "Exam unsaved successfully" });
});

// GET / — List saved exams
savedRoutes.get("/", async (c) => {
  const user = c.get("user");
  const db = getDb(c.env.educore);

  const saved = await db
    .select({
      id: savedExams.id,
      examId: savedExams.examId,
      title: exams.title,
      description: exams.description,
      status: exams.status,
      savedAt: savedExams.createdAt,
    })
    .from(savedExams)
    .innerJoin(exams, eq(savedExams.examId, exams.id))
    .where(eq(savedExams.studentId, user.id));

  return success(c, saved);
});

export default savedRoutes;
