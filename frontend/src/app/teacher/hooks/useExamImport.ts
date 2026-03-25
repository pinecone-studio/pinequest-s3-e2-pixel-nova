import { useState } from "react";
import type { Question } from "../types";
import { parseCsvQuestions } from "./import-csv";
import { parseDocxQuestions } from "./import-docx";
import { parseImageQuestions } from "./import-image";
import { parsePdfQuestions } from "./import-pdf";
import { promptQuestionLimit } from "./import-utils";

export const useExamImport = (params: {
  setQuestions: (next: Question[] | ((prev: Question[]) => Question[])) => void;
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
      const parsed = parseCsvQuestions(text);
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

  const handleImageUpload = async (file: File) => {
    setImportError(null);
    try {
      const questionLimit = promptQuestionLimit(
        "Энэ зурагнаас хэдэн асуулт гаргах вэ? (жишээ: 5)",
        "5",
      );
      if (!questionLimit) {
        setImportError("Асуултын тоо буруу байна.");
        return;
      }
      const { questions, usedFallback } = await parseImageQuestions(
        file,
        questionLimit,
      );
      setQuestions((prev) => [...prev, ...questions]);
      showToast(
        usedFallback
          ? "OCR асуулт олсонгүй. Загвар асуултууд нэмэгдлээ."
          : `${questions.length} асуулт зурагнаас үүсгэгдлээ. Зөв хариултыг сонгоно уу.`,
      );
      if (!examTitle) setExamTitle(file.name.replace(/\.[^.]+$/, ""));
    } catch {
      setImportError("Зураг боловсруулах үед алдаа гарлаа.");
    }
  };

  const handleDocxUpload = async (file: File) => {
    setImportError(null);
    try {
      const parsedQuestions = await parseDocxQuestions(file);
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
      const questionLimit = promptQuestionLimit(
        "PDF-ээс хэдэн асуулт үүсгэх вэ? (жишээ: 20)",
        "20",
      );
      if (!questionLimit) {
        setPdfError("Асуултын тоо буруу байна.");
        setPdfLoading(false);
        return;
      }
      const questions = await parsePdfQuestions({
        file,
        questionLimit,
        pdfUseOcr,
        answerKeyPage,
      });
      if (questions.length === 0) {
        setPdfError("PDF‑ээс асуулт олдсонгүй. Форматыг шалгана уу.");
      } else {
        setQuestions(questions);
        if (!examTitle) {
          setExamTitle(file.name.replace(/\.pdf$/i, ""));
        }
        showToast(
          `${questions.length} асуулт автоматаар бөглөгдлөө. Зөв хариултыг гараар сонгоно уу.`,
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Тодорхойгүй алдаа";
      // Surface the actual error for debugging
      console.error("PDF parse error:", err);
      setPdfError(`PDF боловсруулах үед алдаа гарлаа. (${message})`);
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
    handleImageUpload,
    handleDocxUpload,
    handlePdfUpload,
  };
};
