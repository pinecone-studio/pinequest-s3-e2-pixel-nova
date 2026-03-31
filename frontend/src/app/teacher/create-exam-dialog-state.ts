import type { AiExamGeneratorInput } from "./types";

const STORAGE_KEY = "teacher:create-exam-dialog-payload";

export type PendingCreateExamDraft =
  | {
      mode: "manual";
      examTitle: string;
    }
  | {
      mode: "ai";
      input: AiExamGeneratorInput;
    }
  | {
      mode: "pdf";
      examTitle: string;
      importMcqCount: number;
      importTextCount?: number;
      importOpenCount: number;
    };

export const savePendingCreateExamDraft = (
  payload: PendingCreateExamDraft,
) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

export const consumePendingCreateExamDraft =
  (): PendingCreateExamDraft | null => {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(STORAGE_KEY);
    try {
      return JSON.parse(raw) as PendingCreateExamDraft;
    } catch {
      return null;
    }
  };
