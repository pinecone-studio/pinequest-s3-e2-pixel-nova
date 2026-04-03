import { isQuestionTextSuspicious, parseQuestionsFromText } from "../utils";
import type { Question } from "../types";
import { recognizeWithFallback } from "./import-ocr";
import { createCropCanvas, canvasToDataUrl, renderPageToCanvas } from "./import-pdf-canvas";
import { getPdfJs, getTesseract } from "./import-pdf-loaders";
import {
  buildPositionedLines,
  buildQuestionSegments,
  findVisualCropBounds,
} from "./import-pdf-logic";
import { shouldAttachCrop } from "./import-pdf-visual";
import {
  parseAnswerKeyFromPage,
  parseSingleQuestion,
} from "./import-pdf-question-parse";
import type {
  PdfPage,
  PositionedLine,
  QuestionSegment,
} from "./import-pdf-types";

type TesseractWorker = Awaited<ReturnType<typeof getTesseract>>;

export const parsePdfQuestions = async (params: {
  file: File;
  questionLimit: number;
  pdfUseOcr: boolean;
  answerKeyPage: number | "last";
}): Promise<Question[]> => {
  const { file, questionLimit, pdfUseOcr, answerKeyPage } = params;
  const pdfjsLib = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const IMAGE_OPS = new Set([83, 85, 86, 88]);
  const pageTexts: string[] = [];
  const pageToRead =
    answerKeyPage === "last"
      ? pdf.numPages
      : Math.min(Math.max(answerKeyPage, 1), pdf.numPages);

  const pageQuestionPayloads: Array<{
    page: PdfPage;
    lines: PositionedLine[];
    segments: QuestionSegment[];
    pageHeight: number;
    pageHasGraphics: boolean;
  }> = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => (typeof item.str === "string" ? item.str : ""))
      .join(" ");
    pageTexts.push(`${pageText}\n`);

    const viewport = page.getViewport({ scale: 2 });
    const lines = buildPositionedLines(textContent.items, viewport.height);
    const opList = await page.getOperatorList();
    const pageHasGraphics = opList.fnArray.some((operation) =>
      IMAGE_OPS.has(Number(operation)),
    );

    pageQuestionPayloads.push({
      page,
      lines,
      segments: buildQuestionSegments(lines, viewport.height),
      pageHeight: viewport.height,
      pageHasGraphics,
    });
  }

  const combinedText = pageTexts.join("");

  const scoreAnswerKeyText = (text: string) => {
    const normalized = text.replace(/\s+/g, " ").trim();
    const matches = [...normalized.matchAll(/(\d{1,3})\s*[:.)-]?\s*([A-EАБВГД])/gi)];
    const matchCount = matches.length;
    const wordCount = Math.max(1, normalized.split(/\s+/).length);
    const densityScore = matchCount / wordCount;
    const keywordBonus = /answer\s*key|answer\s*sheet|хариу|хариулт|зөв\s*хариу/i.test(
      normalized,
    )
      ? 10
      : 0;
    return { matchCount, score: matchCount + keywordBonus + densityScore * 10 };
  };

  const pickBestAnswerKey = (texts: string[]) => {
    let best = new Map<number, string>();
    let bestScore = -1;
    let bestMatches = 0;
    for (const text of texts) {
      const key = parseAnswerKeyFromPage(text);
      const { matchCount, score } = scoreAnswerKeyText(text);
      if (matchCount < 3) continue;
      if (score > bestScore || (score === bestScore && key.size > best.size)) {
        best = key;
        bestScore = score;
        bestMatches = matchCount;
      }
    }
    if (best.size === 0 || bestMatches < 3) return new Map<number, string>();
    return best;
  };

  let answerKey = parseAnswerKeyFromPage(pageTexts[pageToRead - 1] ?? "");
  if (answerKey.size === 0) {
    answerKey = pickBestAnswerKey(pageTexts);
  }
  if (pdfUseOcr || answerKey.size === 0) {
    const keyPage = pageQuestionPayloads[pageToRead - 1]?.page;
    const canvas = keyPage ? await renderPageToCanvas(keyPage, 2) : null;
    if (canvas) {
      const tesseract = await getTesseract();
      const result = await recognizeWithFallback(tesseract, canvas);
      const ocrAnswerKey = parseAnswerKeyFromPage(result.data.text);
      if (ocrAnswerKey.size >= Math.max(3, answerKey.size)) {
        answerKey = ocrAnswerKey;
      } else {
        for (const [questionNumber, label] of ocrAnswerKey.entries()) {
          if (!answerKey.has(questionNumber)) {
            answerKey.set(questionNumber, label);
          }
        }
      }
    }
  }

  const pagedQuestions: Question[] = [];
  let tesseract: TesseractWorker | null = null;

  for (let pageIndex = 0; pageIndex < pageQuestionPayloads.length; pageIndex += 1) {
    if (pdfUseOcr && answerKey.size > 0 && pageIndex + 1 === pageToRead) {
      continue;
    }

    const pagePayload = pageQuestionPayloads[pageIndex];
    const pageCanvas =
      pagePayload.segments.length > 0
        ? await renderPageToCanvas(pagePayload.page, 2)
        : null;

    if (pagePayload.segments.length === 0) {
      const fallbackQuestions = parseQuestionsFromText(
        pageTexts[pageIndex] ?? "",
        answerKey,
      );
      pagedQuestions.push(
        ...fallbackQuestions.map((question) => ({
          ...question,
          points: question.points ?? 1,
        })),
      );
      continue;
    }

    for (const segment of pagePayload.segments) {
      const blockText = segment.text;
      let parsedQuestion = parseSingleQuestion(blockText, answerKey);
      let recoveredWithOcr = false;
      const questionCropCanvas = pageCanvas
        ? createCropCanvas(pageCanvas, segment.top, segment.bottom)
        : null;

      if (
        questionCropCanvas &&
        (pdfUseOcr || !parsedQuestion || isQuestionTextSuspicious(parsedQuestion.text))
      ) {
        tesseract ??= await getTesseract();
        const ocrResult = await recognizeWithFallback(tesseract, questionCropCanvas);
        const ocrText = `${segment.number}. ${ocrResult.data.text || ""}`.trim();
        const ocrQuestion = parseSingleQuestion(ocrText, answerKey);

        if (
          ocrQuestion &&
          (
            !parsedQuestion ||
            isQuestionTextSuspicious(parsedQuestion.text) ||
            (ocrQuestion.options?.length ?? 0) > (parsedQuestion.options?.length ?? 0)
          )
        ) {
          parsedQuestion = ocrQuestion;
          recoveredWithOcr = true;
        }
      }

      const fallbackText = blockText
        .replace(/^\d{1,3}\s*[.)]\s*/, "")
        .replace(/\s+/g, " ")
        .trim();

      if (!parsedQuestion && isQuestionTextSuspicious(fallbackText)) {
        continue;
      }

      const finalQuestion: Question =
        parsedQuestion ?? {
          id: crypto.randomUUID(),
          text: fallbackText || `Асуулт ${segment.number}`,
          type: "open",
          correctAnswer: "",
          points: 1,
        };

      const visualBounds = pageCanvas
        ? findVisualCropBounds(pageCanvas, segment)
        : null;
      const visualCropCanvas =
        pageCanvas && visualBounds
          ? createCropCanvas(pageCanvas, visualBounds.top, visualBounds.bottom)
          : null;
      const imageUrl = shouldAttachCrop({
        blockText,
        segment,
        pageHasGraphics: pagePayload.pageHasGraphics,
        recoveredWithOcr,
        question: parsedQuestion,
      })
        ? canvasToDataUrl(visualCropCanvas ?? questionCropCanvas)
        : finalQuestion.imageUrl;

      pagedQuestions.push({
        ...finalQuestion,
        points: finalQuestion.points ?? 1,
        imageUrl,
      });
    }
  }

  if (pagedQuestions.length > 0) {
    return pagedQuestions.slice(0, questionLimit);
  }

  return parseQuestionsFromText(combinedText, answerKey)
    .map((question) => ({
      ...question,
      points: question.points ?? 1,
    }))
    .slice(0, questionLimit);
};
