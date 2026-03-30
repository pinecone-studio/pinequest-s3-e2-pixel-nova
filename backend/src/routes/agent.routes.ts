import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getDb, aiExamGeneratorRuns } from "../db";
import type { AppEnv } from "../types";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/role-guard";
import { error, success } from "../utils/response";
import { newId } from "../utils/id";
import {
  generateExamDraft,
  type NormalizedDraftExam,
} from "../utils/exam-generator";

const agentRoutes = new Hono<AppEnv>();

agentRoutes.use("*", authMiddleware, requireRole("teacher"));

const generatorInputSchema = z.object({
  topic: z.string().min(3),
  subject: z.string().trim().optional(),
  gradeOrClass: z.string().trim().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  questionCount: z.number().int().min(1).max(30),
  instructions: z.string().trim().max(1200).optional(),
});

const draftQuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  type: z.enum(["mcq", "text"]),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string(),
  points: z.number().int().positive(),
});

const saveSchema = z.object({
  generatorInput: generatorInputSchema,
  draft: z.object({
    title: z.string().min(1),
    description: z.string().nullable(),
    questions: z.array(draftQuestionSchema).min(1),
  }),
});

agentRoutes.post(
  "/exam-generator/generate",
  zValidator("json", generatorInputSchema),
  async (c) => {
    try {
      const payload = c.req.valid("json");
      const draft = await generateExamDraft(c.env.AI, payload);
      return success(c, { draft });
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Failed to generate exam draft";
      return error(c, "AI_GENERATION_FAILED", message, 502);
    }
  },
);

agentRoutes.post(
  "/exam-generator/save",
  zValidator("json", saveSchema),
  async (c) => {
    try {
      const teacherId = c.get("user").id;
      const payload = c.req.valid("json");
      const db = getDb(c.env.educore);
      const id = newId();
      const now = new Date().toISOString();

      await db.insert(aiExamGeneratorRuns).values({
        id,
        teacherId,
        topic: payload.generatorInput.topic,
        subject: payload.generatorInput.subject ?? null,
        gradeOrClass: payload.generatorInput.gradeOrClass ?? null,
        difficulty: payload.generatorInput.difficulty,
        questionCount: payload.generatorInput.questionCount,
        instructions: payload.generatorInput.instructions ?? null,
        generatedTitle: payload.draft.title,
        draftPayload: JSON.stringify(payload.draft satisfies NormalizedDraftExam),
        status: "accepted",
        createdAt: now,
        updatedAt: now,
      });

      return success(c, { id, status: "accepted" }, 201);
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Failed to save accepted draft";
      return error(c, "INTERNAL_ERROR", message, 500);
    }
  },
);

export default agentRoutes;
