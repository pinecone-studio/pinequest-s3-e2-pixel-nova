import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  examSessions,
  exams,
  options,
  questions,
  studentAnswers,
} from "../db";
import { parseExamDate } from "../utils/exam-time";
import { newId } from "../utils/id";

export const joinSessionPayloadSchema = z.object({
  roomCode: z.string().min(1),
});

export const answerSessionPayloadSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionId: z.string().optional(),
  textAnswer: z.string().optional(),
});

export const getEffectiveExamStart = (exam: { startedAt?: string | null; scheduledAt?: string | null }) =>
  parseExamDate(exam.startedAt) ?? parseExamDate(exam.scheduledAt);

export async function findJoinableExamByRoomCode(db: any, roomCode: string) {
  const [exam] = await db
    .select()
    .from(exams)
    .where(
      and(
        eq(exams.roomCode, roomCode),
        sql`${exams.status} IN (${sql.join(["scheduled", "active"].map((s) => sql`${s}`), sql`, `)})`,
      ),
    )
    .limit(1);

  return exam ?? null;
}

export async function activateScheduledExamIfReady(db: any, exam: any, now = new Date()) {
  const scheduledAt = parseExamDate(exam.scheduledAt);

  if (exam.status !== "scheduled") return exam;
  if (scheduledAt && now < scheduledAt) return exam;

  const startedAt = exam.startedAt ?? now.toISOString();
  await db
    .update(exams)
    .set({
      status: "active",
      startedAt,
      updatedAt: now.toISOString(),
    })
    .where(eq(exams.id, exam.id));

  return {
    ...exam,
    status: "active",
    startedAt,
  };
}

export function isLateEntry(exam: { startedAt?: string | null; scheduledAt?: string | null }, now = new Date()) {
  const startTime = getEffectiveExamStart(exam);
  return startTime ? now.getTime() - startTime.getTime() > 5 * 60 * 1000 : false;
}

export async function countExamQuestions(db: any, examId: string) {
  const [questionCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(questions)
    .where(eq(questions.examId, examId));

  return Number(questionCount?.count ?? 0);
}

export async function findStudentExamSession(db: any, sessionId: string, studentId: string) {
  const [session] = await db
    .select()
    .from(examSessions)
    .where(and(eq(examSessions.id, sessionId), eq(examSessions.studentId, studentId)))
    .limit(1);

  return session ?? null;
}

export async function findStudentExamSessionByExam(db: any, examId: string, studentId: string) {
  const [session] = await db
    .select()
    .from(examSessions)
    .where(and(eq(examSessions.examId, examId), eq(examSessions.studentId, studentId)))
    .limit(1);

  return session ?? null;
}

export async function fetchSessionExam(db: any, examId: string) {
  const [exam] = await db
    .select()
    .from(exams)
    .where(eq(exams.id, examId))
    .limit(1);

  return exam ?? null;
}

export async function fetchSessionQuestionsWithOptions(db: any, examId: string) {
  const examQuestions = await db
    .select({
      id: questions.id,
      type: questions.type,
      questionText: questions.questionText,
      imageUrl: questions.imageUrl,
      audioUrl: questions.audioUrl,
      points: questions.points,
      orderIndex: questions.orderIndex,
      difficulty: questions.difficulty,
      topic: questions.topic,
    })
    .from(questions)
    .where(eq(questions.examId, examId))
    .orderBy(questions.orderIndex);

  const questionIds = examQuestions.map((q: any) => q.id);
  const allOptions = questionIds.length
    ? await db
        .select({
          id: options.id,
          questionId: options.questionId,
          label: options.label,
          text: options.text,
          imageUrl: options.imageUrl,
          orderIndex: options.orderIndex,
        })
        .from(options)
        .where(sql`${options.questionId} IN (${sql.join(questionIds.map((id: string) => sql`${id}`), sql`, `)})`)
        .orderBy(options.orderIndex)
    : [];

  const optionsByQuestion = new Map<string, typeof allOptions>();
  for (const opt of allOptions) {
    const list = optionsByQuestion.get(opt.questionId) ?? [];
    list.push(opt);
    optionsByQuestion.set(opt.questionId, list);
  }

  return examQuestions.map((question: any) => ({
    ...question,
    options: optionsByQuestion.get(question.id) ?? [],
  }));
}

export async function markExistingSessionLateIfNeeded(db: any, session: any, late: boolean) {
  if (!late || session.status !== "joined") return session;

  await db
    .update(examSessions)
    .set({ status: "late" })
    .where(eq(examSessions.id, session.id));

  return { ...session, status: "late" };
}

export async function createJoinedSession(db: any, examId: string, studentId: string, late: boolean) {
  const id = newId();
  await db.insert(examSessions).values({
    id,
    examId,
    studentId,
    status: late ? "late" : "joined",
  });

  return {
    id,
    examId,
    studentId,
    status: late ? "late" : "joined",
  };
}

export async function ensureSessionInProgress(db: any, session: any, exam: any) {
  if (session.status === "in_progress") return session;

  const startedAt = session.startedAt ?? getEffectiveExamStart(exam)?.toISOString() ?? new Date().toISOString();
  await db
    .update(examSessions)
    .set({
      status: "in_progress",
      startedAt,
    })
    .where(eq(examSessions.id, session.id));

  return {
    ...session,
    status: "in_progress",
    startedAt,
  };
}

export function hasExamExpired(exam: any) {
  const effectiveStart = getEffectiveExamStart(exam);
  if (!effectiveStart) return false;

  const expiresAt = effectiveStart.getTime() + exam.durationMin * 60 * 1000;
  return Date.now() > expiresAt;
}

export async function findExistingStudentAnswer(db: any, sessionId: string, questionId: string) {
  const [existing] = await db
    .select()
    .from(studentAnswers)
    .where(and(eq(studentAnswers.sessionId, sessionId), eq(studentAnswers.questionId, questionId)))
    .limit(1);

  return existing ?? null;
}
