import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { getDb, exams, examSessions, cheatEvents, students } from "../db";
import type { AppEnv } from "../types";
import { success, error, notFound, forbidden } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/role-guard";
import { newId } from "../utils/id";

const cheatRoutes = new Hono<AppEnv>();

cheatRoutes.use("*", authMiddleware);

// ---------------------------------------------------------------------------
// Severity mapping
// ---------------------------------------------------------------------------
const EVENT_TYPES = [
  "tab_switch",
  "tab_hidden",
  "window_blur",
  "copy_paste",
  "right_click",
  "screen_capture",
  "devtools_open",
  "multiple_monitors",
  "suspicious_resize",
  "rapid_answers",
  "idle_too_long",
  "face_missing",
  "multiple_faces",
  "looking_away",
  "looking_down",
  "disqualification",
] as const;

type EventType = (typeof EVENT_TYPES)[number];
const CAMERA_EVENT_TYPES = [
  "face_missing",
  "multiple_faces",
  "looking_away",
  "looking_down",
] as const;

type CameraEventType = (typeof CAMERA_EVENT_TYPES)[number];

const SEVERITY_MAP: Record<EventType, { severity: string; weight: number }> = {
  right_click:        { severity: "low",      weight: 1 },
  suspicious_resize:  { severity: "low",      weight: 1 },
  tab_switch:         { severity: "medium",   weight: 2 },
  tab_hidden:         { severity: "medium",   weight: 2 },
  window_blur:        { severity: "medium",   weight: 2 },
  idle_too_long:      { severity: "medium",   weight: 2 },
  face_missing:       { severity: "medium",   weight: 2 },
  looking_down:       { severity: "medium",   weight: 2 },
  copy_paste:         { severity: "high",     weight: 4 },
  devtools_open:      { severity: "high",     weight: 4 },
  rapid_answers:      { severity: "high",     weight: 4 },
  looking_away:       { severity: "high",     weight: 4 },
  screen_capture:     { severity: "critical", weight: 8 },
  multiple_monitors:  { severity: "critical", weight: 8 },
  multiple_faces:     { severity: "critical", weight: 8 },
  disqualification:   { severity: "critical", weight: 8 },
};

const FLAG_THRESHOLD = 6;

const SNAPSHOT_INTERVAL_MS = 15_000;
const SNAPSHOT_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    faceCount: { type: "integer", minimum: 0, maximum: 10 },
    lookingDirection: {
      type: "string",
      enum: ["forward", "left", "right", "down", "up", "unclear"],
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    suspiciousEvents: {
      type: "array",
      items: {
        type: "object",
        properties: {
          eventType: {
            type: "string",
            enum: [...CAMERA_EVENT_TYPES],
          },
          reason: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
        required: ["eventType", "reason", "confidence"],
      },
      maxItems: 4,
    },
  },
  required: [
    "summary",
    "faceCount",
    "lookingDirection",
    "confidence",
    "suspiciousEvents",
  ],
} as const;

const SNAPSHOT_SYSTEM_PROMPT = `You are an exam proctoring vision reviewer.
Analyze a single front-camera snapshot from a student taking an exam on a phone.

Rules:
- Be conservative. If the image is blurry or ambiguous, avoid flagging.
- Use "face_missing" only when no human face is clearly visible.
- Use "multiple_faces" only when more than one human face is visible.
- Use "looking_away" only when the main student is clearly looking left or right away from the phone.
- Use "looking_down" only when the main student is clearly looking downward.
- Mild head tilt or uncertain pose is not suspicious.
- Always return valid JSON matching the provided schema.`;

const snapshotAnalysisResponseSchema = z.object({
  summary: z.string().trim().min(1).max(400),
  faceCount: z.number().int().min(0).max(10),
  lookingDirection: z.enum([
    "forward",
    "left",
    "right",
    "down",
    "up",
    "unclear",
  ]),
  confidence: z.number().min(0).max(1),
  suspiciousEvents: z
    .array(
      z.object({
        eventType: z.enum(CAMERA_EVENT_TYPES),
        reason: z.string().trim().min(1).max(240),
        confidence: z.number().min(0).max(1),
      }),
    )
    .max(4),
});

type SnapshotAnalysis = z.infer<typeof snapshotAnalysisResponseSchema>;
type SnapshotAnalysisResponse = SnapshotAnalysis & {
  source: "mobile_camera_ai";
};

const analyzeSnapshotSchema = z.object({
  sessionId: z.string().min(1),
  imageDataUrl: z
    .string()
    .min(1)
    .max(6_500_000)
    .regex(
      /^data:(image\/(?:png|jpeg|jpg|webp));base64,[a-z0-9+/=]+$/i,
      "Unsupported image data URL",
    ),
  capturedAt: z.string().datetime().optional(),
});

