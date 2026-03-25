import type { User } from "@/lib/examGuard";
import { apiRequest } from "./client";

export const createQuestionBankItem = (
  payload: Record<string, unknown>,
  user?: User | null,
) =>
  apiRequest("/api/question-bank", {
    method: "POST",
    user,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export const getQuestionBankItems = (
  searchParams = "",
  user?: User | null,
) =>
  apiRequest(`/api/question-bank${searchParams}`, { user });

export const getQuestionBankItem = (id: string, user?: User | null) =>
  apiRequest(`/api/question-bank/${id}`, { user });

export const deleteQuestionBankItem = (id: string, user?: User | null) =>
  apiRequest(`/api/question-bank/${id}`, {
    method: "DELETE",
    user,
  });

export const copyQuestionBankItemToExam = (
  id: string,
  examId: string,
  user?: User | null,
) =>
  apiRequest(`/api/question-bank/${id}/copy-to-exam`, {
    method: "POST",
    user,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ examId }),
  });
