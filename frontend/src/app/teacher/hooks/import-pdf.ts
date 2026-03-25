import { parseAnswerKey, parseQuestionsFromText } from "../utils";
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
  const pdfModule = (await import("pdfjs-dist/legacy/build/pdf")) as {
    default?: PdfJs;
  } & PdfJs;
  const pdfjsLib = pdfModule.default ?? pdfModule;
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const IMAGE_OPS = new Set([83, 85, 86, 88]);
  const pageTexts: string[] = [];
  const pageImages: (string[] | null)[] = [];

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
    type Tesseract = {
      recognize: (
        image: HTMLCanvasElement,
        lang: string
      ) => Promise<{ data: { text: string } }>;
    };
    const tesseract = (await import("tesseract.js")) as Tesseract;
    const pageToRead =
      answerKeyPage === "last"
        ? pdf.numPages
        : Math.min(Math.max(answerKeyPage, 1), pdf.numPages);
    const keyPage = await pdf.getPage(pageToRead);
    const viewport = keyPage.getViewport({ scale: 1.8 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (context) {
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await keyPage.render({ canvasContext: context, viewport }).promise;
      const result = await tesseract.recognize(canvas, "eng");
      answerKey = parseAnswerKey(result.data.text);
    }
  }

  const parsedQuestions = parseQuestionsFromText(combinedText, answerKey);
  const forcedMcq = parsedQuestions.map((question) => {
    const baseOptions =
      question.options && question.options.length >= 2
        ? question.options
        : ["Сонголт A", "Сонголт B", "Сонголт C", "Сонголт D"];
    return {
      ...question,
      type: "mcq" as const,
      options: baseOptions.slice(0, 4),
      correctAnswer: "",
      points: question.points ?? 1,
    };
  });

  const pageImageQueues = pageImages.map((imgs) => (imgs ? [...imgs] : []));
  for (const question of forcedMcq) {
    const snippet = question.text.slice(0, 30);
    for (let i = 0; i < pageTexts.length; i += 1) {
      if (pageImageQueues[i].length > 0 && pageTexts[i].includes(snippet)) {
        question.imageUrl = pageImageQueues[i].shift();
        break;
      }
    }
  }

  return forcedMcq.slice(0, questionLimit);
};
