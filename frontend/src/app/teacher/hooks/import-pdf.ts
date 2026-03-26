import {
  isQuestionTextSuspicious,
  parseAnswerKey,
  parseQuestionsFromText,
} from "../utils";
import type { Question } from "../types";

type PdfImageObj = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
  kind: number;
};
type PdfPageObjs = {
  get: (name: string, callback: (img: PdfImageObj) => void) => void;
};
type PdfPage = {
  getTextContent: () => Promise<{ items: { str?: string }[] }>;
  render: (args: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void> };
  getViewport: (args: { scale: number }) => { width: number; height: number };
  getOperatorList: () => Promise<{ fnArray: number[]; argsArray: unknown[][] }>;
  objs: PdfPageObjs;
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

const renderPageToCanvas = async (page: PdfPage, scale = 1.8) => {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return null;
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas;
};

const imageObjToDataUrl = (img: PdfImageObj): string | null => {
  const { width, height, data, kind } = img;
  if (!data || !width || !height) return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  let rgba: Uint8ClampedArray;
  try {
    if (kind === 3) {
      rgba = data;
    } else if (kind === 2) {
      rgba = new Uint8ClampedArray(width * height * 4);
      for (let j = 0; j < width * height; j++) {
        rgba[j * 4] = data[j * 3] ?? 0;
        rgba[j * 4 + 1] = data[j * 3 + 1] ?? 0;
        rgba[j * 4 + 2] = data[j * 3 + 2] ?? 0;
        rgba[j * 4 + 3] = 255;
      }
    } else {
      rgba = new Uint8ClampedArray(width * height * 4);
      for (let j = 0; j < width * height; j++) {
        const byteIdx = Math.floor(j / 8);
        const bitIdx = 7 - (j % 8);
        const byte = data[byteIdx];
        if (byte == null) continue;
        const v = (byte >> bitIdx) & 1 ? 0 : 255;
        rgba[j * 4] = v;
        rgba[j * 4 + 1] = v;
        rgba[j * 4 + 2] = v;
        rgba[j * 4 + 3] = 255;
      }
    }
    ctx.putImageData(
      new ImageData(new Uint8ClampedArray(rgba.buffer as ArrayBuffer), width, height),
      0,
      0,
    );
    return canvas.toDataURL("image/jpeg", 0.8);
  } catch {
    return null;
  }
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
  const pageImages: (string[] | null)[] = [];
  const pageToRead =
    answerKeyPage === "last"
      ? pdf.numPages
      : Math.min(Math.max(answerKeyPage, 1), pdf.numPages);

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => (typeof item.str === "string" ? item.str : ""))
      .join(" ");
    pageTexts.push(`${pageText}\n`);

    const opList = await page.getOperatorList();
    const imgNames = new Set<string>();
    for (let oi = 0; oi < opList.fnArray.length; oi += 1) {
      if (IMAGE_OPS.has((opList.fnArray as number[])[oi])) {
        const arg = (opList.argsArray[oi] as unknown[])[0];
        if (typeof arg === "string") imgNames.add(arg);
      }
    }
    const pageImgUrls: string[] = [];
    for (const name of imgNames) {
      const imgObj = await new Promise<PdfImageObj | null>((resolve) => {
        try {
          page.objs.get(name, (obj) => resolve(obj ?? null));
        } catch {
          resolve(null);
        }
      });
      if (!imgObj || imgObj.width < 40 || imgObj.height < 40) continue;
      const url = imageObjToDataUrl(imgObj);
      if (url) pageImgUrls.push(url);
    }
    pageImages.push(pageImgUrls.length > 0 ? pageImgUrls : null);
  }

  const combinedText = pageTexts.join("");

  let answerKey = new Map<number, string>();
  if (pdfUseOcr) {
    const tesseract = await getTesseract();
    const keyPage = await pdf.getPage(pageToRead);
    const canvas = await renderPageToCanvas(keyPage, 1.8);
    if (canvas) {
      const result = await tesseract.recognize(canvas, "eng");
      answerKey = parseAnswerKey(result.data.text);
    }
  }

  const pagedQuestions: Question[] = [];

  for (let pageIndex = 0; pageIndex < pageTexts.length; pageIndex += 1) {
    if (pdfUseOcr && answerKey.size > 0 && pageIndex + 1 === pageToRead) {
      continue;
    }

    let parsedPageQuestions = parseQuestionsFromText(
      pageTexts[pageIndex] ?? "",
      answerKey,
    );
    const images = pageImages[pageIndex] ?? [];
    const needsOcrRecovery =
      parsedPageQuestions.length === 0 ||
      parsedPageQuestions.some((question) =>
        isQuestionTextSuspicious(question.text),
      );

    let pagePreviewUrl: string | undefined;

    if (needsOcrRecovery && images.length > 0) {
      const page = await pdf.getPage(pageIndex + 1);
      const canvas = await renderPageToCanvas(page, 2);
      if (canvas) {
        pagePreviewUrl = canvas.toDataURL("image/jpeg", 0.82);
        const tesseract = await getTesseract();
        const ocrResult = await tesseract.recognize(canvas, "eng");
        const ocrQuestions = parseQuestionsFromText(ocrResult.data.text, answerKey);
        if (ocrQuestions.length >= parsedPageQuestions.length) {
          parsedPageQuestions = ocrQuestions;
        }
      }
    }

    const questionsWithImages = parsedPageQuestions.map((question, index) => ({
      ...question,
      points: question.points ?? 1,
      imageUrl:
        images[index] ??
        (index === 0 ? images[0] : undefined) ??
        pagePreviewUrl ??
        question.imageUrl,
    }));

    if (questionsWithImages.length === 0 && (pagePreviewUrl || images[0])) {
      questionsWithImages.push({
        id: crypto.randomUUID(),
        text: `Зурагтай асуулт (${pageIndex + 1}-р хуудас) - OCR дутуу тул Edit дээр гараар засна уу.`,
        type: "open",
        correctAnswer: "",
        points: 1,
        imageUrl: pagePreviewUrl ?? images[0],
      });
    }

    pagedQuestions.push(...questionsWithImages);
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
