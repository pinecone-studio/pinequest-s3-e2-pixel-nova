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

  const generateDraft = async () => {
    if (!input.topic.trim()) {
      setError("Сэдэв эсвэл гарчиг оруулна уу.");
      return null;
    }
    setGenerating(true);
    setError(null);
    try {
      const nextDraft = await generateAiExamDraft(
        {
          ...input,
          topic: input.topic.trim(),
          subject: input.subject?.trim() || undefined,
          gradeOrClass: input.gradeOrClass?.trim() || undefined,
          instructions: input.instructions?.trim() || undefined,
        },
        teacherId ?? undefined,
      );
      setDraft(nextDraft);
      showToast("AI шалгалтын ноорог үүсгэлээ.");
      return nextDraft;
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "AI ноорог үүсгэж чадсангүй.";
      setError(message);
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const acceptDraft = async (): Promise<AiAcceptedDraftResponse | null> => {
    if (!draft) return null;
    setSavingAccepted(true);
    setError(null);
    try {
      const result = await saveAcceptedAiDraft(input, draft, teacherId ?? undefined);
      showToast("AI ноорог хадгалагдаж, редакторт ачааллаа.");
      return result;
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "AI ноорог хадгалж чадсангүй.";
      setError(message);
      return null;
    } finally {
      setSavingAccepted(false);
    }
  };

  return {
    input,
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
