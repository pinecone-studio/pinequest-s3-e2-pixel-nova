import type { AiExamGeneratorInput } from "../types";

export const createExamTabs = [
  "Гараар үүсгэх",
  "AI ноорогоор үүсгэх",
  "PDF файл-Материал",
] as const;

export type CreateExamTab = (typeof createExamTabs)[number];

export type ManualQuestionDraft = {
  text: string;
  type: "open" | "mcq";
  answer: string;
  points: number;
  mcqOptions: string[];
  correctIndex: number;
};

export type ManualErrors = {
  title?: string;
  question?: string;
  questions?: string;
};

export type AiErrors = Partial<
  Record<keyof AiExamGeneratorInput | "questionCount", string>
>;

export type PdfErrors = {
  file?: string;
  counts?: string;
};

export type PdfCountKey = "mcq" | "text" | "open";
