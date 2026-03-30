import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  exams,
  options,
  questions,
  subjects,
} from "../db";
import { normalizeExamDate, parseExamDate } from "../utils/exam-time";
import { newId } from "../utils/id";
import { generateRoomCode } from "../utils/room-code";

export const createExamPayloadSchema = z.object({
  subjectId: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  examType: z.string().optional(),
  className: z.string().optional(),
  groupName: z.string().optional(),
  durationMin: z.number().int().positive().optional(),
  expectedStudentsCount: z.number().int().min(0).optional(),
  passScore: z.number().int().min(0).max(100).optional(),
  shuffleQuestions: z.boolean().optional(),
});

export const updateExamPayloadSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  examType: z.string().optional(),
  className: z.string().optional(),
  groupName: z.string().optional(),
  durationMin: z.number().int().positive().optional(),
  expectedStudentsCount: z.number().int().min(0).optional(),
  passScore: z.number().int().min(0).max(100).optional(),
  shuffleQuestions: z.boolean().optional(),
  subjectId: z.string().optional(),
});

export const questionOptionSchema = z.object({
  label: z.string(),
  text: z.string(),
  imageUrl: z.string().optional(),
  isCorrect: z.boolean(),
});

export const questionPayloadSchema = z.object({
  type: z.string(),
  questionText: z.string(),
  topic: z.string().optional(),
  difficulty: z.string().optional(),
  imageUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  explanation: z.string().optional(),
  correctAnswerText: z.string().optional(),
  points: z.number().optional(),
  options: z.array(questionOptionSchema).optional(),
});

export const updateQuestionPayloadSchema = questionPayloadSchema.partial();

export const scheduleExamPayloadSchema = z.object({
  scheduledAt: z.string(),
});

export async function ensureDefaultSubjectId(db: any) {
  let existing: { id: string } | undefined;

  try {
    [existing] = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(eq(subjects.code, "GENERAL"))
      .limit(1);
  } catch {
    existing = undefined;
  }

  if (existing?.id) return existing.id;

  const id = newId();
  const now = new Date().toISOString();

  try {
    await db.insert(subjects).values({
      id,
      name: "Ерөнхий",
      code: "GENERAL",
      description: "Анхдагч ерөнхий хичээл",
      createdAt: now,
      updatedAt: now,
    });
    return id;
  } catch {
    try {
      await db.insert(subjects).values({
        id,
        name: "Ерөнхий",
        code: "GENERAL",
      });
      return id;
    } catch {
      const [fallbackExisting] = await db
        .select({ id: subjects.id })
        .from(subjects)
        .where(eq(subjects.code, "GENERAL"))
        .limit(1);

      if (fallbackExisting?.id) return fallbackExisting.id;
      throw new Error("Default subject creation failed");
    }
  }
}

export async function resolveSubjectId(db: any, subjectId?: string) {
  if (!subjectId) return ensureDefaultSubjectId(db);

  const [existing] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(eq(subjects.id, subjectId))
    .limit(1);

  return existing?.id ?? ensureDefaultSubjectId(db);
}

export async function fetchOwnedExam(db: any, examId: string, teacherId: string) {
  const [exam] = await db
    .select()
    .from(exams)
    .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)))
    .limit(1);

  return exam ?? null;
}

export async function fetchExamQuestionCount(db: any, examId: string) {
  const examQuestions = await db
    .select({ id: questions.id })
    .from(questions)
    .where(eq(questions.examId, examId));

  return examQuestions.length;
}

export async function fetchExamQuestionsWithOptions(db: any, examId: string) {
  const examQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.examId, examId));

  const questionsWithOptions = await Promise.all(
    examQuestions.map(async (question: any) => {
      const questionOptions = await db
        .select()
        .from(options)
        .where(eq(options.questionId, question.id));

      return { ...question, options: questionOptions };
    }),
  );

  return questionsWithOptions;
}

export async function createExamRecord(db: any, teacherId: string, body: z.infer<typeof createExamPayloadSchema>) {
  const subjectId = await resolveSubjectId(db, body.subjectId);
  const id = newId();
  const now = new Date().toISOString();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await db.insert(exams).values({
        id,
        teacherId,
        subjectId,
        title: body.title,
        description: body.description,
        examType: body.examType,
        className: body.className,
        groupName: body.groupName,
        durationMin: body.durationMin ?? 60,
        expectedStudentsCount: body.expectedStudentsCount ?? 0,
        roomCode: generateRoomCode(),
        passScore: body.passScore ?? 50,
        shuffleQuestions: body.shuffleQuestions ?? false,
        createdAt: now,
        updatedAt: now,
      });
      break;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes("UNIQUE constraint failed: exams.room_code") || attempt === 2) {
        throw err;
      }
    }
  }

  const [created] = await db.select().from(exams).where(eq(exams.id, id)).limit(1);
  return created;
}

