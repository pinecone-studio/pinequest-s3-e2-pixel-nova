import { generateId, generateRoomCode } from "@/lib/examGuard";
import type { Exam, Question } from "../types";

export const toSyncQuestions = (sourceQuestions: Question[]) =>
  sourceQuestions.map((question) => ({
    type: question.type,
    text: question.text,
    points: question.points,
    correctAnswer: question.correctAnswer,
    imageUrl: question.imageUrl,
    options: question.options,
  }));

export const buildLocalExam = (params: {
  title: string;
  description?: string | null;
  examType?: string | null;
  className?: string | null;
  groupName?: string | null;
  scheduledAt: string | null;
  expectedStudentsCount: number;
  questions: Question[];
  durationMinutes: number;
  remote?: {
    id: string;
    description?: string | null;
    examType?: string | null;
    className?: string | null;
    groupName?: string | null;
    status?: string | null;
    roomCode?: string | null;
    scheduledAt?: string | null;
    startedAt?: string | null;
    finishedAt?: string | null;
    durationMin?: number;
    expectedStudentsCount?: number | null;
    createdAt?: string;
  } | null;
}): Exam => {
  const { durationMinutes, remote, ...payload } = params;
  return {
    id: remote?.id ?? generateId(),
    title: payload.title,
    description: remote?.description ?? payload.description ?? null,
    examType: remote?.examType ?? payload.examType ?? null,
    className: remote?.className ?? payload.className ?? null,
    groupName: remote?.groupName ?? payload.groupName ?? null,
    status: remote?.status ?? (payload.scheduledAt ? "scheduled" : "draft"),
    scheduledAt: remote?.scheduledAt ?? payload.scheduledAt,
    examStartedAt: remote?.startedAt ?? null,
    finishedAt: remote?.finishedAt ?? null,
    roomCode: remote?.roomCode ?? generateRoomCode(),
    expectedStudentsCount:
      remote?.expectedStudentsCount ?? payload.expectedStudentsCount,
    questions: payload.questions,
    duration: remote?.durationMin ?? durationMinutes,
    createdAt: remote?.createdAt ?? new Date().toISOString(),
  };
};
