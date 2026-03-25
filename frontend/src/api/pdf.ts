import type { User } from "@/lib/examGuard";
import { apiRequest } from "./client";

export const uploadPdf = async (file: File, user?: User | null) => {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest("/api/pdf/upload", {
    method: "POST",
    user,
    body: formData,
  });
};

export const extractPdfQuestions = (fileKey: string, user?: User | null) =>
  apiRequest("/api/pdf/extract", {
    method: "POST",
    user,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileKey }),
  });

export const confirmPdfQuestions = (
  payload: Record<string, unknown>,
  user?: User | null,
) =>
  apiRequest("/api/pdf/confirm", {
    method: "POST",
    user,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
