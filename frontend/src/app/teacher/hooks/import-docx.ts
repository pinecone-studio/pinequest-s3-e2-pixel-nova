import { parseAnswerKey, parseQuestionsFromText } from "../utils";
import type { Question } from "../types";

export const parseDocxQuestions = async (file: File): Promise<Question[]> => {
  type Mammoth = {
    extractRawText: (args: { arrayBuffer: ArrayBuffer }) => Promise<{
      value: string;
    }>;
  };
  const mammoth = (await import("mammoth")).default as Mammoth;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const rawText = result.value || "";
  const answerKey = parseAnswerKey(rawText);
  return parseQuestionsFromText(rawText, answerKey);
};
