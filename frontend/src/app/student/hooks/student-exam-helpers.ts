import { calculateXP } from "@/lib/examGuard";
import type { Exam, Grade, Question } from "../types";

export const buildAnswerReport = (
  exam: Exam,
  answers: Record<string, string>,
): { question: Question; answer: string; correct: boolean }[] =>
  exam.questions.map((question) => {
    const studentAnswer = (answers[question.id] || "").trim();
    const correctAnswer = question.correctAnswer.trim();
    const correct =
      studentAnswer.toLowerCase() === correctAnswer.toLowerCase() ||
      (question.type === "mcq" &&
        !!question.options?.some(
          (opt) =>
            opt.toLowerCase() === correctAnswer.toLowerCase() &&
            studentAnswer.toLowerCase() === opt.toLowerCase(),
        ));
    return { question, answer: studentAnswer, correct: !!correct };
  });

export const calculateSubmissionMetrics = (
  exam: Exam,
  report: { question: Question; correct: boolean }[],
  terminated: boolean,
) => {
  const score = terminated
    ? 0
    : report.reduce(
        (sum, item) => sum + (item.correct ? item.question.points ?? 1 : 0),
        0,
      );
  const totalPoints =
    exam.questions.reduce((sum, question) => sum + (question.points ?? 1), 0) ||
    1;
  const percentage = terminated ? 0 : Math.round((score / totalPoints) * 100);
  const grade: Grade =
    percentage >= 90
      ? "A"
      : percentage >= 80
      ? "B"
      : percentage >= 70
      ? "C"
      : percentage >= 60
      ? "D"
      : "F";
  const xpEarned = terminated ? 0 : calculateXP(percentage);
  return { score, totalPoints, percentage, grade, xpEarned };
};
