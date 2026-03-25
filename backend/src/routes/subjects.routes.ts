import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, subjects } from "../db";
import type { AppEnv } from "../types";
import { success, error, notFound } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/role-guard";
import { newId } from "../utils/id";

const subjectRoutes = new Hono<AppEnv>();

subjectRoutes.use("*", authMiddleware);

// POST / — Create subject (teacher only)
subjectRoutes.post(
  "/",
  requireRole("teacher"),
  zValidator("json", z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    description: z.string().optional(),
  })),
  async (c) => {
    try {
      const body = c.req.valid("json");
      const db = getDb(c.env.educore);
      const id = newId();
      const now = new Date().toISOString();

      await db.insert(subjects).values({
        id,
        name: body.name,
        code: body.code,
        description: body.description,
        createdAt: now,
        updatedAt: now,
      });

      const [created] = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1);
      return success(c, created, 201);
    } catch (err) {
      return error(c, "INTERNAL_ERROR", "Failed to create subject", 500);
    }
  },
);

// GET / — List all subjects (any authenticated user)
subjectRoutes.get("/", async (c) => {
  try {
    const db = getDb(c.env.educore);
    const allSubjects = await db.select().from(subjects);
    return success(c, allSubjects);
  } catch (err) {
    return error(c, "INTERNAL_ERROR", "Failed to fetch subjects", 500);
  }
});

// PUT /:id — Update subject (teacher only)
subjectRoutes.put(
  "/:id",
  requireRole("teacher"),
  zValidator("json", z.object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    description: z.string().optional(),
  })),
  async (c) => {
    try {
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const db = getDb(c.env.educore);

      const [existing] = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1);
      if (!existing) return notFound(c, "Subject");

      const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
      if (body.name !== undefined) updates.name = body.name;
      if (body.code !== undefined) updates.code = body.code;
      if (body.description !== undefined) updates.description = body.description;

      await db.update(subjects).set(updates).where(eq(subjects.id, id));
      const [updated] = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1);
      return success(c, updated);
    } catch (err) {
      return error(c, "INTERNAL_ERROR", "Failed to update subject", 500);
    }
  },
);

// DELETE /:id — Delete subject (teacher only)
subjectRoutes.delete("/:id", requireRole("teacher"), async (c) => {
  try {
    const id = c.req.param("id");
    const db = getDb(c.env.educore);

    const [existing] = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1);
    if (!existing) return notFound(c, "Subject");

    await db.delete(subjects).where(eq(subjects.id, id));
    return success(c, { deleted: true });
  } catch (err) {
    return error(c, "INTERNAL_ERROR", "Failed to delete subject", 500);
  }
});

export default subjectRoutes;
