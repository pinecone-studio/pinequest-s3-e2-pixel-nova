import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import {
  getDb,
  exams,
  examSessions,
  cheatEvents,
  students,
  examAudioChunks,
} from "../db";
import type { AppEnv } from "../types";
import { success, error, notFound, forbidden } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/role-guard";
import { newId } from "../utils/id";
import { notifyTeacherStudentFlagged } from "../services/notifications";
import { createR2PresignedUrl } from "../utils/r2-presign";
import { parseEnabledCheatDetections } from "../utils/exam-cheat-detections";

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
  "camera_blocked",
  "microphone_permission_denied",
  "audio_recording_interrupted",
  "audio_upload_failed",
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
  camera_blocked:     { severity: "high",     weight: 4 },
  microphone_permission_denied: { severity: "critical", weight: 8 },
  audio_recording_interrupted: { severity: "critical", weight: 8 },
  audio_upload_failed: { severity: "high", weight: 4 },
  disqualification:   { severity: "critical", weight: 8 },
};

const FLAG_THRESHOLD = 6;
const HIGH_RISK_THRESHOLD = 8;
const CRITICAL_RISK_THRESHOLD = 12;

const EVENT_SOURCES = [
  "browser",
  "browser_camera",
  "browser_audio",
  "mobile_camera",
  "mobile_camera_ai",
  "teacher_action",
  "system",
  "unknown",
] as const;

type EventSource = (typeof EVENT_SOURCES)[number];
type RiskLevel = "low" | "medium" | "high" | "critical";
const ALWAYS_ALLOWED_EVENT_TYPES: EventType[] = [
  "disqualification",
  "microphone_permission_denied",
  "audio_recording_interrupted",
  "audio_upload_failed",
];

const EVENT_COOLDOWN_MS: Partial<Record<EventType, number>> = {
  tab_switch: 5_000,
  tab_hidden: 5_000,
  window_blur: 5_000,
  copy_paste: 3_000,
  right_click: 3_000,
  devtools_open: 10_000,
  multiple_monitors: 15_000,
  suspicious_resize: 10_000,
  rapid_answers: 10_000,
  idle_too_long: 60_000,
  face_missing: 15_000,
  multiple_faces: 15_000,
  looking_away: 15_000,
  looking_down: 15_000,
  camera_blocked: 20_000,
  microphone_permission_denied: 0,
  audio_recording_interrupted: 0,
  audio_upload_failed: 15_000,
  disqualification: 0,
};

const EVENT_LABELS = {
  tab_switch: "Таб сольсон",
  tab_hidden: "Бүтэн дэлгэцээс гарсан",
  window_blur: "Цонхноос гарсан",
  copy_paste: "Хуулах эсвэл буулгах оролдлого",
  right_click: "Баруун товшилт",
  screen_capture: "Дэлгэцийн зураг авалт",
  devtools_open: "Developer tools нээх оролдлого",
  multiple_monitors: "Олон дэлгэц ашигласан",
  suspicious_resize: "Сэжигтэй хэмжээс өөрчлөлт",
  rapid_answers: "Хэт хурдан хариулсан",
  idle_too_long: "Хэт удаан идэвхгүй байсан",
  face_missing: "Нүүр илрээгүй",
  multiple_faces: "Олон нүүр илэрсэн",
  looking_away: "Хажуу тийш харсан",
  looking_down: "Доош харсан",
  camera_blocked: "Камер хаагдсан",
  disqualification: "Шалгалтаас хасагдсан",
};

Object.assign(EVENT_LABELS, {
  microphone_permission_denied: "Microphone permission denied",
  audio_recording_interrupted: "Audio recording interrupted",
  audio_upload_failed: "Audio upload failed",
} satisfies Record<string, string>);

const SNAPSHOT_INTERVAL_MS = 15_000;
const SNAPSHOT_OBJECT_PREFIX = "cheat-snapshots";
const AUDIO_OBJECT_PREFIX = "cheat-audio";
const SNAPSHOT_UPLOAD_URL_TTL_SECONDS = 10 * 60;
const AUDIO_UPLOAD_URL_TTL_SECONDS = 10 * 60;
const DEFAULT_SNAPSHOT_BUCKET_NAME = "educore-exam-files";
const SNAPSHOT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
type SnapshotMimeType = (typeof SNAPSHOT_MIME_TYPES)[number];

