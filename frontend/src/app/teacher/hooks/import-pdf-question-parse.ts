import { parseAnswerKey, parseQuestionsFromText } from "../utils";
import type { Question } from "../types";

export const parseSingleQuestion = (
  text: string,
  answerKey: Map<number, string>,
): Question | null => {
  const parsed = parseQuestionsFromText(text, answerKey);
  return parsed[0] ?? null;
};

export const parseAnswerKeyFromPage = (pageText: string) =>
  parseAnswerKey(pageText ?? "");
