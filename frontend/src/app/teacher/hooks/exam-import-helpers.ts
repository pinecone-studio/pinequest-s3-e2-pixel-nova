import { uploadPdfAssets } from "@/api/pdf";
import type { User } from "@/lib/examGuard";
import type { Question } from "../types";
import { isQuestionTextSuspicious } from "../utils";

export type BackendPdfQuestion = {
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

export type UploadedPdfPayload = {
  fileKey: string;
  fileName: string;
  pageCount: number;
};

export type ExtractedPdfPayload = {
  questions?: BackendPdfQuestion[];
};

export type UploadedAssetPayload = {
  assets?: Array<{
    index: number;
    sourceIndex: number;
    assetId: string;
    url: string;
  }>;
};

export const isApiUnavailableError = (error: unknown) =>
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

const shouldPreferLocalText = (backendText: string, fallback?: Question) => {
  if (!fallback?.text) return false;
  if (isQuestionTextSuspicious(backendText.trim())) return true;
  return tokenSimilarity(backendText, fallback.text) < 0.35;
};

export const shouldPreferLocalQuestions = (
  backendQuestions: BackendPdfQuestion[],
  localQuestions: Question[],
) => {
  if (localQuestions.length === 0) return false;
  if (backendQuestions.length === 0) return true;

  const countGap = Math.abs(backendQuestions.length - localQuestions.length);
  const localHasImages = localQuestions.some((question) => Boolean(question.imageUrl));
  return localHasImages && countGap > Math.max(2, Math.floor(localQuestions.length * 0.3));
};

export const uploadQuestionImages = async (
  questions: Question[],
  currentUser?: User | null,
) => {
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

export const mapBackendPdfQuestions = (
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

      const resolvedText = shouldPreferLocalText(
        question.questionText?.trim() ?? "",
        fallback,
      )
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