const clampConfidence = (value: number) =>
  Math.max(0, Math.min(1, Math.round(value * 100) / 100));

const parseAiJsonResponse = (response: unknown) => {
  if (typeof response === "string") {
    return JSON.parse(response);
  }

  if (response && typeof response === "object" && "response" in response) {
    const payload = (response as { response: unknown }).response;
    if (typeof payload === "string") {
      return JSON.parse(payload);
    }
    return payload;
  }

  return response;
};

const ensureEvent = (
  events: SnapshotAnalysis["suspiciousEvents"],
  eventType: CameraEventType,
  reason: string,
  confidence: number,
) => {
  if (events.some((event) => event.eventType === eventType)) {
    return events;
  }

  return [
    ...events,
    {
      eventType,
      reason,
      confidence: clampConfidence(confidence),
    },
  ];
};

const normalizeSnapshotAnalysis = (
  payload: SnapshotAnalysis,
): SnapshotAnalysisResponse => {
  let suspiciousEvents = payload.suspiciousEvents
    .filter((event, index, events) => {
      return events.findIndex((candidate) => candidate.eventType === event.eventType) === index;
    })
    .map((event) => ({
      ...event,
      confidence: clampConfidence(event.confidence),
    }));

  if (payload.faceCount === 0) {
    suspiciousEvents = ensureEvent(
      suspiciousEvents,
      "face_missing",
      "No clear human face is visible in the snapshot.",
      Math.max(payload.confidence, 0.8),
    );
  }

  if (payload.faceCount > 1) {
    suspiciousEvents = ensureEvent(
      suspiciousEvents,
      "multiple_faces",
      "More than one human face is visible in the snapshot.",
      Math.max(payload.confidence, 0.8),
    );
  }

  if (payload.faceCount === 1 && payload.lookingDirection === "down") {
    suspiciousEvents = ensureEvent(
      suspiciousEvents,
      "looking_down",
      "The student appears to be looking downward instead of at the phone.",
      Math.max(payload.confidence, 0.7),
    );
  }

  if (
    payload.faceCount === 1 &&
    (payload.lookingDirection === "left" || payload.lookingDirection === "right")
  ) {
    suspiciousEvents = ensureEvent(
      suspiciousEvents,
      "looking_away",
      "The student appears to be looking away from the phone.",
      Math.max(payload.confidence, 0.7),
    );
  }

  if (payload.faceCount !== 1) {
    suspiciousEvents = suspiciousEvents.filter(
      (event) =>
        event.eventType !== "looking_away" && event.eventType !== "looking_down",
    );
  }

  return {
    source: "mobile_camera_ai",
    summary: payload.summary,
    faceCount: payload.faceCount,
    lookingDirection: payload.lookingDirection,
    confidence: clampConfidence(payload.confidence),
    suspiciousEvents: suspiciousEvents.slice(0, 4),
  };
};

const analyzeSnapshotWithAi = async (
  ai: Ai,
  imageDataUrl: string,
): Promise<SnapshotAnalysisResponse> => {
  const response = await ai.run("@cf/meta/llama-3.2-11b-vision-instruct" as any, {
    messages: [
      {
        role: "system",
        content: SNAPSHOT_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content:
          `Check this exam snapshot and decide whether it shows ` +
          `face_missing, multiple_faces, looking_away, or looking_down. ` +
          `A snapshot is captured about every ${Math.round(
            SNAPSHOT_INTERVAL_MS / 1000,
          )} seconds.`,
      },
    ],
    image: imageDataUrl,
    max_tokens: 600,
    temperature: 0.1,
    response_format: {
      type: "json_schema",
      json_schema: SNAPSHOT_ANALYSIS_SCHEMA,
    },
  } as any);

  const parsed = snapshotAnalysisResponseSchema.parse(parseAiJsonResponse(response));
  return normalizeSnapshotAnalysis(parsed);
};

// ---------------------------------------------------------------------------
// POST /event — Report a cheat event (student only)
// ---------------------------------------------------------------------------
const eventSchema = z.object({
  sessionId: z.string().min(1),
  eventType: z.enum(EVENT_TYPES),
  metadata: z.string().optional(),
});