export async function updateExamRecord(db: any, examId: string, body: z.infer<typeof updateExamPayloadSchema>) {
  const updates = {
    updatedAt: new Date().toISOString(),
    ...(body.title !== undefined && { title: body.title }),
    ...(body.description !== undefined && { description: body.description }),
    ...(body.examType !== undefined && { examType: body.examType }),
    ...(body.className !== undefined && { className: body.className }),
    ...(body.groupName !== undefined && { groupName: body.groupName }),
    ...(body.durationMin !== undefined && { durationMin: body.durationMin }),
    ...(body.expectedStudentsCount !== undefined && {
      expectedStudentsCount: body.expectedStudentsCount,
    }),
    ...(body.passScore !== undefined && { passScore: body.passScore }),
    ...(body.shuffleQuestions !== undefined && {
      shuffleQuestions: body.shuffleQuestions,
    }),
    ...(body.subjectId !== undefined && { subjectId: body.subjectId }),
  };

  await db.update(exams).set(updates).where(eq(exams.id, examId));
  const [updated] = await db.select().from(exams).where(eq(exams.id, examId)).limit(1);
  return updated;
}

export async function createQuestionRecord(
  db: any,
  examId: string,
  body: z.infer<typeof questionPayloadSchema>,
) {
  const existingQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.examId, examId));

  const orderIndex = existingQuestions.length;
  const questionId = newId();
  const now = new Date().toISOString();

  await db.insert(questions).values({
    id: questionId,
    examId,
    type: body.type,
    questionText: body.questionText,
    topic: body.topic,
    difficulty: body.difficulty ?? "medium",
    imageUrl: body.imageUrl,
    audioUrl: body.audioUrl,
    explanation: body.explanation,
    correctAnswerText: body.correctAnswerText,
    points: body.points ?? 1,
    orderIndex,
    createdAt: now,
    updatedAt: now,
  });

  if (body.options?.length) {
    await db.insert(options).values(
      body.options.map((opt, idx) => ({
        id: newId(),
        questionId,
        label: opt.label,
        text: opt.text,
        imageUrl: opt.imageUrl,
        isCorrect: opt.isCorrect,
        orderIndex: idx,
      })),
    );
  }

  const [createdQuestion] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, questionId))
    .limit(1);
  const createdOptions = await db
    .select()
    .from(options)
    .where(eq(options.questionId, questionId));

  return { ...createdQuestion, options: createdOptions };
}

export async function updateQuestionRecord(
  db: any,
  questionId: string,
  body: z.infer<typeof updateQuestionPayloadSchema>,
) {
  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (body.type !== undefined) updates.type = body.type;
  if (body.questionText !== undefined) updates.questionText = body.questionText;
  if (body.topic !== undefined) updates.topic = body.topic;
  if (body.difficulty !== undefined) updates.difficulty = body.difficulty;
  if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl;
  if (body.audioUrl !== undefined) updates.audioUrl = body.audioUrl;
  if (body.explanation !== undefined) updates.explanation = body.explanation;
  if (body.correctAnswerText !== undefined) updates.correctAnswerText = body.correctAnswerText;
  if (body.points !== undefined) updates.points = body.points;

  await db.update(questions).set(updates).where(eq(questions.id, questionId));

  if (body.options !== undefined) {
    await db.delete(options).where(eq(options.questionId, questionId));

    if (body.options.length > 0) {
      await db.insert(options).values(
        body.options.map((opt, idx) => ({
          id: newId(),
          questionId,
          label: opt.label,
          text: opt.text,
          imageUrl: opt.imageUrl,
          isCorrect: opt.isCorrect,
          orderIndex: idx,
        })),
      );
    }
  }

  const [updatedQuestion] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, questionId))
    .limit(1);
  const updatedOptions = await db
    .select()
    .from(options)
    .where(eq(options.questionId, questionId));

  return { ...updatedQuestion, options: updatedOptions };
}

export async function scheduleExamRecord(db: any, exam: any, scheduledAtValue: string) {
  const normalizedScheduledAt = normalizeExamDate(scheduledAtValue);
  if (!normalizedScheduledAt) return { error: "Invalid scheduled date" };

  await db
    .update(exams)
    .set({
      status: "scheduled",
      scheduledAt: normalizedScheduledAt,
      roomCode: exam.roomCode ?? generateRoomCode(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(exams.id, exam.id));

  const [updated] = await db.select().from(exams).where(eq(exams.id, exam.id)).limit(1);
  return { updated };
}

export async function startExamRecord(db: any, exam: any) {
  const nowDate = new Date();
  const scheduledAt = parseExamDate(exam.scheduledAt);

  if (scheduledAt && nowDate.getTime() < scheduledAt.getTime()) {
    return { error: "Cannot manually start exam before scheduled time" };
  }

  const now = nowDate.toISOString();
  await db
    .update(exams)
    .set({ status: "active", startedAt: now, updatedAt: now })
    .where(eq(exams.id, exam.id));

  const [updated] = await db.select().from(exams).where(eq(exams.id, exam.id)).limit(1);
  return { updated };
}

export async function finishExamRecord(db: any, exam: any) {
  const now = new Date().toISOString();
  await db
    .update(exams)
    .set({ status: "finished", finishedAt: now, updatedAt: now })
    .where(eq(exams.id, exam.id));
  const [updated] = await db.select().from(exams).where(eq(exams.id, exam.id)).limit(1);
  return updated;
}

export async function archiveExamRecord(db: any, exam: any) {
  const now = new Date().toISOString();
  await db
    .update(exams)
    .set({ status: "archived", updatedAt: now })
    .where(eq(exams.id, exam.id));
  const [updated] = await db.select().from(exams).where(eq(exams.id, exam.id)).limit(1);
  return updated;
}
