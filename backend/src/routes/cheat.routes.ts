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
