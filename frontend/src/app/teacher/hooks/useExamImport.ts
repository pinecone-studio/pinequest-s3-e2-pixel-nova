import { useState } from "react";
import { extractPdfQuestions, uploadPdf } from "@/api/pdf";
import type { User } from "@/lib/examGuard";
import type { Question } from "../types";
import { isQuestionTextSuspicious } from "../utils";
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
  currentUser?: User | null;
}) => {
  const { setQuestions, examTitle, setExamTitle, showToast, currentUser } = params;
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfUseOcr, setPdfUseOcr] = useState(true);
  const [answerKeyPage, setAnswerKeyPage] = useState<number | "last">("last");
  const [importError, setImportError] = useState<string | null>(null);

  type BackendPdfQuestion = {
    type: "multiple_choice" | "true_false" | "short_answer";
    questionText: string;
    options?: Array<{
      label: string;
      text: string;
      isCorrect: boolean;
    }>;
    correctAnswerText?: string | null;
    needsReview?: boolean;
  };

  type UploadedPdfPayload = {
    fileKey: string;
    fileName: string;
    pageCount: number;
  };

  type ExtractedPdfPayload = {
    questions?: BackendPdfQuestion[];
  };

  const isApiUnavailableError = (error: unknown) =>
    error instanceof Error &&
    (error.message.includes("Failed to fetch") ||
      error.message.includes("API unreachable"));

  const mapBackendPdfQuestions = (
    extractedQuestions: BackendPdfQuestion[],
    localQuestions: Question[],
  ): Question[] =>
    extractedQuestions.map((question, index) => {
      const fallback = localQuestions[index];
      const options = (question.options ?? [])
        .map((option) => option.text.trim())
        .filter(Boolean);
      const fallbackOptions = (fallback?.options ?? [])
        .map((option) => option.trim())
        .filter(Boolean);
      const finalOptions =
        options.length >= 2 ? options : fallbackOptions.length >= 2 ? fallbackOptions : undefined;
      const correctOption =
        question.options?.find((option) => option.isCorrect)?.text?.trim() ?? "";
      const fallbackCorrect = fallback?.correctAnswer?.trim() ?? "";

      const resolvedText =
        !isQuestionTextSuspicious(question.questionText?.trim() ?? "")
          ? question.questionText?.trim()
          : fallback?.text;

      return {
        id: fallback?.id ?? crypto.randomUUID(),
        text: resolvedText || `Асуулт ${index + 1}`,
        type:
          question.type === "short_answer"
            ? "open"
            : finalOptions && finalOptions.length >= 2
              ? "mcq"
              : "open",
        options:
          question.type === "short_answer"
            ? undefined
            : finalOptions?.slice(0, question.type === "true_false" ? 2 : 6),
        correctAnswer:
          correctOption ||
          question.correctAnswerText?.trim() ||
          fallbackCorrect ||
          "",
        points: fallback?.points ?? 1,
        imageUrl: fallback?.imageUrl,
      };
    });

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
          const backendQuestions = Array.isArray(extracted?.questions)
            ? mapBackendPdfQuestions(
                extracted.questions as BackendPdfQuestion[],
                localQuestions,
              )
            : [];

          if (backendQuestions.length > 0) {
            questions = backendQuestions.slice(0, questionLimit);
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