const SNAPSHOT_EXTENSION_MAP: Record<SnapshotMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
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

const baseAnalyzeSnapshotSchema = z.object({
  sessionId: z.string().min(1),
  capturedAt: z.string().datetime().optional(),
});

const analyzeSnapshotDataUrlSchema = baseAnalyzeSnapshotSchema.extend({
  imageDataUrl: z
    .string()
    .min(1)
    .max(6_500_000)
    .regex(
      /^data:(image\/(?:png|jpeg|jpg|webp));base64,[a-z0-9+/=]+$/i,
      "Unsupported image data URL",
    ),
});

const analyzeSnapshotObjectSchema = baseAnalyzeSnapshotSchema.extend({
  imageUrl: z.string().url().optional(),
  objectKey: z.string().min(1).max(512),
});

const analyzeSnapshotSchema = z.union([
  analyzeSnapshotDataUrlSchema,
  analyzeSnapshotObjectSchema,
]);

const snapshotUploadSchema = z.object({
  sessionId: z.string().min(1),
  mimeType: z.enum(SNAPSHOT_MIME_TYPES),
  capturedAt: z.string().datetime().optional(),
});

const AUDIO_MIME_TYPES = [
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/ogg",
  "audio/ogg;codecs=opus",
  "audio/m4a",
  "audio/mp4",
] as const;
type AudioMimeType = (typeof AUDIO_MIME_TYPES)[number];

const AUDIO_EXTENSION_MAP: Record<AudioMimeType, string> = {
  "audio/webm": "webm",
  "audio/webm;codecs=opus": "webm",
  "audio/ogg": "ogg",
  "audio/ogg;codecs=opus": "ogg",
  "audio/m4a": "m4a",
  "audio/mp4": "m4a",
};

const audioUploadSchema = z.object({
  sessionId: z.string().min(1),
  mimeType: z.enum(AUDIO_MIME_TYPES),
  sequenceNumber: z.number().int().min(0),
  chunkStartedAt: z.string().datetime(),
  chunkEndedAt: z.string().datetime(),
  durationMs: z.number().int().positive(),
  sizeBytes: z.number().int().positive(),
});

const audioChunkFinalizeSchema = audioUploadSchema.extend({
  objectKey: z.string().min(1).max(512),
});

const clampConfidence = (value: number) =>
  Math.max(0, Math.min(1, Math.round(value * 100) / 100));

const getSnapshotBucketName = (env: AppEnv["Bindings"]) =>
  env.R2_BUCKET_NAME?.trim() || DEFAULT_SNAPSHOT_BUCKET_NAME;

const buildSnapshotObjectKey = ({
  extension,
  sessionId,
  studentId,
}: {
  extension: string;
  sessionId: string;
  studentId: string;
}) => {
  return `${SNAPSHOT_OBJECT_PREFIX}/${sessionId}/${studentId}/${Date.now()}-${newId()}.${extension}`;
};

const buildAudioObjectKey = ({
  extension,
  sequenceNumber,
  sessionId,
  studentId,
}: {
  extension: string;
  sequenceNumber: number;
  sessionId: string;
  studentId: string;
}) => {
  return `${AUDIO_OBJECT_PREFIX}/${sessionId}/${studentId}/${String(
    sequenceNumber,
  ).padStart(6, "0")}-${Date.now()}-${newId()}.${extension}`;
};

const parseSnapshotObjectKey = (objectKey: string) => {
  const match = objectKey.match(
    /^cheat-snapshots\/([^/]+)\/([^/]+)\/[^/]+\.(jpg|png|webp)$/i,
  );

  if (!match) {
    return null;
  }

  return {
    sessionId: match[1],
    studentId: match[2],
  };
};

const parseAudioObjectKey = (objectKey: string) => {
  const match = objectKey.match(
    /^cheat-audio\/([^/]+)\/([^/]+)\/[^/]+\.(webm|ogg|m4a)$/i,
  );

  if (!match) {
    return null;
  }

  return {
    sessionId: match[1],
    studentId: match[2],
  };
};

const buildSnapshotAssetUrl = (requestUrl: string, objectKey: string) => {
  const url = new URL("/api/cheat/snapshot-assets", requestUrl);
  url.searchParams.set("key", objectKey);
  return url.toString();
};

