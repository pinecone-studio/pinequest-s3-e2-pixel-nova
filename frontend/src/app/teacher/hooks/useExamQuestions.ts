import { useCallback, useState } from "react";
import { generateId } from "@/lib/examGuard";
import type { Question } from "../types";

type UseExamQuestionsParams = {
  showToast: (message: string) => void;
};

export const useExamQuestions = ({ showToast }: UseExamQuestionsParams) => {
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<"open" | "mcq">("open");
  const [questionAnswer, setQuestionAnswer] = useState("");
  const [questionImageUrl, setQuestionImageUrl] = useState<string | undefined>(
    undefined,
  );
  const [questionPoints, setQuestionPoints] = useState(1);
  const [questionCorrectIndex, setQuestionCorrectIndex] = useState(0);
  const [mcqOptions, setMcqOptions] = useState<string[]>(["", "", "", ""]);
  const [questions, setQuestions] = useState<Question[]>([]);

  const addQuestion = useCallback(() => {
    if (!questionText) {
      showToast("Асуултын текст оруулна уу.");
      return false;
    }
    if (questionType !== "mcq" && !questionAnswer) {
      showToast("Зөв хариулт оруулна уу.");
      return false;
    }
    if (!Number.isFinite(questionPoints) || questionPoints <= 0) {
      showToast("Оноо 1-с их байх ёстой.");
      return false;
    }

    const options =
      questionType === "mcq"
        ? mcqOptions.map((opt) => opt.trim()).filter(Boolean)
        : undefined;

    if (questionType === "mcq" && (!options || options.length < 4)) {
      showToast("A, B, C, D сонголтыг бүрэн бөглөнө үү.");
      return false;
    }

    const correctAnswer =
      questionType === "mcq"
        ? options?.[questionCorrectIndex] ?? options?.[0] ?? ""
        : questionAnswer;

    setQuestions((prev) => [
      ...prev,
      {
        id: generateId(),
        text: questionText,
        type: questionType,
        options,
        correctAnswer,
        imageUrl: questionImageUrl,
        points: Math.max(1, Math.floor(questionPoints)),
      },
    ]);
    setQuestionText("");
    setQuestionAnswer("");
    setQuestionImageUrl(undefined);
    setQuestionPoints(1);
    setQuestionCorrectIndex(0);
    if (questionType === "mcq") setMcqOptions(["", "", "", ""]);
    return true;
  }, [
    mcqOptions,
    questionAnswer,
    questionCorrectIndex,
    questionImageUrl,
    questionPoints,
    questionText,
    questionType,
    showToast,
  ]);

  const removeQuestion = useCallback((id: string) => {
    setQuestions((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuestion = useCallback((id: string, patch: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }, []);

  const updateQuestionOption = useCallback(
    (id: string, optionIndex: number, value: string) => {
      setQuestions((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const nextOptions = [...(item.options ?? [])];
          nextOptions[optionIndex] = value;
          return { ...item, options: nextOptions };
        }),
      );
    },
    [],
  );

  const addQuestionOption = useCallback((id: string) => {
    setQuestions((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextOptions = [...(item.options ?? []), ""];
        return { ...item, type: "mcq", options: nextOptions };
      }),
    );
  }, []);

  const removeQuestionOption = useCallback(
    (id: string, optionIndex: number) => {
      setQuestions((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const nextOptions = (item.options ?? []).filter(
            (_, idx) => idx !== optionIndex,
          );
          const nextCorrect =
            item.correctAnswer &&
            (item.options ?? [])[optionIndex] === item.correctAnswer
              ? nextOptions[0] ?? ""
              : item.correctAnswer;
          return {
            ...item,
            options: nextOptions,
            correctAnswer: nextCorrect,
            type: nextOptions.length > 1 ? "mcq" : "open",
          };
        }),
      );
    },
    [],
  );

  return {
    questionText,
    setQuestionText,
    questionType,
    setQuestionType,
    questionAnswer,
    setQuestionAnswer,
    questionImageUrl,
    setQuestionImageUrl,
    questionPoints,
    setQuestionPoints,
    questionCorrectIndex,
    setQuestionCorrectIndex,
    mcqOptions,
    setMcqOptions,
    questions,
    setQuestions,
    addQuestion,
    removeQuestion,
    updateQuestion,
    updateQuestionOption,
    addQuestionOption,
    removeQuestionOption,
  };
};
