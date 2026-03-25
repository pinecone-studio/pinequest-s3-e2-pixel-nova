import { parseCsv } from "../utils";
import type { Question } from "../types";

export const parseCsvQuestions = (text: string): Question[] => {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.toLowerCase());
  const questionIndex = header.findIndex((h) => h.includes("question"));
  const aIndex = header.findIndex((h) => h === "a");
  const bIndex = header.findIndex((h) => h === "b");
  const cIndex = header.findIndex((h) => h === "c");
  const dIndex = header.findIndex((h) => h === "d");
  const answerIndex = header.findIndex((h) => h.includes("answer"));
  const dataRows = rows.slice(1);
  const parsed = dataRows
    .map((cols) => {
      const qText = cols[questionIndex] ?? "";
      const options = [
        cols[aIndex] ?? "",
        cols[bIndex] ?? "",
        cols[cIndex] ?? "",
        cols[dIndex] ?? "",
      ].map((item) => item.trim());
      const correct = cols[answerIndex] ?? "A";
      if (!qText || options.some((opt) => !opt)) return null;
      const correctIndex = ["A", "B", "C", "D"].indexOf(
        correct.trim().toUpperCase(),
      );
      return {
        id: crypto.randomUUID(),
        text: qText,
        type: "mcq" as const,
        options,
        correctAnswer: options[correctIndex] ?? options[0],
        points: 1,
      };
    })
    .filter(Boolean) as Question[];
  return parsed;
};
