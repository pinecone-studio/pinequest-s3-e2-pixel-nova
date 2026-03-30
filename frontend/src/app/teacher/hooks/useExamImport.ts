import { useState } from "react";
import { generateQuestionsFromMaterial, uploadPdf } from "@/api/pdf";
import type { User } from "@/lib/examGuard";
import type { Question } from "../types";
import { parseCsvQuestions } from "./import-csv";
import { parseDocxQuestions } from "./import-docx";
import { parseImageQuestions } from "./import-image";
import { parsePdfQuestions } from "./import-pdf";
import {
  applyImportQuestionPlan,
  getImportQuestionPlanTotal,
} from "./import-question-plan";
import {
  ExtractedPdfPayload,
  UploadedPdfPayload,
  isApiUnavailableError,
  mapBackendPdfQuestions,
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
  const [importMcqCount, setImportMcqCount] = useState(0);
  const [importTextCount, setImportTextCount] = useState(5);
  const [importOpenCount, setImportOpenCount] = useState(0);
  const [shuffleImportedQuestions, setShuffleImportedQuestions] = useState(true);

  const importQuestionPlan = {
    mcqCount: importMcqCount,
    textCount: importTextCount,
    openCount: importOpenCount,
    shuffleQuestions: shuffleImportedQuestions,
  } as const;
  const plannedQuestionCount = getImportQuestionPlanTotal(importQuestionPlan);
  const generationCounts = {
    mcq: importMcqCount,
    text: importTextCount,
    open: importOpenCount,
  } as const;

  const finalizeImportedQuestions = (questions: Question[]) => {
    const shaped = applyImportQuestionPlan(questions, importQuestionPlan);
    if (shaped.questions.length === 0) {
      setImportError("Сонгосон бүтэцтэй асуулт хангалттай олдсонгүй.");
      return null;
    }
    if (shaped.producedTotal < shaped.requestedTotal) {
      showToast(
        `Хүссэн ${shaped.requestedTotal} асуултаас ${shaped.producedTotal}-ыг л бүрдүүллээ.`,
      );
    }
    return shaped.questions;
  };

  const generateBackendQuestions = async (payload: {
    material?: string;
    fileKey?: string;
  }) => {
    if (!currentUser || plannedQuestionCount <= 0) return [];

    const generated = (await generateQuestionsFromMaterial(
      {
        ...payload,
        counts: generationCounts,
      },
      currentUser,
    )) as ExtractedPdfPayload;

    const generatedQuestionList = Array.isArray(generated?.questions)
      ? generated.questions
      : [];

    return generatedQuestionList.length > 0
      ? mapBackendPdfQuestions(generatedQuestionList, [])
      : [];
  };

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
      if (plannedQuestionCount <= 0) {
        setImportError("Импортлох асуултын төрлөө, тоотой нь тохируулна уу.");
        return;
      }
      const { questions, rawText, usedFallback } = await parseImageQuestions(
        file,
        plannedQuestionCount,
      );
      const backendQuestions =
        rawText.trim() && currentUser
          ? await generateBackendQuestions({ material: rawText })
          : [];
      const shapedQuestions = finalizeImportedQuestions(
        backendQuestions.length > 0 ? backendQuestions : questions,
      );
      if (!shapedQuestions) {
        setImportError("Зурагнаас асуулт олдсонгүй. Илүү тод зураг оруулна уу.");
        return;
      }
      setQuestions((prev) => [...prev, ...shapedQuestions]);
      showToast(
        backendQuestions.length > 0
          ? `${shapedQuestions.length} асуулт зургаас автоматаар бэлэн боллоо.`
          : usedFallback
          ? "OCR асуулт олсонгүй. Загвар асуултууд нэмэгдлээ."
          : `${shapedQuestions.length} асуулт зурагнаас үүсгэгдлээ. Зөв хариултыг сонгоно уу.`,
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
      const parsedDocx = await parseDocxQuestions(file);
      const backendQuestions =
        parsedDocx.rawText.trim() && currentUser
          ? await generateBackendQuestions({ material: parsedDocx.rawText })
          : [];
      const shapedQuestions = finalizeImportedQuestions(
        backendQuestions.length > 0 ? backendQuestions : parsedDocx.questions,
      );
      if (!shapedQuestions) {
        setImportError("DOCX‑ээс асуулт олдсонгүй.");
        return;
      }
      setQuestions(shapedQuestions);
      if (!examTitle) setExamTitle(file.name.replace(/\.docx$/i, ""));
      showToast(
        backendQuestions.length > 0
          ? `${shapedQuestions.length} асуулт DOCX-ээс шууд бэлэн боллоо.`
          : `${shapedQuestions.length} асуулт DOCX‑ээс бөглөгдлөө.`,
      );
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
      if (plannedQuestionCount <= 0) {
        setPdfError("Импортлох асуултын төрлөө, тоотой нь тохируулна уу.");
        setPdfLoading(false);
        return;
      }
      let localQuestions: Question[] = [];
      try {
        localQuestions = await parsePdfQuestions({
          file,
          questionLimit: plannedQuestionCount,
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
          const backendQuestions = await generateBackendQuestions({
            fileKey: uploaded.fileKey,
          });

          if (backendQuestions.length > 0) {
            questions = backendQuestions.slice(0, plannedQuestionCount);
            usedBackend = true;
          }
        } catch (backendError) {
          backendUnavailable = isApiUnavailableError(backendError);
        }
      }

      const shapedQuestions = finalizeImportedQuestions(questions);
      if (!shapedQuestions) {
        setPdfError(
          backendUnavailable
            ? "Backend холбогдохгүй байна. Local parser-оор ч асуулт олдсонгүй."
            : "PDF‑ээс асуулт олдсонгүй. Форматыг шалгана уу.",
        );
      } else {
        const uploadedQuestions = await uploadQuestionImages(
          shapedQuestions,
          currentUser,
        );
        setQuestions(uploadedQuestions);
        if (!examTitle) {
          setExamTitle(file.name.replace(/\.pdf$/i, ""));
        }
        if (backendUnavailable && !usedBackend) {
          showToast("Backend холбогдохгүй тул local PDF parser ашиглалаа.");
        }
        showToast(
          usedBackend
            ? `${uploadedQuestions.length} асуулт backend + PDF parser-оос бөглөгдлөө. Зөв хариултыг шалгана уу.`
            : `${uploadedQuestions.length} асуулт автоматаар бөглөгдлөө. Зөв хариултыг гараар сонгоно уу.`,
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
    importMcqCount,
    setImportMcqCount,
    importTextCount,
    setImportTextCount,
    importOpenCount,
    setImportOpenCount,
    shuffleImportedQuestions,
    setShuffleImportedQuestions,
    plannedQuestionCount,
    handleCsvUpload,
    handleImageUpload,
    handleDocxUpload,
    handlePdfUpload,
  };
};
