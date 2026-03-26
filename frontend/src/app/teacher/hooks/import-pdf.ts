import {
  isQuestionTextSuspicious,
  parseAnswerKey,
  parseQuestionsFromText,
} from "../utils";
import type { Question } from "../types";

type PdfTextItem = {
  str?: string;
  transform?: number[];
  width?: number;
  height?: number;
  hasEOL?: boolean;
};
type PdfPage = {
  getTextContent: () => Promise<{ items: PdfTextItem[] }>;
  render: (args: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void> };
  getViewport: (args: { scale: number }) => { width: number; height: number };
  getOperatorList: () => Promise<{ fnArray: number[]; argsArray: unknown[][] }>;
};
type PdfDoc = {
  numPages: number;
  getPage: (pageNum: number) => Promise<PdfPage>;
};
type PdfJs = {
  version: string;
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (args: { data: ArrayBuffer }) => { promise: Promise<PdfDoc> };
};

const getPdfJs = async () => {
  const pdfModule = (await import("pdfjs-dist/legacy/build/pdf")) as {
    default?: PdfJs;
  } & PdfJs;
  const pdfjsLib = pdfModule.default ?? pdfModule;
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  return pdfjsLib;
};

type Tesseract = {
  recognize: (
    image: HTMLCanvasElement,
    lang: string
  ) => Promise<{ data: { text: string } }>;
};

let tesseractPromise: Promise<Tesseract> | null = null;

const getTesseract = async () => {
  tesseractPromise ??= import("tesseract.js") as Promise<Tesseract>;
  return tesseractPromise;
};

type PositionedLine = {
  text: string;
  top: number;
  bottom: number;
  lineCountWeight: number;
  minX: number;
  maxX: number;
  fragments: Array<{
    text: string;
    x: number;
  }>;
};