const buildAudioAssetUrl = (requestUrl: string, objectKey: string) => {
  const url = new URL("/api/cheat/audio-assets", requestUrl);
  url.searchParams.set("key", objectKey);
  return url.toString();
};

const inferSnapshotMimeType = (objectKey: string): SnapshotMimeType => {
  if (objectKey.endsWith(".png")) {
    return "image/png";
  }

  if (objectKey.endsWith(".webp")) {
    return "image/webp";
  }

  return "image/jpeg";
};

const inferAudioMimeType = (objectKey: string): AudioMimeType => {
  if (objectKey.endsWith(".ogg")) {
    return "audio/ogg";
  }

  if (objectKey.endsWith(".m4a")) {
    return "audio/m4a";
  }

  return "audio/webm";
};

const ensureSnapshotSigningConfig = (env: AppEnv["Bindings"]) => {
  const accountId = env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim();

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return {
    accessKeyId,
    accountId,
    secretAccessKey,
  };
};

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

const snapshotObjectToDataUrl = async (
  snapshotObject: R2ObjectBody,
  objectKey: string,
) => {
  const contentType =
    (snapshotObject.httpMetadata?.contentType as SnapshotMimeType | undefined) ??
    inferSnapshotMimeType(objectKey);
  const buffer = Buffer.from(await snapshotObject.arrayBuffer());
  return `data:${contentType};base64,${buffer.toString("base64")}`;
};

const verifyStudentSession = async (
  db: ReturnType<typeof getDb>,
  sessionId: string,
  studentId: string,
) => {
  const [session] = await db
    .select()
    .from(examSessions)
    .where(and(eq(examSessions.id, sessionId), eq(examSessions.studentId, studentId)))
    .limit(1);

  return session ?? null;
};

const verifyTeacherSnapshotAccess = async (
  db: ReturnType<typeof getDb>,
  sessionId: string,
  teacherId: string,
) => {
  const [exam] = await db
    .select({ examId: examSessions.examId })
    .from(examSessions)
    .innerJoin(exams, eq(examSessions.examId, exams.id))
    .where(and(eq(examSessions.id, sessionId), eq(exams.teacherId, teacherId)))
    .limit(1);

  return exam ?? null;
};

const structuredDetailValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

const eventSchema = z.object({
  sessionId: z.string().min(1),
  eventType: z.enum(EVENT_TYPES),
  source: z.enum(EVENT_SOURCES).optional(),
  confidence: z.number().min(0).max(1).optional(),
  details: z.record(z.string(), structuredDetailValueSchema).optional(),
  metadata: z.string().optional(),
});

type StructuredEventPayload = z.infer<typeof eventSchema>;

type StoredCheatEvent = {
  eventType: EventType;
  eventSource: EventSource | string | null;
  createdAt: string;
};

const parseStructuredMetadata = (payload: StructuredEventPayload) => {
  let rawMetadata: unknown = null;
  if (payload.metadata) {
    try {
      rawMetadata = JSON.parse(payload.metadata);
    } catch {
      rawMetadata = payload.metadata;
    }
  }

  const metadataRecord =
    rawMetadata && typeof rawMetadata === "object" && !Array.isArray(rawMetadata)
      ? (rawMetadata as Record<string, unknown>)
      : {};
  const detailsRecord = payload.details ?? {};
  const source =
    payload.source ??
    (typeof metadataRecord.source === "string"
      ? (metadataRecord.source as EventSource)
      : "unknown");
  const confidence =
    payload.confidence ??
    (typeof metadataRecord.confidence === "number"
      ? clampConfidence(metadataRecord.confidence)
      : undefined);

  const normalizedDetails = Object.entries({
    ...detailsRecord,
    ...metadataRecord,
  }).reduce<Record<string, string | number | boolean | null>>((acc, [key, value]) => {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      acc[key] = value;
    }
    return acc;
  }, {});

  delete normalizedDetails.source;
  delete normalizedDetails.confidence;
  delete normalizedDetails.timestamp;

  return {
    confidence,
    details: normalizedDetails,
    source: EVENT_SOURCES.includes(source as EventSource)
      ? (source as EventSource)
      : "unknown",
  };
};