cheatRoutes.post("/event", requireRole("student"), zValidator("json", eventSchema), async (c) => {
  const { sessionId, eventType, metadata } = c.req.valid("json");
  const user = c.get("user");
  const db = getDb(c.env.educore);

  // Verify session belongs to student
  const [session] = await db
    .select()
    .from(examSessions)
    .where(and(eq(examSessions.id, sessionId), eq(examSessions.studentId, user.id)))
    .limit(1);

  if (!session) {
    return notFound(c, "Session");
  }

  const { severity } = SEVERITY_MAP[eventType];

  // Insert cheat event
  const eventId = newId();
  await db.insert(cheatEvents).values({
    id: eventId,
    sessionId,
    examId: session.examId,
    studentId: user.id,
    eventType,
    severity,
    metadata: metadata ?? null,
    isNotified: false,
  });

  // Recalculate weighted score for this session
  const sessionEvents = await db
    .select({ eventType: cheatEvents.eventType })
    .from(cheatEvents)
    .where(eq(cheatEvents.sessionId, sessionId));

  let weightedScore = 0;
  for (const evt of sessionEvents) {
    const mapping = SEVERITY_MAP[evt.eventType as EventType];
    if (mapping) {
      weightedScore += mapping.weight;
    }
  }

  const isFlagged = weightedScore >= FLAG_THRESHOLD;
  const flagCount = sessionEvents.length;

  // Update session flag status
  await db
    .update(examSessions)
    .set({ isFlagged, flagCount })
    .where(eq(examSessions.id, sessionId));

  return success(c, { eventId, flagged: isFlagged }, 201);
});

// ---------------------------------------------------------------------------
// POST /analyze-snapshot — Analyze a periodic camera snapshot (student only)
// ---------------------------------------------------------------------------
cheatRoutes.post(
  "/analyze-snapshot",
  requireRole("student"),
  zValidator("json", analyzeSnapshotSchema),
  async (c) => {
    const { sessionId, imageDataUrl } = c.req.valid("json");
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

    try {
      const analysis = await analyzeSnapshotWithAi(c.env.AI, imageDataUrl);
      return success(c, analysis);
    } catch (err) {
      console.error("snapshot-analysis-failed", err);
      return error(
        c,
        "AI_ANALYSIS_FAILED",
        "Could not analyze the camera snapshot right now.",
        502,
      );
    }
  },
);

// ---------------------------------------------------------------------------
// GET /events/:examId — All cheat events for an exam (teacher only)
// ---------------------------------------------------------------------------
cheatRoutes.get("/events/:examId", requireRole("teacher"), async (c) => {
  const examId = c.req.param("examId");
  const db = getDb(c.env.educore);

  // Verify exam exists and teacher owns it
  const [exam] = await db
    .select()
    .from(exams)
    .where(and(eq(exams.id, examId), eq(exams.teacherId, c.get("user").id)))
    .limit(1);

  if (!exam) {
    return notFound(c, "Exam");
  }

  const events = await db
    .select()
    .from(cheatEvents)
    .where(eq(cheatEvents.examId, examId))
    .orderBy(sql`${cheatEvents.createdAt} DESC`);

  return success(c, events);
});

// ---------------------------------------------------------------------------
// GET /events/:examId/:studentId — Cheat events for specific student (teacher only)
// ---------------------------------------------------------------------------
cheatRoutes.get("/events/:examId/:studentId", requireRole("teacher"), async (c) => {
  const examId = c.req.param("examId");
  const studentId = c.req.param("studentId");
  const db = getDb(c.env.educore);

  // Verify exam exists and teacher owns it
  const [exam] = await db
    .select()
    .from(exams)
    .where(and(eq(exams.id, examId), eq(exams.teacherId, c.get("user").id)))
    .limit(1);

  if (!exam) {
    return notFound(c, "Exam");
  }

  const events = await db
    .select()
    .from(cheatEvents)
    .where(and(eq(cheatEvents.examId, examId), eq(cheatEvents.studentId, studentId)))
    .orderBy(sql`${cheatEvents.createdAt} DESC`);

  return success(c, events);
});

