import { generateId } from "@/lib/examGuard";
import type { Question } from "./types";

export const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("mn-MN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const parseAnswerKey = (text: string) => {
  const map = new Map<number, string>();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  lines.forEach((line) => {
    const match = line.match(/(\d+)\s*[:.)-]?\s*([ABCD])/i);
    if (match) {
      map.set(Number(match[1]), match[2].toUpperCase());
    }
  });
  return map;
};

export const parseOptionsInline = (block: string) => {
  const normalized = block.replace(/\s+/g, " ").trim();
  const regex = /([A-D])[.)]\s*([^A-D]+?)(?=\s+[A-D][.)]\s*|$)/gi;
  const options: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(normalized)) !== null) {
    options.push(match[2].trim());
  }
  return options;
};

export const parseQuestionsFromText = (
  rawText: string,
  answerKey: Map<number, string>,
) => {
  const cleaned = rawText.replace(/\u0000/g, "");
  const questionBlocks = cleaned
    .split(/\n?\s*(\d+)\s*[.)]\s+/)
    .filter(Boolean);
  const parsed: Question[] = [];
  for (let i = 0; i < questionBlocks.length; i += 2) {
    const number = Number(questionBlocks[i]);
    const block = questionBlocks[i + 1] ?? "";
    const lines = block
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;
    const textLine = lines[0];
    const options: string[] = [];
    lines.slice(1).forEach((line) => {
      const optMatch = line.match(/^[A-D][.)]\s*(.+)$/i);
      if (optMatch) options.push(optMatch[1].trim());
    });
    const inlineOptions = options.length === 0 ? parseOptionsInline(block) : [];
    const finalOptions = options.length > 0 ? options : inlineOptions;
    if (finalOptions.length === 0) continue;
    const correctLetter = answerKey.get(number) ?? "A";
    const correctIndex = ["A", "B", "C", "D"].indexOf(correctLetter);
    const correctAnswer =
      finalOptions[correctIndex] ?? finalOptions[0] ?? correctLetter;
    parsed.push({
      id: generateId(),
      text: textLine,
      type: "mcq",
      options: finalOptions,
      correctAnswer,
    });
  }
  return parsed;
};

export const parseCsv = (text: string) => {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];
  const pushCell = () => {
    row.push(current.trim());
    current = "";
  };
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      pushCell();
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      pushCell();
      if (row.length > 1) rows.push(row);
      row = [];
      continue;
    }
    current += char;
  }
  if (current.length > 0 || row.length > 0) {
    pushCell();
    if (row.length > 1) rows.push(row);
  }
  return rows;
};
