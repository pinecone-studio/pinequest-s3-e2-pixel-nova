import { parseQuestionsFromText } from "../utils";
import type { Question } from "../types";
import { downscaleImage, readFileAsDataUrl } from "./import-utils";

type ImageImportResult = {
  dataUrl: string;
  rawText: string;
  questions: Question[];
  usedFallback: boolean;
};

export const parseImageQuestions = async (
  file: File,
  questionLimit: number,
): Promise<ImageImportResult> => {
  const rawDataUrl = await readFileAsDataUrl(file);
  const dataUrl = await downscaleImage(rawDataUrl);

  type Tesseract = {
    recognize: (
      image: HTMLCanvasElement | string,
      lang: string,
    ) => Promise<{ data: { text: string } }>;
  };
  const tesseract = (await import("tesseract.js")) as Tesseract;
  const result = await tesseract.recognize(dataUrl, "eng");
  const rawText = result.data.text || "";
  const parsed = parseQuestionsFromText(rawText, new Map());
  const forcedMcq = parsed.map((question, idx) => ({
    ...question,
    type: "mcq" as const,
    options: ["Сонголт A", "Сонголт B", "Сонголт C", "Сонголт D"],
    correctAnswer: "",
    imageUrl: idx === 0 ? dataUrl : undefined,
    points: question.points ?? 1,
  }));
  const limited = forcedMcq.slice(0, questionLimit);

  if (limited.length === 0) {
    return { dataUrl, rawText, questions: [], usedFallback: false };
  }

  return { dataUrl, rawText, questions: limited, usedFallback: false };
};