// ---------------------------------------------------------------------------
// GET /flagged/:examId — List flagged students for an exam (teacher only)
// ---------------------------------------------------------------------------
cheatRoutes.get("/flagged/:examId", requireRole("teacher"), async (c) => {
  const examId = c.req.param("examId");
  const db = getDb(c.env.educore);

  // Verify exam exists and teacher owns it
  const [exam] = await db
    .select()
    .from(exams)
    .where(and(eq(exams.id, examId), eq(exams.teacherId, c.get("user").id)))
    .limit(1);

  if (!exam) {
    return notFound(c, "Exam");
  }

  // Query flagged sessions joined with students
  const flaggedSessions = await db
    .select({
      studentId: examSessions.studentId,
      fullName: students.fullName,
      flagCount: examSessions.flagCount,
    })
    .from(examSessions)
    .innerJoin(students, eq(examSessions.studentId, students.id))
    .where(and(eq(examSessions.examId, examId), eq(examSessions.isFlagged, true)));

  // For each flagged student, count cheat events
  const result = await Promise.all(
    flaggedSessions.map(async (fs) => {
      const [eventCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(cheatEvents)
        .where(and(eq(cheatEvents.examId, examId), eq(cheatEvents.studentId, fs.studentId)));

      return {
        studentId: fs.studentId,
        fullName: fs.fullName,
        flagCount: fs.flagCount,
        eventCount: eventCount.count,
      };
    })
  );

  return success(c, result);
});

// ---------------------------------------------------------------------------
// GET /notifications/:examId — Poll for new notifications (teacher only)
// ---------------------------------------------------------------------------
cheatRoutes.get("/notifications/:examId", requireRole("teacher"), async (c) => {
  const examId = c.req.param("examId");
  const db = getDb(c.env.educore);

  // Verify exam exists and teacher owns it
  const [exam] = await db
    .select()
    .from(exams)
    .where(and(eq(exams.id, examId), eq(exams.teacherId, c.get("user").id)))
    .limit(1);

  if (!exam) {
    return notFound(c, "Exam");
  }

  // Fetch un-notified events
  const events = await db
    .select()
    .from(cheatEvents)
    .where(and(eq(cheatEvents.examId, examId), eq(cheatEvents.isNotified, false)))
    .orderBy(sql`${cheatEvents.createdAt} DESC`);

  // Mark them as notified
  if (events.length > 0) {
    await db
      .update(cheatEvents)
      .set({ isNotified: true })
      .where(and(eq(cheatEvents.examId, examId), eq(cheatEvents.isNotified, false)));
  }

  return success(c, events);
});

// ---------------------------------------------------------------------------
// POST /notifications/:examId/ack — Acknowledge all notifications (teacher only)
// ---------------------------------------------------------------------------
cheatRoutes.post("/notifications/:examId/ack", requireRole("teacher"), async (c) => {
  const examId = c.req.param("examId");
  const db = getDb(c.env.educore);

  // Verify exam exists and teacher owns it
  const [exam] = await db
    .select()
    .from(exams)
    .where(and(eq(exams.id, examId), eq(exams.teacherId, c.get("user").id)))
    .limit(1);

  if (!exam) {
    return notFound(c, "Exam");
  }

  await db
    .update(cheatEvents)
    .set({ isNotified: true })
    .where(eq(cheatEvents.examId, examId));

  return success(c, { acknowledged: true });
});

// ---------------------------------------------------------------------------
// POST /disqualify/:sessionId — Teacher disqualifies a student session
// ---------------------------------------------------------------------------
const disqualifySchema = z.object({
  reason: z.string().min(1),
});

cheatRoutes.post("/disqualify/:sessionId", requireRole("teacher"), zValidator("json", disqualifySchema), async (c) => {
  const sessionId = c.req.param("sessionId");
  const { reason } = c.req.valid("json");
  const user = c.get("user");
  const db = getDb(c.env.educore);

  // Fetch the session
  const [session] = await db
    .select()
    .from(examSessions)
    .where(eq(examSessions.id, sessionId))
    .limit(1);

  if (!session) {
    return notFound(c, "Session");
  }

  // Verify teacher owns the exam
  const [exam] = await db
    .select()
    .from(exams)
    .where(and(eq(exams.id, session.examId), eq(exams.teacherId, user.id)))
    .limit(1);

  if (!exam) {
    return forbidden(c, "You do not own this exam");
  }

  // Only allow disqualification of active sessions
  if (session.status !== "in_progress" && session.status !== "submitted") {
    return error(c, "INVALID_STATUS", "Can only disqualify sessions that are in progress or submitted", 400);
  }

  // Update session status to disqualified
  await db
    .update(examSessions)
    .set({ status: "disqualified" })
    .where(eq(examSessions.id, sessionId));

  // Insert a cheat event for the disqualification
  const eventId = newId();
  await db.insert(cheatEvents).values({
    id: eventId,
    sessionId,
    examId: session.examId,
    studentId: session.studentId,
    eventType: "disqualification",
    severity: "critical",
    metadata: JSON.stringify({ reason }),
    isNotified: false,
  });

  // Fetch the updated session
  const [updatedSession] = await db
    .select()
    .from(examSessions)
    .where(eq(examSessions.id, sessionId))
    .limit(1);

  return success(c, updatedSession);
});

export default cheatRoutes;
