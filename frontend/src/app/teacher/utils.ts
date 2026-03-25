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

const OPTION_LABELS = ["A", "B", "C", "D", "E"] as const;
const CYRILLIC_OPTION_MAP: Record<string, string> = {
  А: "A",
  Б: "B",
  В: "C",
  Г: "D",
  Д: "E",
};

const normalizeOptionLabel = (value: string) => {
  const upper = value.trim().toUpperCase();
  return CYRILLIC_OPTION_MAP[upper] ?? upper;
};

const sanitizePdfText = (rawText: string) =>
  rawText
    .replace(/\u0000/g, "")
    .replace(/\r/g, "\n")
    .replace(/(\d)\s+(\d)\s*([.)])/g, "$1$2$3")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/5-\s*р ангиийн [^.]*?хугацаа \d+ минут/gi, " ")
    .replace(/\b[AА]\s+хувилбар\b/gi, " ");

const isNoiseLine = (line: string) => {
  const normalized = line.trim();
  if (!normalized) return true;
  if (/^(хугацаа|хууд(?:ас|\.?)|answer\s*sheet)/i.test(normalized)) return true;
  if (/^[ABCDEАБВГД](\s+[ABCDEАБВГД]){3,}$/i.test(normalized)) return true;
  if (/^\d+(?:\s+\d+){5,}$/.test(normalized)) return true;
  return false;
};

export const parseAnswerKey = (text: string) => {
  const map = new Map<number, string>();
  const lines = sanitizePdfText(text)
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const matches = [...line.matchAll(/(\d+)\s*[:.)-]?\s*([A-EАБВГД])/gi)];
    for (const match of matches) {
      const questionNumber = Number(match[1]);
      const label = normalizeOptionLabel(match[2]);
      if (questionNumber > 0 && OPTION_LABELS.includes(label as (typeof OPTION_LABELS)[number])) {
        map.set(questionNumber, label);
      }
    }
  }

  return map;
};

const extractOptions = (block: string) => {
  const regex = /(?:^|\n|\s)([A-EАБВГД])[.)]\s*(.+?)(?=(?:\s+[A-EАБВГД][.)]\s)|(?:\n+[A-EАБВГД][.)]\s)|$)/gis;
  const options: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(block)) !== null) {
    const optionText = match[2]
      .replace(/\s+/g, " ")
      .replace(/\s*$/, "")
      .trim();
    if (optionText) options.push(optionText);
  }

  return options;
};

const extractStem = (block: string) => {
  const optionStart = block.search(/(?:^|\n|\s)[A-EАБВГД][.)]\s*/i);
  const stem = (optionStart >= 0 ? block.slice(0, optionStart) : block)
    .replace(/\s+/g, " ")
    .trim();
  return stem;
};

const splitQuestionBlocks = (rawText: string) => {
  const text = sanitizePdfText(rawText)
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => !isNoiseLine(line))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const blocks: Array<{ number: number; content: string }> = [];
  const regex = /(?:^|\s)(\d{1,3})\s*[.)]\s*/g;
  const matches = [...text.matchAll(regex)];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const number = Number(match[1]);
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index ?? text.length : text.length;
    const content = text.slice(start, end).trim();
    if (!number || !content) continue;
    blocks.push({ number, content });
  }

  return blocks;
};

export const parseQuestionsFromText = (
  rawText: string,
  answerKey: Map<number, string>,
) => {
  const blocks = splitQuestionBlocks(rawText);
  const parsed: Question[] = [];

  for (const { number, content } of blocks) {
    const stem = extractStem(content);
    if (!stem) continue;

    const options = extractOptions(content);
    if (options.length >= 2) {
      const correctLetter = answerKey.get(number) ?? "A";
      const correctIndex = OPTION_LABELS.indexOf(correctLetter as (typeof OPTION_LABELS)[number]);
      parsed.push({
        id: generateId(),
        text: stem,
        type: "mcq",
        options,
        correctAnswer: options[Math.max(correctIndex, 0)] ?? options[0] ?? "",
      });
      continue;
    }

    parsed.push({
      id: generateId(),
      text: stem,
      type: "open",
      correctAnswer: "",
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
