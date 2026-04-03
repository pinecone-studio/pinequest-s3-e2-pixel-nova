import { useState } from "react";
import type {
  AiAcceptedDraftResponse,
  AiExamGeneratorInput,
  AiGeneratedDraft,
} from "../types";
import { generateAiExamDraft, saveAcceptedAiDraft } from "./teacher-api";

const INITIAL_INPUT: AiExamGeneratorInput = {
  topic: "",
  subject: "",
  gradeOrClass: "",
  difficulty: "medium",
  questionCount: 10,
  instructions: "",
};

const MIN_TOPIC_LENGTH = 3;
const MAX_QUESTION_COUNT = 30;
const MIN_QUESTION_COUNT = 1;
const MAX_INSTRUCTIONS_LENGTH = 1200;
const FALLBACK_OPTION_BANK = ["A", "B", "C", "D"];

const parseGeneratorErrorMessage = (error: unknown) => {
  if (!(error instanceof Error) || !error.message) {
    return "AI ноорог үүсгэж чадсангүй.";
  }

  try {
    const parsed = JSON.parse(error.message) as {
      message?: string;
      error?: string | { message?: string };
    };
    const nestedMessage =
      typeof parsed.error === "string" ? parsed.error : parsed.error?.message;
    return parsed.message || nestedMessage || error.message;
  } catch {
    return error.message;
  }
};

const normalizeInput = (
  value: AiExamGeneratorInput,
): AiExamGeneratorInput => ({
  ...value,
  topic: value.topic.trim(),
  subject: value.subject?.trim() ?? "",
  gradeOrClass: value.gradeOrClass?.trim() ?? "",
  questionCount: Math.min(
    MAX_QUESTION_COUNT,
    Math.max(MIN_QUESTION_COUNT, Number(value.questionCount) || MIN_QUESTION_COUNT),
  ),
  instructions: value.instructions?.trim() ?? "",
});

const getValidationError = (value: AiExamGeneratorInput) => {
  if (!value.topic) {
    return "Сэдэв эсвэл гарчиг оруулна уу.";
  }

  if (value.topic.length < MIN_TOPIC_LENGTH) {
    return `Гарчиг хамгийн багадаа ${MIN_TOPIC_LENGTH} тэмдэгт байх ёстой.`;
  }

  if (value.questionCount < MIN_QUESTION_COUNT || value.questionCount > MAX_QUESTION_COUNT) {
    return `Асуултын тоо ${MIN_QUESTION_COUNT}-${MAX_QUESTION_COUNT} хооронд байх ёстой.`;
  }

  if ((value.instructions?.length ?? 0) > MAX_INSTRUCTIONS_LENGTH) {
    return `Нэмэлт заавар ${MAX_INSTRUCTIONS_LENGTH} тэмдэгтээс ихгүй байх ёстой.`;
  }

  return null;
};

const capitalize = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const buildFallbackTitle = (input: AiExamGeneratorInput) => {
  const subject = input.subject?.trim();
  if (subject) {
    return `${subject} - ${capitalize(input.topic)}`;
  }
  return `${capitalize(input.topic)} шалгалт`;
};

const buildFallbackQuestion = (
  input: AiExamGeneratorInput,
  index: number,
): AiGeneratedDraft["questions"][number] => {
  const number = index + 1;
  const promptBase = input.topic || "Сэдэв";
  const difficultyLabel =
    input.difficulty === "hard"
      ? "ахисан"
      : input.difficulty === "easy"
        ? "суурь"
        : "дунд";

  if (index % 3 === 2) {
    return {
      id: `fallback-text-${number}`,
      text: `${promptBase} сэдвийн ${difficultyLabel} түвшний ${number}-р асуултад богино хариулт бичнэ үү.`,
      type: "text",
      correctAnswer: `${promptBase} сэдвийн гол ойлголтыг зөв тайлбарласан хариулт`,
      points: 1,
    };
  }

  const correctIndex = index % FALLBACK_OPTION_BANK.length;
  const options = FALLBACK_OPTION_BANK.map(
    (label, optionIndex) => `${promptBase} - хувилбар ${label}${optionIndex === correctIndex ? " (зөв)" : ""}`,
  );

  return {
    id: `fallback-mcq-${number}`,
    text: `${promptBase} сэдвийн ${difficultyLabel} түвшний ${number}-р асуулт`,
    type: "mcq",
    options,
    correctAnswer: options[correctIndex],
    points: 1,
  };
};

const buildFallbackDraft = (input: AiExamGeneratorInput): AiGeneratedDraft => ({
  title: buildFallbackTitle(input),
  description:
    input.instructions?.trim() || `${input.topic} сэдвээр автоматаар үүсгэсэн нөөц шалгалтын ноорог.`,
  questions: Array.from({ length: input.questionCount }, (_, index) =>
    buildFallbackQuestion(input, index),
  ),
});

export const useAiExamGenerator = (params: {
  teacherId?: string | null;
  showToast: (message: string) => void;
}) => {
  const { teacherId, showToast } = params;
  const [input, setInput] = useState<AiExamGeneratorInput>(INITIAL_INPUT);
  const [draft, setDraft] = useState<AiGeneratedDraft | null>(null);
  const [generating, setGenerating] = useState(false);
  const [savingAccepted, setSavingAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateInput = <K extends keyof AiExamGeneratorInput>(
    key: K,
    value: AiExamGeneratorInput[K],
  ) => {
    setInput((current) => ({ ...current, [key]: value }));
  };

  const generateDraft = async (override?: Partial<AiExamGeneratorInput>) => {
    if (generating) {
      return null;
    }

    const effectiveInput = normalizeInput({
      ...input,
      ...override,
    });
    const validationError = getValidationError(effectiveInput);

    if (validationError) {
      setError(validationError);
      setInput(effectiveInput);
      return null;
    }

    setGenerating(true);
    setError(null);
    setInput(effectiveInput);

    try {
      const nextDraft = await generateAiExamDraft(
        {
          ...effectiveInput,
          subject: effectiveInput.subject || undefined,
          gradeOrClass: effectiveInput.gradeOrClass || undefined,
          instructions: effectiveInput.instructions || undefined,
        },
        teacherId ?? undefined,
      );
      setDraft(nextDraft);
      showToast("AI шалгалтын ноорог үүсгэлээ.");
      return nextDraft;
    } catch (err) {
      const fallbackDraft = buildFallbackDraft(effectiveInput);
      setDraft(fallbackDraft);
      setError(null);
      showToast("AI түр боломжгүй тул нөөц ноорог үүсгэлээ.");
      return fallbackDraft;
    } finally {
      setGenerating(false);
    }
  };

  const acceptDraft = async (): Promise<AiAcceptedDraftResponse | null> => {
    if (!draft || savingAccepted) return null;
    setSavingAccepted(true);
    setError(null);
    try {
      const result = await saveAcceptedAiDraft(
        normalizeInput(input),
        draft,
        teacherId ?? undefined,
      );
      showToast("AI ноорог хадгалагдаж, редакторт ачааллаа.");
      return result;
    } catch (err) {
      const message =
        parseGeneratorErrorMessage(err) || "AI ноорог хадгалж чадсангүй.";
      setError(message);
      return null;
    } finally {
      setSavingAccepted(false);
    }
  };

  return {
    input,
    setInput,
    updateInput,
    draft,
    setDraft,
    generating,
    savingAccepted,
    error,
    generateDraft,
    acceptDraft,
  };
};
