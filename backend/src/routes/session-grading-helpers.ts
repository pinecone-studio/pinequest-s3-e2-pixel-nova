import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { examSessions, exams, options, questions, studentAnswers } from "../db";
import { awardXpForGrading } from "../utils/xp-award";

type ExamSessionRow = typeof examSessions.$inferSelect;
type ExamRow = typeof exams.$inferSelect;
type QuestionRow = typeof questions.$inferSelect;
type OptionRow = typeof options.$inferSelect;
type StudentAnswerRow = typeof studentAnswers.$inferSelect;

type ResultAnswerRow = {
  answerId: string;
  questionId: string;
  selectedOptionId: string | null;
  textAnswer: string | null;
  isCorrect: boolean | null;
  pointsEarned: number | null;
  answeredAt: string;
  questionText: string;
  questionType: string;
  points: number;
  correctAnswerText: string | null;
};

export const manualGradeSchema = z.object({
  grades: z.array(
    z.object({
      answerId: z.string().min(1),
      pointsEarned: z.number().min(0),
      isCorrect: z.boolean(),
    }),
  ).min(1),
});

export async function findTeacherOwnedSession(db: any, sessionId: string, teacherId: string) {
  const [session] = await db
    .select()
    .from(examSessions)
    .where(eq(examSessions.id, sessionId))
    .limit(1);

  if (!session) {
    return { session: null, exam: null };
  }

  const [exam] = await db
    .select()
    .from(exams)
    .where(and(eq(exams.id, session.examId), eq(exams.teacherId, teacherId)))
    .limit(1);

  return { session, exam: exam ?? null };
}

export async function autoGradeSession(db: any, session: ExamSessionRow, exam: ExamRow) {
  const examQuestions: QuestionRow[] = await db
    .select()
    .from(questions)
    .where(eq(questions.examId, session.examId));

  const mcQuestionIds = examQuestions
    .filter((question) => question.type === "multiple_choice" || question.type === "true_false")
    .map((question) => question.id);

  const correctOptions: OptionRow[] = mcQuestionIds.length > 0
    ? await db
        .select()
        .from(options)
        .where(
          and(
            sql`${options.questionId} IN (${sql.join(mcQuestionIds.map((id: string) => sql`${id}`), sql`, `)})`,
            eq(options.isCorrect, true),
          ),
        )
    : [];

  const correctOptionByQuestion = new Map<string, string>();
  for (const option of correctOptions) {
    correctOptionByQuestion.set(option.questionId, option.id);
  }

  const questionMap = new Map<string, QuestionRow>(
    examQuestions.map((question) => [question.id, question]),
  );
  const answers: StudentAnswerRow[] = await db
    .select()
    .from(studentAnswers)
    .where(eq(studentAnswers.sessionId, session.id));

  let earnedPoints = 0;
  let totalPoints = 0;

  for (const question of examQuestions) {
    totalPoints += question.points;
  }

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) continue;

    let isCorrect = false;
    let pointsEarned = 0;

    if (question.type === "multiple_choice" || question.type === "true_false") {
      isCorrect = answer.selectedOptionId === correctOptionByQuestion.get(question.id);
    } else if (question.type === "short_answer") {
      isCorrect =
        !!question.correctAnswerText &&
        !!answer.textAnswer &&
        answer.textAnswer.trim().toLowerCase() === question.correctAnswerText.trim().toLowerCase();
    }

    if (isCorrect) {
      pointsEarned = question.points;
      earnedPoints += pointsEarned;
    }

    await db
      .update(studentAnswers)
      .set({ isCorrect, pointsEarned })
      .where(eq(studentAnswers.id, answer.id));
  }

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  await db
    .update(examSessions)
    .set({ status: "graded", score, earnedPoints, totalPoints })
    .where(eq(examSessions.id, session.id));

  await awardXpForGrading({
    db,
    studentId: session.studentId,
    sessionId: session.id,
    score,
    passScore: exam.passScore ?? 50,
    totalPoints,
    earnedPoints,
  });

  const [graded] = await db
    .select()
    .from(examSessions)
    .where(eq(examSessions.id, session.id))
    .limit(1);

  return graded;
}

