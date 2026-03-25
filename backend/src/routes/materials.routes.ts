import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { getDb, materials, exams } from "../db";
import type { AppEnv } from "../types";
import { success, error, notFound } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/role-guard";
import { newId } from "../utils/id";

const materialRoutes = new Hono<AppEnv>();

materialRoutes.use("*", authMiddleware);

// POST /:examId — Add material to exam (teacher only)
materialRoutes.post(
  "/:examId",
  requireRole("teacher"),
  zValidator("json", z.object({
    fileName: z.string().min(1),
    fileType: z.string().min(1),
    materialType: z.enum(["attachment", "reference"]),
    fileUrl: z.string().min(1),
  })),
  async (c) => {
    try {
      const examId = c.req.param("examId");
      const teacherId = c.get("user").id;
      const body = c.req.valid("json");
      const db = getDb(c.env.educore);

      const [exam] = await db.select().from(exams)
        .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)))
        .limit(1);

      if (!exam) return notFound(c, "Exam");

      const id = newId();
      const now = new Date().toISOString();
      await db.insert(materials).values({
        id,
        examId,
        fileName: body.fileName,
        fileType: body.fileType,
        materialType: body.materialType,
        fileUrl: body.fileUrl,
        createdAt: now,
      });

      const [created] = await db.select().from(materials).where(eq(materials.id, id)).limit(1);
      return success(c, created, 201);
    } catch (err) {
      return error(c, "INTERNAL_ERROR", "Failed to add material", 500);
    }
  },
);

// GET /:examId — List materials for an exam (any authenticated user)
materialRoutes.get("/:examId", async (c) => {
  try {
    const examId = c.req.param("examId");
    const db = getDb(c.env.educore);

    const examMaterials = await db.select().from(materials)
      .where(eq(materials.examId, examId));

    return success(c, examMaterials);
  } catch (err) {
    return error(c, "INTERNAL_ERROR", "Failed to fetch materials", 500);
  }
});

// DELETE /:examId/:materialId — Remove material (teacher only)
materialRoutes.delete("/:examId/:materialId", requireRole("teacher"), async (c) => {
  try {
    const examId = c.req.param("examId");
    const materialId = c.req.param("materialId");
    const teacherId = c.get("user").id;
    const db = getDb(c.env.educore);

    const [exam] = await db.select().from(exams)
      .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)))
      .limit(1);

    if (!exam) return notFound(c, "Exam");

    const [material] = await db.select().from(materials)
      .where(and(eq(materials.id, materialId), eq(materials.examId, examId)))
      .limit(1);

    if (!material) return notFound(c, "Material");

    await db.delete(materials).where(eq(materials.id, materialId));
    return success(c, { deleted: true });
  } catch (err) {
    return error(c, "INTERNAL_ERROR", "Failed to delete material", 500);
  }
});

export default materialRoutes;