const buildEventDedupeKey = ({
  eventType,
  source,
  details,
}: {
  eventType: EventType;
  source: EventSource;
  details: Record<string, string | number | boolean | null>;
}) => {
  const stableDetails = Object.entries(details)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${String(value)}`)
    .join("|");

  return [eventType, source, stableDetails].filter(Boolean).join("::");
};

const parseTimestamp = (value: string | null | undefined) => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const shouldThrottleEvent = ({
  dedupeKey,
  eventType,
  previousEvent,
}: {
  dedupeKey: string;
  eventType: EventType;
  previousEvent:
    | {
        createdAt: string;
        dedupeKey: string | null;
      }
    | null;
}) => {
  if (!previousEvent || !previousEvent.createdAt) {
    return false;
  }

  const previousTimestamp = parseTimestamp(previousEvent.createdAt);
  if (previousTimestamp === null) {
    return false;
  }

  const cooldownMs = EVENT_COOLDOWN_MS[eventType] ?? 0;
  if (cooldownMs <= 0) {
    return false;
  }

  return (
    previousEvent.dedupeKey === dedupeKey &&
    Date.now() - previousTimestamp < cooldownMs
  );
};

const computeRiskLevel = (
  violationScore: number,
  uniqueSources: number,
): RiskLevel => {
  if (
    violationScore >= CRITICAL_RISK_THRESHOLD ||
    (violationScore >= HIGH_RISK_THRESHOLD && uniqueSources >= 2)
  ) {
    return "critical";
  }
  if (
    violationScore >= HIGH_RISK_THRESHOLD ||
    (violationScore >= FLAG_THRESHOLD && uniqueSources >= 2)
  ) {
    return "high";
  }
  if (violationScore >= 3) {
    return "medium";
  }
  return "low";
};

const summarizeSessionRisk = (events: StoredCheatEvent[]) => {
  const uniqueSources = new Set<string>();
  let violationScore = 0;
  let topViolationType: EventType | null = null;
  let topViolationWeight = -1;
  let topViolationCount = -1;
  let lastViolationAt: string | null = null;
  const countsByType = new Map<EventType, number>();

  for (const event of events) {
    const eventType = event.eventType;
    const source = event.eventSource ?? "unknown";
    uniqueSources.add(source);
    violationScore += SEVERITY_MAP[eventType]?.weight ?? 0;

    const nextCount = (countsByType.get(eventType) ?? 0) + 1;
    countsByType.set(eventType, nextCount);

    const weight = SEVERITY_MAP[eventType]?.weight ?? 0;
    if (
      weight > topViolationWeight ||
      (weight === topViolationWeight && nextCount > topViolationCount)
    ) {
      topViolationType = eventType;
      topViolationWeight = weight;
      topViolationCount = nextCount;
    }

    if (!lastViolationAt || (parseTimestamp(event.createdAt) ?? 0) > (parseTimestamp(lastViolationAt) ?? 0)) {
      lastViolationAt = event.createdAt;
    }
  }

  const riskLevel = computeRiskLevel(violationScore, uniqueSources.size);

  return {
    flagCount: events.length,
    isFlagged: violationScore >= FLAG_THRESHOLD || riskLevel === "high" || riskLevel === "critical",
    lastViolationAt,
    riskLevel,
    topViolationType,
    violationScore,
  };
};

const getSessionRiskSummary = async (
  db: ReturnType<typeof getDb>,
  sessionId: string,
) => {
  const sessionEvents = await db
    .select({
      createdAt: cheatEvents.createdAt,
      eventSource: cheatEvents.eventSource,
      eventType: cheatEvents.eventType,
    })
    .from(cheatEvents)
    .where(eq(cheatEvents.sessionId, sessionId));

  return summarizeSessionRisk(sessionEvents as StoredCheatEvent[]);
};

const parseJsonField = (value: string | null | undefined) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const formatCheatEventForResponse = <
  T extends {
    confidence?: number | null;
    details?: string | null;
    metadata?: string | null;
  },
>(
  event: T,
) => ({
  ...event,
  details: parseJsonField(event.details ?? null),
  metadata: parseJsonField(event.metadata ?? null),
});

// ---------------------------------------------------------------------------
// POST /snapshot-upload-url — Create a presigned upload URL for a camera snapshot
// ---------------------------------------------------------------------------
cheatRoutes.post(
  "/snapshot-upload-url",
  requireRole("student"),
  zValidator("json", snapshotUploadSchema),
  async (c) => {
    const { mimeType, sessionId } = c.req.valid("json");
    const user = c.get("user");
    const db = getDb(c.env.educore);

    const session = await verifyStudentSession(db, sessionId, user.id);
    if (!session) {
      return notFound(c, "Session");
    }

    const signingConfig = ensureSnapshotSigningConfig(c.env);
    if (!signingConfig) {
      return error(
        c,
        "R2_UPLOAD_NOT_CONFIGURED",
        "Snapshot uploads are not configured yet.",
        503,
      );
    }

    const objectKey = buildSnapshotObjectKey({
      extension: SNAPSHOT_EXTENSION_MAP[mimeType],
      sessionId,
      studentId: user.id,
    });
    const presignedUpload = createR2PresignedUrl({
      ...signingConfig,
      bucketName: getSnapshotBucketName(c.env),
      expiresInSeconds: SNAPSHOT_UPLOAD_URL_TTL_SECONDS,
      method: "PUT",
      objectKey,
    });

    return success(
      c,
      {
        assetUrl: buildSnapshotAssetUrl(c.req.url, objectKey),
        expiresAt: presignedUpload.expiresAt,
        objectKey,
        uploadHeaders: {
          "Content-Type": mimeType,
        },
        uploadUrl: presignedUpload.url,
      },
      201,
    );
  },
);

cheatRoutes.post(
  "/audio-upload-url",
  requireRole("student"),
  zValidator("json", audioUploadSchema),
  async (c) => {
    const payload = c.req.valid("json");
    const user = c.get("user");
    const db = getDb(c.env.educore);

    const session = await verifyStudentSession(db, payload.sessionId, user.id);
    if (!session) {
      return notFound(c, "Session");
    }

    if (session.status !== "in_progress") {
      return error(
        c,
        "INVALID_STATUS",
        "Audio chunks are only accepted while a session is in progress.",
        409,
      );
    }

    const signingConfig = ensureSnapshotSigningConfig(c.env);
    if (!signingConfig) {
      return error(
        c,
        "R2_UPLOAD_NOT_CONFIGURED",
        "Audio uploads are not configured yet.",
        503,
      );
    }

    const objectKey = buildAudioObjectKey({
      extension: AUDIO_EXTENSION_MAP[payload.mimeType],
      sequenceNumber: payload.sequenceNumber,
      sessionId: payload.sessionId,
      studentId: user.id,
    });
    const presignedUpload = createR2PresignedUrl({
      ...signingConfig,
      bucketName: getSnapshotBucketName(c.env),
      expiresInSeconds: AUDIO_UPLOAD_URL_TTL_SECONDS,
      method: "PUT",
      objectKey,
    });

    return success(
      c,
      {
        expiresAt: presignedUpload.expiresAt,
        objectKey,
        uploadHeaders: {
          "Content-Type": payload.mimeType,
        },
        uploadUrl: presignedUpload.url,
      },
      201,
    );
  },
);

cheatRoutes.post(
  "/audio-chunks",
  requireRole("student"),
  zValidator("json", audioChunkFinalizeSchema),
  async (c) => {
    const payload = c.req.valid("json");
    const user = c.get("user");
    const db = getDb(c.env.educore);

    const session = await verifyStudentSession(db, payload.sessionId, user.id);
    if (!session) {
      return notFound(c, "Session");
    }

    if (session.status !== "in_progress") {
      return error(
        c,
        "INVALID_STATUS",
        "Audio chunks are only accepted while a session is in progress.",
        409,
      );
    }

    const objectKey = payload.objectKey;
    const audioRef = parseAudioObjectKey(objectKey);
    if (
      !audioRef ||
      audioRef.sessionId !== payload.sessionId ||
      audioRef.studentId !== user.id
    ) {
      return error(c, "BAD_REQUEST", "Invalid audio object key.", 400);
    }

    const now = new Date().toISOString();
    const chunkId = newId();

    await db.insert(examAudioChunks).values({
      id: chunkId,
      sessionId: payload.sessionId,
      examId: session.examId,
      studentId: user.id,
      objectKey,
      mimeType: payload.mimeType,
      sequenceNumber: payload.sequenceNumber,
      chunkStartedAt: payload.chunkStartedAt,
      chunkEndedAt: payload.chunkEndedAt,
      uploadedAt: now,
      durationMs: payload.durationMs,
      sizeBytes: payload.sizeBytes,
      createdAt: now,
    });

    return success(
      c,
      {
        id: chunkId,
        sessionId: payload.sessionId,
        examId: session.examId,
        studentId: user.id,
        objectKey,
        mimeType: payload.mimeType,
        sequenceNumber: payload.sequenceNumber,
        chunkStartedAt: payload.chunkStartedAt,
        chunkEndedAt: payload.chunkEndedAt,
        uploadedAt: now,
        durationMs: payload.durationMs,
        sizeBytes: payload.sizeBytes,
        assetUrl: buildAudioAssetUrl(c.req.url, objectKey),
      },
      201,
    );
  },
);

// ---------------------------------------------------------------------------
// GET /snapshot-assets — Read a stored camera snapshot for the owning student or exam teacher
// ---------------------------------------------------------------------------
cheatRoutes.get("/snapshot-assets", async (c) => {
  const objectKey = c.req.query("key");
  const user = c.get("user");
  const db = getDb(c.env.educore);

  if (!objectKey) {
    return error(c, "BAD_REQUEST", "Snapshot key is required.", 400);
  }

  const snapshotRef = parseSnapshotObjectKey(objectKey);
  if (!snapshotRef) {
    return error(c, "BAD_REQUEST", "Invalid snapshot key.", 400);
  }

  if (user.role === "student") {
    if (snapshotRef.studentId !== user.id) {
      return forbidden(c, "You cannot access this snapshot.");
    }

    const session = await verifyStudentSession(db, snapshotRef.sessionId, user.id);
    if (!session) {
      return notFound(c, "Session");
    }
  } else {
    const exam = await verifyTeacherSnapshotAccess(db, snapshotRef.sessionId, user.id);
    if (!exam) {
      return forbidden(c, "You cannot access this snapshot.");
    }
  }

  const snapshotObject = await c.env.EXAM_FILES.get(objectKey);
  if (!snapshotObject) {
    return notFound(c, "Snapshot");
  }

  c.header(
    "Content-Type",
    snapshotObject.httpMetadata?.contentType ?? inferSnapshotMimeType(objectKey),
  );
  c.header("Cache-Control", "private, max-age=60");
  return c.body(await snapshotObject.arrayBuffer());
});

cheatRoutes.get("/audio-assets", async (c) => {
  const objectKey = c.req.query("key");
  const user = c.get("user");
  const db = getDb(c.env.educore);

  if (!objectKey) {
    return error(c, "BAD_REQUEST", "Audio key is required.", 400);
  }

  const audioRef = parseAudioObjectKey(objectKey);
  if (!audioRef) {
    return error(c, "BAD_REQUEST", "Invalid audio key.", 400);
  }

  if (user.role === "student") {
    if (audioRef.studentId !== user.id) {
      return forbidden(c, "You cannot access this audio clip.");
    }

    const session = await verifyStudentSession(db, audioRef.sessionId, user.id);
    if (!session) {
      return notFound(c, "Session");
    }
  } else {
    const exam = await verifyTeacherSnapshotAccess(db, audioRef.sessionId, user.id);
    if (!exam) {
      return forbidden(c, "You cannot access this audio clip.");
    }
  }

  const audioObject = await c.env.EXAM_FILES.get(objectKey);
  if (!audioObject) {
    return notFound(c, "Audio clip");
  }

  c.header(
    "Content-Type",
    audioObject.httpMetadata?.contentType ?? inferAudioMimeType(objectKey),
  );
  c.header("Cache-Control", "private, max-age=60");
  return c.body(await audioObject.arrayBuffer());
});

// ---------------------------------------------------------------------------
// POST /event — Report a cheat event (student only)
// ---------------------------------------------------------------------------
cheatRoutes.post("/event", requireRole("student"), zValidator("json", eventSchema), async (c) => {
  const payload = c.req.valid("json");
  const { sessionId, eventType } = payload;
  const user = c.get("user");
  const db = getDb(c.env.educore);

  const session = await verifyStudentSession(db, sessionId, user.id);
  if (!session) {
    return notFound(c, "Session");
  }

  if (
    session.status !== "in_progress" &&
    eventType !== "microphone_permission_denied"
  ) {
    return error(
      c,
      "INVALID_STATUS",
      "Cheat events are only accepted while a session is in progress.",
      409,
    );
  }

  const [examConfig] = await db
    .select({
      enabledCheatDetections: exams.enabledCheatDetections,
      teacherId: exams.teacherId,
    })
    .from(exams)
    .where(eq(exams.id, session.examId))
    .limit(1);

  const enabledCheatDetections = parseEnabledCheatDetections(
    examConfig?.enabledCheatDetections,
  );

  if (
    !ALWAYS_ALLOWED_EVENT_TYPES.includes(eventType) &&
    !enabledCheatDetections.some((value) => value === eventType)
  ) {
    return success(c, {
      deduped: false,
      ignored: true,
      flagged: Boolean(session.isFlagged),
      riskLevel: (session.riskLevel ?? "low") as RiskLevel,
      violationScore: Number(session.violationScore ?? 0),
    });
  }

  const { confidence, details, source } = parseStructuredMetadata(payload);
  const dedupeKey = buildEventDedupeKey({ eventType, source, details });
  const [previousEvent] = await db
    .select({
      createdAt: cheatEvents.createdAt,
      dedupeKey: cheatEvents.dedupeKey,
    })
    .from(cheatEvents)
    .where(and(eq(cheatEvents.sessionId, sessionId), eq(cheatEvents.eventType, eventType)))
    .orderBy(sql`${cheatEvents.createdAt} DESC`)
    .limit(1);

  if (
    shouldThrottleEvent({
      dedupeKey,
      eventType,
      previousEvent: previousEvent ?? null,
    })
  ) {
    return success(c, {
      deduped: true,
      flagged: Boolean(session.isFlagged),
      riskLevel: (session.riskLevel ?? "low") as RiskLevel,
      violationScore: Number(session.violationScore ?? 0),
    });
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
    eventSource: source,
    confidence: confidence ?? null,
    details: Object.keys(details).length > 0 ? JSON.stringify(details) : null,
    dedupeKey,
    severity,
    metadata: payload.metadata ?? null,
    isNotified: false,
  });

  const riskSummary = await getSessionRiskSummary(db, sessionId);

  // Update session flag status
  await db
    .update(examSessions)
    .set({
      flagCount: riskSummary.flagCount,
      isFlagged: riskSummary.isFlagged,
      violationScore: riskSummary.violationScore,
      riskLevel: riskSummary.riskLevel,
      lastViolationAt: riskSummary.lastViolationAt,
      topViolationType: riskSummary.topViolationType,
    })
    .where(eq(examSessions.id, sessionId));

  const [student] = await db
    .select({ fullName: students.fullName })
    .from(students)
    .where(eq(students.id, user.id))
    .limit(1);

  if (examConfig?.teacherId) {
    await notifyTeacherStudentFlagged(
      db,
      examConfig.teacherId,
      session.examId,
      sessionId,
      user.id,
      student?.fullName ?? user.id,
      eventType,
      riskSummary.riskLevel === "critical" || severity === "critical"
        ? "critical"
        : "warning",
    );
  }

  return success(
    c,
    {
      deduped: false,
      eventId,
      flagged: riskSummary.isFlagged,
      riskLevel: riskSummary.riskLevel,
      violationScore: riskSummary.violationScore,
    },
    201,
  );
});

// ---------------------------------------------------------------------------
// POST /analyze-snapshot — Analyze a periodic camera snapshot (student only)
// ---------------------------------------------------------------------------
cheatRoutes.post(
  "/analyze-snapshot",
  requireRole("student"),
  zValidator("json", analyzeSnapshotSchema),
  async (c) => {
    const payload = c.req.valid("json");
    const { sessionId } = payload;
    const user = c.get("user");
    const db = getDb(c.env.educore);

    const session = await verifyStudentSession(db, sessionId, user.id);
    if (!session) {
      return notFound(c, "Session");
    }

    try {
      const imageDataUrl =
        "imageDataUrl" in payload
          ? payload.imageDataUrl
          : await (async () => {
              const snapshotRef = parseSnapshotObjectKey(payload.objectKey);
              if (
                !snapshotRef ||
                snapshotRef.sessionId !== sessionId ||
                snapshotRef.studentId !== user.id
              ) {
                throw new Error("FORBIDDEN_SNAPSHOT_KEY");
              }

              const snapshotObject = await c.env.EXAM_FILES.get(payload.objectKey);
              if (!snapshotObject) {
                throw new Error("SNAPSHOT_NOT_FOUND");
              }

              return snapshotObjectToDataUrl(snapshotObject, payload.objectKey);
            })();

      const analysis = await analyzeSnapshotWithAi(c.env.AI, imageDataUrl);
      return success(c, analysis);
    } catch (err) {
      if (err instanceof Error && err.message === "FORBIDDEN_SNAPSHOT_KEY") {
        return forbidden(c, "This snapshot does not belong to the active student session.");
      }

      if (err instanceof Error && err.message === "SNAPSHOT_NOT_FOUND") {
        return notFound(c, "Snapshot");
      }

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
cheatRoutes.get("/audio-chunks/:sessionId", requireRole("teacher"), async (c) => {
  const sessionId = c.req.param("sessionId");
  const teacherId = c.get("user").id;
  const db = getDb(c.env.educore);

  const exam = await verifyTeacherSnapshotAccess(db, sessionId, teacherId);
  if (!exam) {
    return forbidden(c, "You cannot access audio chunks for this session.");
  }

  const chunks = await db
    .select({
      id: examAudioChunks.id,
      sessionId: examAudioChunks.sessionId,
      examId: examAudioChunks.examId,
      studentId: examAudioChunks.studentId,
      objectKey: examAudioChunks.objectKey,
      mimeType: examAudioChunks.mimeType,
      sequenceNumber: examAudioChunks.sequenceNumber,
      chunkStartedAt: examAudioChunks.chunkStartedAt,
      chunkEndedAt: examAudioChunks.chunkEndedAt,
      uploadedAt: examAudioChunks.uploadedAt,
      durationMs: examAudioChunks.durationMs,
      sizeBytes: examAudioChunks.sizeBytes,
    })
    .from(examAudioChunks)
    .where(eq(examAudioChunks.sessionId, sessionId))
    .orderBy(examAudioChunks.sequenceNumber);

  return success(
    c,
    chunks.map((chunk) => ({
      ...chunk,
      assetUrl: buildAudioAssetUrl(c.req.url, chunk.objectKey),
    })),
  );
});

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

  return success(c, events.map((event) => formatCheatEventForResponse(event)));
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

  return success(c, events.map((event) => formatCheatEventForResponse(event)));
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
      sessionId: examSessions.id,
      studentId: examSessions.studentId,
      fullName: students.fullName,
      flagCount: examSessions.flagCount,
      riskLevel: examSessions.riskLevel,
      violationScore: examSessions.violationScore,
      lastViolationAt: examSessions.lastViolationAt,
      topViolationType: examSessions.topViolationType,
    })
    .from(examSessions)
    .innerJoin(students, eq(examSessions.studentId, students.id))
    .where(and(eq(examSessions.examId, examId), eq(examSessions.isFlagged, true)));

  // For each flagged student, count cheat events
  const result = await Promise.all(
    flaggedSessions.map(async (fs) => {
      const studentEvents = await db
        .select({
          createdAt: cheatEvents.createdAt,
          eventSource: cheatEvents.eventSource,
          eventType: cheatEvents.eventType,
        })
        .from(cheatEvents)
        .where(and(eq(cheatEvents.examId, examId), eq(cheatEvents.studentId, fs.studentId)));

      const riskSummary = summarizeSessionRisk(studentEvents as StoredCheatEvent[]);

      return {
        sessionId: fs.sessionId,
        studentId: fs.studentId,
        fullName: fs.fullName,
        flagCount: Number(fs.flagCount ?? riskSummary.flagCount),
        eventCount: studentEvents.length,
        lastViolationAt: fs.lastViolationAt ?? riskSummary.lastViolationAt,
        riskLevel: (fs.riskLevel ?? riskSummary.riskLevel) as RiskLevel,
        topViolationType: fs.topViolationType ?? riskSummary.topViolationType,
        violationScore: Number(fs.violationScore ?? riskSummary.violationScore),
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

  return success(c, events.map((event) => formatCheatEventForResponse(event)));
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
    .set({
      status: "disqualified",
      isFlagged: true,
      riskLevel: "critical",
      lastViolationAt: new Date().toISOString(),
      topViolationType: "disqualification",
    })
    .where(eq(examSessions.id, sessionId));

  // Insert a cheat event for the disqualification
  const eventId = newId();
  await db.insert(cheatEvents).values({
    id: eventId,
    sessionId,
    examId: session.examId,
    studentId: session.studentId,
    eventType: "disqualification",
    eventSource: "teacher_action",
    confidence: 1,
    details: JSON.stringify({ reason }),
    dedupeKey: `disqualification::teacher_action::${sessionId}`,
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