export async function fetchStudentGradedResult(db: any, sessionId: string, studentId: string) {
  const [session]: ExamSessionRow[] = await db
    .select()
    .from(examSessions)
    .where(and(eq(examSessions.id, sessionId), eq(examSessions.studentId, studentId)))
    .limit(1);

  if (!session) {
    return { session: null, exam: null, answers: [] };
  }

  const [exam]: ExamRow[] = await db
    .select()
    .from(exams)
    .where(eq(exams.id, session.examId))
    .limit(1);

  if (!exam) {
    return { session, exam: null, answers: [] };
  }

  const answers: ResultAnswerRow[] = await db
    .select({
      answerId: studentAnswers.id,
      questionId: studentAnswers.questionId,
      selectedOptionId: studentAnswers.selectedOptionId,
      textAnswer: studentAnswers.textAnswer,
      isCorrect: studentAnswers.isCorrect,
      pointsEarned: studentAnswers.pointsEarned,
      answeredAt: studentAnswers.answeredAt,
      questionText: questions.questionText,
      questionType: questions.type,
      points: questions.points,
      correctAnswerText: questions.correctAnswerText,
    })
    .from(studentAnswers)
    .innerJoin(questions, eq(studentAnswers.questionId, questions.id))
    .where(eq(studentAnswers.sessionId, sessionId))
    .orderBy(questions.orderIndex);

  return { session, exam, answers };
}

export async function attachResultOptions(db: any, answers: ResultAnswerRow[]) {
  const questionIds = answers.map((answer) => answer.questionId);
  const allOptions: OptionRow[] = questionIds.length > 0
    ? await db
        .select()
        .from(options)
        .where(sql`${options.questionId} IN (${sql.join(questionIds.map((id) => sql`${id}`), sql`, `)})`)
        .orderBy(options.orderIndex)
    : [];

  const optionsByQuestion = new Map<string, typeof allOptions>();
  for (const option of allOptions) {
    const list = optionsByQuestion.get(option.questionId) ?? [];
    list.push(option);
    optionsByQuestion.set(option.questionId, list);
  }

  return answers.map((answer) => ({
    questionId: answer.questionId,
    questionText: answer.questionText,
    questionType: answer.questionType,
    points: answer.points,
    correctAnswerText: answer.correctAnswerText,
    selectedOptionId: answer.selectedOptionId,
    textAnswer: answer.textAnswer,
    isCorrect: answer.isCorrect,
    pointsEarned: answer.pointsEarned,
    options: (optionsByQuestion.get(answer.questionId) ?? []).map((option: OptionRow) => ({
      id: option.id,
      label: option.label,
      text: option.text,
      imageUrl: option.imageUrl,
      isCorrect: option.isCorrect,
    })),
  }));
}

export async function applyManualGrades(
  db: any,
  session: any,
  grades: Array<{ answerId: string; pointsEarned: number; isCorrect: boolean }>,
) {
  for (const grade of grades) {
    await db
      .update(studentAnswers)
      .set({ isCorrect: grade.isCorrect, pointsEarned: grade.pointsEarned })
      .where(and(eq(studentAnswers.id, grade.answerId), eq(studentAnswers.sessionId, session.id)));
  }

  const allAnswers = await db
    .select({ pointsEarned: studentAnswers.pointsEarned })
    .from(studentAnswers)
    .where(eq(studentAnswers.sessionId, session.id));

  const earnedPoints = allAnswers.reduce(
    (sum: number, answer: any) => sum + (answer.pointsEarned ?? 0),
    0,
  );

  const examQuestions = await db
    .select({ points: questions.points })
    .from(questions)
    .where(eq(questions.examId, session.examId));

  const totalPoints = examQuestions.reduce((sum: number, question: any) => sum + question.points, 0);
  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  await db
    .update(examSessions)
    .set({ status: "graded", score, earnedPoints, totalPoints })
    .where(eq(examSessions.id, session.id));

  const [updated] = await db
    .select()
    .from(examSessions)
    .where(eq(examSessions.id, session.id))
    .limit(1);

  return updated;
}
