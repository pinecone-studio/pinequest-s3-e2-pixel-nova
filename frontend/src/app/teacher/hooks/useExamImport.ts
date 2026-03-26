import { useState } from "react";
import { extractPdfQuestions, uploadPdf } from "@/api/pdf";
import type { User } from "@/lib/examGuard";
import type { Question } from "../types";
import { parseCsvQuestions } from "./import-csv";
import { parseDocxQuestions } from "./import-docx";
import { parseImageQuestions } from "./import-image";
import { parsePdfQuestions } from "./import-pdf";
import { promptQuestionLimit } from "./import-utils";
import {
  ExtractedPdfPayload,
  UploadedPdfPayload,
  isApiUnavailableError,
  mapBackendPdfQuestions,
  shouldPreferLocalQuestions,
  uploadQuestionImages,
} from "./exam-import-helpers";

export const useExamImport = (params: {
  setQuestions: (next: Question[] | ((prev: Question[]) => Question[])) => void;
  examTitle: string;
  setExamTitle: (value: string) => void;
  showToast: (message: string) => void;
  currentUser?: User | null;
}) => {
  const { setQuestions, examTitle, setExamTitle, showToast, currentUser } = params;
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfUseOcr, setPdfUseOcr] = useState(true);
  const [answerKeyPage, setAnswerKeyPage] = useState<number | "last">("last");
  const [importError, setImportError] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importLoadingLabel, setImportLoadingLabel] = useState<string | null>(null);


  const handleCsvUpload = async (file: File) => {
    setImportError(null);
    setImportLoading(true);
    setImportLoadingLabel("CSV уншиж байна...");
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
    } finally {
      setImportLoading(false);
      setImportLoadingLabel(null);
    }
  };

  const handleImageUpload = async (file: File) => {
    setImportError(null);
    setImportLoading(true);
    setImportLoadingLabel("Зураг уншиж байна...");
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
      if (questions.length === 0) {
        setImportError("Зурагнаас асуулт олдсонгүй. Илүү тод зураг оруулна уу.");
        return;
      }
      setQuestions((prev) => [...prev, ...questions]);
      showToast(
        usedFallback
          ? "OCR асуулт олсонгүй. Загвар асуултууд нэмэгдлээ."
          : `${questions.length} асуулт зурагнаас үүсгэгдлээ. Зөв хариултыг сонгоно уу.`,
      );
      if (!examTitle) setExamTitle(file.name.replace(/\.[^.]+$/, ""));
    } catch {
      setImportError("Зураг боловсруулах үед алдаа гарлаа.");
    } finally {
      setImportLoading(false);
      setImportLoadingLabel(null);
    }
  };

  const handleDocxUpload = async (file: File) => {
    setImportError(null);
    setImportLoading(true);
    setImportLoadingLabel("DOCX уншиж байна...");
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
    } finally {
      setImportLoading(false);
      setImportLoadingLabel(null);
    }
  };

  const handlePdfUpload = async (file: File) => {
    setPdfLoading(true);
    setPdfError(null);
    setImportLoading(true);
    setImportLoadingLabel("PDF уншиж байна...");
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
      let localQuestions: Question[] = [];
      try {
        localQuestions = await parsePdfQuestions({
          file,
          questionLimit,
          pdfUseOcr,
          answerKeyPage,
        });
      } catch {
        localQuestions = [];
      }

      let questions = localQuestions;
      let usedBackend = false;
      let backendUnavailable = false;

      if (currentUser) {
        try {
          const uploaded = (await uploadPdf(file, currentUser)) as UploadedPdfPayload;
          const extracted = (await extractPdfQuestions(
            uploaded.fileKey,
            currentUser,
          )) as ExtractedPdfPayload;
          const extractedQuestionList = Array.isArray(extracted?.questions)
            ? extracted.questions
            : [];
          const backendQuestions = extractedQuestionList.length > 0
            ? mapBackendPdfQuestions(
                extractedQuestionList,
                localQuestions,
              )
            : [];

          if (backendQuestions.length > 0) {
            questions = shouldPreferLocalQuestions(
              extractedQuestionList,
              localQuestions,
            )
              ? localQuestions.slice(0, questionLimit)
              : backendQuestions.slice(0, questionLimit);
            usedBackend = true;
          }
        } catch (backendError) {
          backendUnavailable = isApiUnavailableError(backendError);
        }
      }

      if (questions.length === 0) {
        setPdfError(
          backendUnavailable
            ? "Backend холбогдохгүй байна. Local parser-оор ч асуулт олдсонгүй."
            : "PDF‑ээс асуулт олдсонгүй. Форматыг шалгана уу.",
        );
      } else {
        questions = await uploadQuestionImages(questions, currentUser);
        setQuestions(questions);
        if (!examTitle) {
          setExamTitle(file.name.replace(/\.pdf$/i, ""));
        }
        if (backendUnavailable && !usedBackend) {
          showToast("Backend холбогдохгүй тул local PDF parser ашиглалаа.");
        }
        showToast(
          usedBackend
            ? `${questions.length} асуулт backend + PDF parser-оос бөглөгдлөө. Зөв хариултыг шалгана уу.`
            : `${questions.length} асуулт автоматаар бөглөгдлөө. Зөв хариултыг гараар сонгоно уу.`,
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Тодорхойгүй алдаа";
      setPdfError(`PDF боловсруулах үед алдаа гарлаа. (${message})`);
    } finally {
      setPdfLoading(false);
      setImportLoading(false);
      setImportLoadingLabel(null);
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
    importLoading,
    importLoadingLabel,
    handleCsvUpload,
    handleImageUpload,
    handleDocxUpload,
    handlePdfUpload,
  };
};
