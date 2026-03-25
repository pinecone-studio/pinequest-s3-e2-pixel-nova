import type { User } from "@/lib/examGuard";
import { apiRequest } from "./client";

export type TeacherExamSummary = {
  id: string;
  title: string;
  description?: string | null;
  scheduledAt: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  roomCode: string | null;
  durationMin: number;
  status: string;
  passScore?: number | null;
  shuffleQuestions?: boolean;
  createdAt: string;
};

export type TeacherExamDetail = TeacherExamSummary & {
  questions: {
    id: string;
    questionText: string;
    type: string;
    correctAnswerText?: string | null;
    points: number;
    options?: { id: string; label: string; text: string; isCorrect: boolean }[];
  }[];
};

export const getTeacherExams = (user?: User | null) =>
  apiRequest<TeacherExamSummary[]>("/api/exams", { user });

export const getTeacherExamDetail = (examId: string, user?: User | null) =>
  apiRequest<TeacherExamDetail>(`/api/exams/${examId}`, { user });

export const createExam = (
  payload: {
    subjectId?: string;
    title: string;
    description?: string;
    durationMin?: number;
    passScore?: number;
    shuffleQuestions?: boolean;
  },
  user?: User | null,
) =>
  apiRequest<TeacherExamSummary>("/api/exams", {
    method: "POST",
    user,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export const updateExam = (
  examId: string,
  payload: Record<string, unknown>,
  user?: User | null,
) =>
  apiRequest<TeacherExamSummary>(`/api/exams/${examId}`, {
    method: "PUT",
    user,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export const deleteExam = (examId: string, user?: User | null) =>
  apiRequest<{ deleted: boolean }>(`/api/exams/${examId}`, {
    method: "DELETE",
    user,
  });

export const addExamQuestion = (
  examId: string,
  payload: Record<string, unknown>,
  user?: User | null,
) =>
  apiRequest(`/api/exams/${examId}/questions`, {
    method: "POST",
    user,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export const updateExamQuestion = (
  examId: string,
  questionId: string,
  payload: Record<string, unknown>,
  user?: User | null,
) =>
  apiRequest(`/api/exams/${examId}/questions/${questionId}`, {
    method: "PUT",
    user,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export const deleteExamQuestion = (
  examId: string,
  questionId: string,
  user?: User | null,
) =>
  apiRequest<{ deleted: boolean }>(
    `/api/exams/${examId}/questions/${questionId}`,
    {
      method: "DELETE",
      user,
    },
  );

export const scheduleExam = (
  examId: string,
  scheduledAt: string,
  user?: User | null,
) =>
  apiRequest<TeacherExamSummary>(`/api/exams/${examId}/schedule`, {
    method: "POST",
    user,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ scheduledAt }),
  });

export const startExam = (examId: string, user?: User | null) =>
  apiRequest<TeacherExamSummary>(`/api/exams/${examId}/start`, {
    method: "POST",
    user,
  });

export const finishExam = (examId: string, user?: User | null) =>
  apiRequest<TeacherExamSummary>(`/api/exams/${examId}/finish`, {
    method: "POST",
    user,
  });

export const archiveExam = (examId: string, user?: User | null) =>
  apiRequest<TeacherExamSummary>(`/api/exams/${examId}/archive`, {
    method: "POST",
    user,
  });
