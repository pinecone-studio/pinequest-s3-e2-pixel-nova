import { useState } from "react";
import { parseAnswerKey, parseCsv, parseQuestionsFromText } from "../utils";
import type { Question } from "../types";

export const useExamImport = (params: {
  setQuestions: (next: Question[]) => void;
  examTitle: string;
  setExamTitle: (value: string) => void;
  showToast: (message: string) => void;
}) => {
  const { setQuestions, examTitle, setExamTitle, showToast } = params;
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfUseOcr, setPdfUseOcr] = useState(true);
  const [answerKeyPage, setAnswerKeyPage] = useState<number | "last">("last");
  const [importError, setImportError] = useState<string | null>(null);

  const handleCsvUpload = async (file: File) => {
    setImportError(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) {
        setImportError("CSV файл хоосон байна.");
        return;
      }
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
          };
        })
        .filter(Boolean) as Question[];
      if (parsed.length === 0) {
        setImportError("CSV формат тохирохгүй байна.");
        return;
      }
      setQuestions(parsed);
      if (!examTitle) setExamTitle(file.name.replace(/\.csv$/i, ""));
      showToast(`${parsed.length} асуулт CSV‑ээс бөглөгдлөө.`);
    } catch {
      setImportError("CSV боловсруулах үед алдаа гарлаа.");
    }
  };

  const handleDocxUpload = async (file: File) => {
    setImportError(null);
    try {
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
      const parsedQuestions = parseQuestionsFromText(rawText, answerKey);
      if (parsedQuestions.length === 0) {
        setImportError("DOCX‑ээс асуулт олдсонгүй.");
        return;
      }
      setQuestions(parsedQuestions);
      if (!examTitle) setExamTitle(file.name.replace(/\.docx$/i, ""));
      showToast(`${parsedQuestions.length} асуулт DOCX‑ээс бөглөгдлөө.`);
    } catch {
      setImportError("DOCX боловсруулах үед алдаа гарлаа.");
    }
  };

  const handlePdfUpload = async (file: File) => {
    setPdfLoading(true);
    setPdfError(null);
    try {
      type PdfPage = {
        getTextContent: () => Promise<{ items: { str?: string }[] }>;
        render: (args: {
          canvasContext: CanvasRenderingContext2D;
          viewport: { width: number; height: number };
        }) => { promise: Promise<void> };
        getViewport: (args: { scale: number }) => { width: number; height: number };
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
      const pdfjsLib = (await import("pdfjs-dist/legacy/build/pdf")).default as PdfJs;
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let combinedText = "";
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => (typeof item.str === "string" ? item.str : ""))
          .join(" ");
        combinedText += `${pageText}\n`;
      }

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
      if (parsedQuestions.length === 0) {
        setPdfError("PDF‑ээс асуулт олдсонгүй. Форматыг шалгана уу.");
      } else {
        setQuestions(parsedQuestions);
        if (!examTitle) {
          setExamTitle(file.name.replace(/\.pdf$/i, ""));
        }
        showToast(`${parsedQuestions.length} асуулт автоматаар бөглөгдлөө.`);
      }
    } catch {
      setPdfError("PDF боловсруулах үед алдаа гарлаа.");
    } finally {
      setPdfLoading(false);
    }
  };

  return {
    pdfLoading,
    pdfError,
    pdfUseOcr,
    setPdfUseOcr,
    answerKeyPage,
    setAnswerKeyPage,
    importError,
    handleCsvUpload,
    handleDocxUpload,
    handlePdfUpload,
  };
};
