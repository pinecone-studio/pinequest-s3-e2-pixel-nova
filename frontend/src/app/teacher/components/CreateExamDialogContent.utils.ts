import type { PendingQuestionDraft } from "../create-exam-dialog-state";
import type { ManualQuestionDraft } from "./CreateExamDialogContent.types";

export const createEmptyManualQuestionDraft = (): ManualQuestionDraft => ({
  text: "",
  type: "open",
  answer: "",
  points: 1,
  mcqOptions: ["", "", "", ""],
  correctIndex: 0,
});

export const trim = (value: string) => value.trim();

export const buildPendingQuestion = (
  draft: ManualQuestionDraft,
): PendingQuestionDraft => {
  const text = trim(draft.text);
  const points = Math.max(
    1,
    Math.floor(Number.isFinite(draft.points) ? draft.points : 1),
  );

  if (draft.type === "mcq") {
    const options = draft.mcqOptions.map(trim);
    return {
      text,
      type: "mcq",
      options,
      correctAnswer: options[draft.correctIndex] ?? options[0] ?? "",
      points,
    };
  }

  return {
    text,
    type: "open",
    correctAnswer: trim(draft.answer),
    points,
  };
};

export const validateManualQuestionDraft = (draft: ManualQuestionDraft) => {
  if (!trim(draft.text)) {
    return "Асуултын текст оруулна уу.";
  }

  if (!Number.isFinite(draft.points) || draft.points <= 0) {
    return "Оноо 1-ээс их байх ёстой.";
  }

  if (draft.type === "mcq") {
    const options = draft.mcqOptions.map(trim);
    if (options.some((option) => !option)) {
      return "A, B, C, D сонголтыг бүрэн бөглөнө үү.";
    }
    if (draft.correctIndex < 0 || draft.correctIndex > options.length - 1) {
      return "Зөв хариулт сонгоно уу.";
    }
    return null;
  }

  if (!trim(draft.answer)) {
    return "Зөв хариулт оруулна уу.";
  }

  return null;
};
