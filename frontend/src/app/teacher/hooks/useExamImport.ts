import { useState } from "react";
import { extractPdfQuestions, uploadPdf, uploadPdfAssets } from "@/api/pdf";
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
  const [importLoading, setImportLoading] = useState(false);
  const [importLoadingLabel, setImportLoadingLabel] = useState<string | null>(null);

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

  type UploadedAssetPayload = {
    assets?: Array<{
      index: number;
      sourceIndex: number;
      assetId: string;
      url: string;
    }>;
  };

  const isApiUnavailableError = (error: unknown) =>
    error instanceof Error &&
    (error.message.includes("Failed to fetch") ||
      error.message.includes("API unreachable"));

  const normalizeComparableText = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9а-яөүё]+/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

  const tokenSimilarity = (left: string, right: string) => {
    const leftTokens = new Set(
      normalizeComparableText(left)
        .split(" ")
        .filter((token) => token.length > 1),
    );
    const rightTokens = new Set(
      normalizeComparableText(right)
        .split(" ")
        .filter((token) => token.length > 1),
    );

    if (leftTokens.size === 0 || rightTokens.size === 0) return 0;

    let overlap = 0;
    for (const token of leftTokens) {
      if (rightTokens.has(token)) overlap += 1;
    }

    return overlap / Math.max(leftTokens.size, rightTokens.size, 1);
  };

  const shouldPreferLocalText = (
    backendText: string,
    fallback?: Question,
  ) => {
    if (!fallback?.text) return false;
    if (isQuestionTextSuspicious(backendText.trim())) return true;
    return tokenSimilarity(backendText, fallback.text) < 0.35;
  };

  const shouldPreferLocalQuestions = (
    backendQuestions: BackendPdfQuestion[],
    localQuestions: Question[],
  ) => {
    if (localQuestions.length === 0) return false;
    if (backendQuestions.length === 0) return true;

    const countGap = Math.abs(backendQuestions.length - localQuestions.length);
    const localHasImages = localQuestions.some((question) => Boolean(question.imageUrl));
    return localHasImages && countGap > Math.max(2, Math.floor(localQuestions.length * 0.3));
  };

  const uploadQuestionImages = async (questions: Question[]) => {
    if (!currentUser) return questions;

    const assetsToUpload = questions
      .map((question, index) => ({
        index,
        dataUrl: question.imageUrl,
      }))
      .filter(
        (
          asset,
        ): asset is {
          index: number;
          dataUrl: string;
        } => Boolean(asset.dataUrl?.startsWith("data:image/")),
      );

    if (assetsToUpload.length === 0) return questions;

    try {
      const uploaded = (await uploadPdfAssets(
        assetsToUpload.map((asset) => ({
          dataUrl: asset.dataUrl,
          fileName: `pdf-question-${asset.index + 1}.jpg`,
          sourceIndex: asset.index,
        })),
        currentUser,
      )) as UploadedAssetPayload;

      const uploadedMap = new Map(
        (uploaded.assets ?? []).map((asset) => [asset.sourceIndex, asset.url]),
      );

      return questions.map((question, index) => ({
        ...question,
        imageUrl: uploadedMap.get(index) ?? question.imageUrl,
      }));
    } catch {
      return questions;
    }
  };

  const mapBackendPdfQuestions = (
    extractedQuestions: BackendPdfQuestion[],
    localQuestions: Question[],
  ): Question[] =>
    Array.from({
      length: Math.max(extractedQuestions.length, localQuestions.length),
    })
      .map((_, index) => {
        const question = extractedQuestions[index];
        const fallback = localQuestions[index];
        if (!question) return fallback ?? null;

        const options = (question.options ?? [])
          .map((option) => option.text.trim())
          .filter(Boolean);
        const fallbackOptions = (fallback?.options ?? [])
          .map((option) => option.trim())
          .filter(Boolean);
        const finalOptions =
          options.length >= 2 &&
          (
            fallbackOptions.length === 0 ||
            tokenSimilarity(options.join(" "), fallbackOptions.join(" ")) >= 0.25
          )
            ? options
            : fallbackOptions.length >= 2
              ? fallbackOptions
              : undefined;
        const correctOption =
          question.options?.find((option) => option.isCorrect)?.text?.trim() ?? "";
        const fallbackCorrect = fallback?.correctAnswer?.trim() ?? "";

        const resolvedText =
          shouldPreferLocalText(question.questionText?.trim() ?? "", fallback)
            ? fallback?.text
            : question.questionText?.trim();

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
            (correctOption &&
            (!finalOptions || finalOptions.some((option) => option === correctOption))
              ? correctOption
              : "") ||
            question.correctAnswerText?.trim() ||
            fallbackCorrect ||
            "",
          points: fallback?.points ?? 1,
          imageUrl: fallback?.imageUrl,
        };
      })
      .filter((question): question is Question => Boolean(question));

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
        questions = await uploadQuestionImages(questions);
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