type QuestionSegment = {
  number: number;
  text: string;
  top: number;
  bottom: number;
  lineCount: number;
  lines: PositionedLine[];
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const renderPageToCanvas = async (page: PdfPage, scale = 2) => {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return null;
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas;
};

const createCropCanvas = (
  source: HTMLCanvasElement,
  top: number,
  bottom: number,
) => {
  const safeTop = Math.floor(clamp(top, 0, source.height - 1));
  const safeBottom = Math.ceil(clamp(bottom, safeTop + 1, source.height));
  const cropHeight = safeBottom - safeTop;
  if (cropHeight < 48) return null;

  const maxWidth = 1200;
  const scale = Math.min(1, maxWidth / source.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(cropHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(
    source,
    0,
    safeTop,
    source.width,
    cropHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas;
};

const canvasToDataUrl = (canvas: HTMLCanvasElement | null, quality = 0.74) => {
  if (!canvas) return undefined;
  try {
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return undefined;
  }
};

const buildPositionedLines = (
  items: PdfTextItem[],
  pageHeight: number,
): PositionedLine[] => {
  const fragments = items
    .map((item) => {
      const text = (item.str ?? "").replace(/\s+/g, " ").trim();
      const transform = item.transform ?? [];
      const x = Number(transform[4] ?? 0);
      const y = Number(transform[5] ?? 0);
      const height = Math.abs(
        Number(item.height ?? transform[0] ?? transform[3] ?? 12),
      );

      if (!text) return null;

      return {
        text,
        x,
        y,
        height: Number.isFinite(height) && height > 0 ? height : 12,
      };
    })
    .filter(
      (
        item,
      ): item is {
        text: string;
        x: number;
        y: number;
        height: number;
      } => Boolean(item),
    );

  const groups: Array<{
    baseline: number;
    fragments: typeof fragments;
    minY: number;
    maxY: number;
    maxHeight: number;
  }> = [];

  fragments.sort((left, right) => {
    if (Math.abs(left.y - right.y) > 6) return right.y - left.y;
    return left.x - right.x;
  });

  for (const fragment of fragments) {
    const line = groups.find(
      (candidate) =>
        Math.abs(candidate.baseline - fragment.y) <=
        Math.max(5, Math.min(12, fragment.height * 0.7)),
    );

    if (line) {
      line.fragments.push(fragment);
      line.minY = Math.min(line.minY, fragment.y);
      line.maxY = Math.max(line.maxY, fragment.y);
      line.maxHeight = Math.max(line.maxHeight, fragment.height);
      line.baseline = (line.baseline + fragment.y) / 2;
      continue;
    }

    groups.push({
      baseline: fragment.y,
      fragments: [fragment],
      minY: fragment.y,
      maxY: fragment.y,
      maxHeight: fragment.height,
    });
  }

  return groups
    .map((group) => {
      const text = group.fragments
        .sort((left, right) => left.x - right.x)
        .map((fragment) => fragment.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      const top = clamp(
        pageHeight - (group.maxY + group.maxHeight) - 8,
        0,
        pageHeight,
      );
      const bottom = clamp(pageHeight - group.minY + 10, top + 1, pageHeight);

      return {
        text,
        top,
        bottom,
        lineCountWeight: Math.max(1, Math.round(group.maxHeight / 12)),
        minX: Math.min(...group.fragments.map((fragment) => fragment.x)),
        maxX: Math.max(...group.fragments.map((fragment) => fragment.x)),
        fragments: group.fragments.map((fragment) => ({
          text: fragment.text,
          x: fragment.x,
        })),
      };
    })
    .filter((line) => line.text.length > 0)
    .sort((left, right) => left.top - right.top);
};

const buildQuestionSegments = (
  lines: PositionedLine[],
  pageHeight: number,
): QuestionSegment[] => {
  if (lines.length === 0) return [];

  const leftMostX = Math.min(...lines.map((line) => line.minX));
  const anchorMaxX = leftMostX + 180;
  const anchors = lines
    .map((line, index) => {
      const lineMatch = line.text.match(/^(\d{1,3})\s*[.)]\s+/);
      if (lineMatch) {
        return {
          index,
          number: Number(lineMatch[1]),
        };
      }

      const fragmentMatch = line.fragments.find((fragment) => {
        if (fragment.x > anchorMaxX) return false;
        return /^(\d{1,3})\s*[.)](?:\s|$)/.test(fragment.text.trim());
      });

      if (!fragmentMatch) return null;

      const nextFragment = line.fragments.find(
        (fragment) => fragment.x > fragmentMatch.x,
      );
      if (!nextFragment) return null;

      return {
        index,
        number: Number(
          fragmentMatch.text.trim().match(/^(\d{1,3})/)?.[1] ?? "0",
        ),
      };
    })
    .filter(
      (
        anchor,
      ): anchor is {
        index: number;
        number: number;
      } => Boolean(anchor?.number),
    )
    .filter((anchor, index, allAnchors) => {
      const previous = allAnchors[index - 1];
      if (!previous) return true;
      return !(
        previous.index === anchor.index &&
        previous.number === anchor.number
      );
    });

  return anchors.map((anchor, index) => {
    const nextAnchor = anchors[index + 1];
    const startLine = lines[anchor.index];
    const endIndex = nextAnchor ? nextAnchor.index : lines.length;
    const relevantLines = lines.slice(anchor.index, endIndex);
    const nextTop = nextAnchor ? lines[nextAnchor.index].top : pageHeight - 12;

    return {
      number: anchor.number,
      text: relevantLines.map((line) => line.text).join("\n").trim(),
      top: clamp(startLine.top - 16, 0, pageHeight),
      bottom: clamp(Math.max(startLine.bottom + 32, nextTop - 14), 0, pageHeight),
      lineCount: relevantLines.reduce(
        (sum, line) => sum + line.lineCountWeight,
        0,
      ),
      lines: relevantLines,
    };
  });
};

const parseSingleQuestion = (
  text: string,
  answerKey: Map<number, string>,
): Question | null => {
  const parsed = parseQuestionsFromText(text, answerKey);
  return parsed[0] ?? null;
};

const VISUAL_CUE_PATTERN =
  /(graph|diagram|figure|chart|table|image|picture|coordinate|plane|plot|grid|зураг|график|диаграм|дүрс|хүснэгт|координат|байрлал|дүрслэл)/i;

const findVisualCropBounds = (
  source: HTMLCanvasElement,
  segment: QuestionSegment,
) => {
  const safeTop = Math.floor(clamp(segment.top, 0, source.height - 1));
  const safeBottom = Math.ceil(clamp(segment.bottom, safeTop + 1, source.height));
  const segmentHeight = safeBottom - safeTop;
  if (segmentHeight < 48) return null;

  const rowStep = 2;
  const colStep = 4;
  const padding = 12;
  const activeThreshold = Math.max(6, Math.round(source.width / 180));
  const bands: Array<{ top: number; bottom: number; score: number }> = [];
  let activeBand: { top: number; bottom: number; score: number } | null = null;

  const isTextPixel = (x: number, y: number) =>
    segment.lines.some(
      (line) =>
        y >= line.top - 6 &&
        y <= line.bottom + 6 &&
        x >= line.minX - 14 &&
        x <= line.maxX + 14,
    );

  const getPixelIndex = (x: number, y: number, width: number) =>
    (y * width + x) * 4;

  const ctx = source.getContext("2d");
  if (!ctx) return null;
  const imageData = ctx.getImageData(0, safeTop, source.width, segmentHeight);
  const { data, width } = imageData;

  for (let localY = 0; localY < segmentHeight; localY += rowStep) {
    const absoluteY = safeTop + localY;
    let darkCount = 0;

    for (let x = 0; x < width; x += colStep) {
      if (isTextPixel(x, absoluteY)) continue;
      const idx = getPixelIndex(x, localY, width);
      const alpha = data[idx + 3] ?? 0;
      if (alpha < 8) continue;
      const r = data[idx] ?? 255;
      const g = data[idx + 1] ?? 255;
      const b = data[idx + 2] ?? 255;
      const brightness = (r + g + b) / 3;
      if (brightness < 245) darkCount += 1;
    }

    if (darkCount >= activeThreshold) {
      if (!activeBand) {
        activeBand = {
          top: absoluteY,
          bottom: absoluteY + rowStep,
          score: darkCount,
        };
      } else {
        activeBand.bottom = absoluteY + rowStep;
        activeBand.score += darkCount;
      }
      continue;
    }

    if (activeBand) {
      bands.push(activeBand);
      activeBand = null;
    }
  }

  if (activeBand) {
    bands.push(activeBand);
  }

  if (bands.length === 0) return null;

  const bestBand = bands
    .filter((band) => band.bottom - band.top >= 24)
    .sort((left, right) => right.score - left.score)[0];

  if (!bestBand) return null;

  return {
    top: clamp(bestBand.top - padding, safeTop, safeBottom),
    bottom: clamp(bestBand.bottom + padding, safeTop + 1, safeBottom),
  };
};

const shouldAttachCrop = (params: {
  blockText: string;
  segment: QuestionSegment;
  pageHasGraphics: boolean;
  recoveredWithOcr: boolean;
  question: Question | null;
}) => {
  const { blockText, segment, pageHasGraphics, recoveredWithOcr, question } = params;
  const visualHeight = segment.bottom - segment.top;
  const expectedTextHeight = Math.max(52, Math.min(160, segment.lineCount * 18));
  const visualOverflow = visualHeight - expectedTextHeight;
  const mentionsVisualCue = VISUAL_CUE_PATTERN.test(
    [blockText, question?.text ?? ""].join(" "),
  );
  const looksGraphHeavy =
    visualHeight >= Math.max(170, segment.lineCount * 24) ||
    visualOverflow >= 72;
  const suspiciousQuestion =
    !question || isQuestionTextSuspicious(question.text);

  return (
    looksGraphHeavy ||
    mentionsVisualCue ||
    recoveredWithOcr ||
    (pageHasGraphics && suspiciousQuestion && visualOverflow >= 90)
  );
};

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

  let answerKey = parseAnswerKey(pageTexts[pageToRead - 1] ?? "");
  if (pdfUseOcr || answerKey.size === 0) {
    const keyPage = pageQuestionPayloads[pageToRead - 1]?.page;
    const canvas = keyPage ? await renderPageToCanvas(keyPage, 2) : null;
    if (canvas) {
      const tesseract = await getTesseract();
      const result = await tesseract.recognize(canvas, "eng");
      const ocrAnswerKey = parseAnswerKey(result.data.text);
      if (ocrAnswerKey.size >= answerKey.size) {
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
  let tesseract: Tesseract | null = null;

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
        const ocrResult = await tesseract.recognize(questionCropCanvas, "eng");
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
