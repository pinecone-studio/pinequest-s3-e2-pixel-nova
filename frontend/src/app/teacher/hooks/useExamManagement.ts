import { useEffect, useRef, useState } from "react";
import type { Exam, Question } from "../types";
import { apiFetch, unwrapApi } from "@/lib/api-client";
import { generateId } from "@/lib/examGuard";
import { fetchTeacherExams } from "./teacher-api";

export const useExamManagement = (params: {
  exams: Exam[];
  setExams: (next: Exam[]) => void;
  showToast: (message: string) => void;
}) => {
  const { exams, setExams, showToast } = params;
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [createDate, setCreateDate] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<"text" | "open" | "mcq">(
    "text",
  );
  const [questionAnswer, setQuestionAnswer] = useState("");
  const [questionPoints, setQuestionPoints] = useState(1);
  const [questionCorrectIndex, setQuestionCorrectIndex] = useState(0);
  const [mcqOptions, setMcqOptions] = useState<string[]>(["", "", "", ""]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const sidebarTimerRef = useRef<number | null>(null);

  const reloadExams = async () => {
    const remote = await fetchTeacherExams();
    setExams(remote);
  };

  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      exams.forEach((exam) => {
        if (!exam.scheduledAt || exam.notified) return;
        const scheduled = new Date(exam.scheduledAt);
        const isTomorrow =
          scheduled.getFullYear() === tomorrow.getFullYear() &&
          scheduled.getMonth() === tomorrow.getMonth() &&
          scheduled.getDate() === tomorrow.getDate();
        if (isTomorrow) {
          showToast(`📢 Маргааш "${exam.title}" шалгалт эхэлнэ!`);
        }
      });
    };
    checkNotifications();
    const interval = setInterval(checkNotifications, 60000);
    return () => clearInterval(interval);
  }, [exams, showToast]);

  const handleSchedule = async () => {
    if (!scheduleTitle || !scheduleDate) {
      showToast("Шалгалтын нэр болон огноо оруулна уу.");
      return;
    }
    if (questions.length === 0) {
      showToast("Товлохын өмнө шалгалтын асуулт үүсгэнэ үү.");
      return;
    }
    try {
      const created = await apiFetch<{ data?: { id: string } } | { id: string }>(
        "/api/exams",
        {
          method: "POST",
          body: JSON.stringify({
            title: scheduleTitle,
            durationMin: durationMinutes,
          }),
        },
      );
      const examId = unwrapApi(created).id;
      for (const question of questions) {
        const options = question.options?.map((text, idx) => ({
          label: String.fromCharCode(65 + idx),
          text,
          isCorrect: text === question.correctAnswer,
        }));
        await apiFetch(`/api/exams/${examId}/questions`, {
          method: "POST",
          body: JSON.stringify({
            type: question.type,
            questionText: question.text,
            correctAnswerText: question.correctAnswer,
            points: question.points,
            imageUrl: question.imageUrl,
            options,
          }),
        });
      }
      const scheduled = await apiFetch<{ data?: { roomCode: string } } | { roomCode: string }>(
        `/api/exams/${examId}/schedule`,
        {
          method: "POST",
          body: JSON.stringify({ scheduledAt: scheduleDate }),
        },
      );
      setRoomCode(unwrapApi(scheduled).roomCode ?? null);
      await reloadExams();
      setScheduleTitle("");
      setScheduleDate("");
      setQuestions([]);
      showToast("Шалгалт товлогдлоо.");
    } catch {
      showToast("Шалгалт товлоход алдаа гарлаа.");
    }
  };

  const addQuestion = () => {
    if (!questionText) {
      showToast("Асуултын текст оруулна уу.");
      return;
    }
    if (questionType !== "mcq" && !questionAnswer) {
      showToast("Зөв хариулт оруулна уу.");
      return;
    }
    if (!Number.isFinite(questionPoints) || questionPoints <= 0) {
      showToast("Оноо 1-с их байх ёстой.");
      return;
    }
    const options =
      questionType === "mcq"
        ? mcqOptions.map((opt) => opt.trim()).filter(Boolean)
        : undefined;
    if (questionType === "mcq" && (!options || options.length < 4)) {
      showToast("A, B, C, D сонголтыг бүрэн бөглөнө үү.");
      return;
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
        points: Math.max(1, Math.floor(questionPoints)),
      },
    ]);
    setQuestionText("");
    setQuestionAnswer("");
    setQuestionPoints(1);
    setQuestionCorrectIndex(0);
    if (questionType === "mcq") setMcqOptions(["", "", "", ""]);
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuestion = (id: string, patch: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return { ...item, ...patch };
      }),
    );
  };

  const updateQuestionOption = (
    id: string,
    optionIndex: number,
    value: string,
  ) => {
    setQuestions((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextOptions = [...(item.options ?? [])];
        nextOptions[optionIndex] = value;
        return { ...item, options: nextOptions };
      }),
    );
  };

  const addQuestionOption = (id: string) => {
    setQuestions((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextOptions = [...(item.options ?? []), ""];
        return { ...item, type: "mcq", options: nextOptions };
      }),
    );
  };

  const removeQuestionOption = (id: string, optionIndex: number) => {
    setQuestions((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextOptions = (item.options ?? []).filter((_, idx) => idx !== optionIndex);
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
  };

  const saveExam = async () => {
    if (!examTitle || questions.length === 0) {
      showToast("Шалгалтын нэр болон асуултууд оруулна уу.");
      return;
    }
    const missingCorrect = questions.filter(
      (question) =>
        question.type === "mcq" && (!question.correctAnswer || !question.correctAnswer.trim()),
    ).length;
    if (missingCorrect > 0) {
      showToast("Зөв хариулт сонгоогүй асуулт байна.");
      return;
    }
    try {
      const created = await apiFetch<{ data?: { id: string } } | { id: string }>(
        "/api/exams",
        {
          method: "POST",
          body: JSON.stringify({
            title: examTitle,
            durationMin: durationMinutes,
          }),
        },
      );
      const examId = unwrapApi(created).id;
      for (const question of questions) {
        const options = question.options?.map((text, idx) => ({
          label: String.fromCharCode(65 + idx),
          text,
          isCorrect: text === question.correctAnswer,
        }));
        await apiFetch(`/api/exams/${examId}/questions`, {
          method: "POST",
          body: JSON.stringify({
            type: question.type,
            questionText: question.text,
            correctAnswerText: question.correctAnswer,
            points: question.points,
            imageUrl: question.imageUrl,
            options,
          }),
        });
      }
      if (createDate) {
        const scheduled = await apiFetch<
          { data?: { roomCode: string } } | { roomCode: string }
        >(`/api/exams/${examId}/schedule`, {
          method: "POST",
          body: JSON.stringify({ scheduledAt: createDate }),
        });
        setRoomCode(unwrapApi(scheduled).roomCode ?? null);
      } else {
        setRoomCode(null);
      }
      await reloadExams();
      setExamTitle("");
      setCreateDate("");
      setQuestions([]);
      setDurationMinutes(45);
      setQuestionPoints(1);
      showToast("Шалгалт амжилттай хадгалагдлаа.");
    } catch {
      showToast("Шалгалт хадгалахад алдаа гарлаа.");
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast("Өрөөний код хууллаа.");
    } catch {
      showToast("Өрөөний код хуулж чадсангүй.");
    }
  };

  return {
    scheduleTitle,
    setScheduleTitle,
    scheduleDate,
    setScheduleDate,
    examTitle,
    setExamTitle,
    createDate,
    setCreateDate,
    questionText,
    setQuestionText,
    questionType,
    setQuestionType,
    questionAnswer,
    setQuestionAnswer,
    questionPoints,
    setQuestionPoints,
    questionCorrectIndex,
    setQuestionCorrectIndex,
    mcqOptions,
    setMcqOptions,
    questions,
    setQuestions,
    roomCode,
    setRoomCode,
    durationMinutes,
    setDurationMinutes,
    sidebarTimerRef,
    handleSchedule,
    addQuestion,
    removeQuestion,
    updateQuestion,
    updateQuestionOption,
    addQuestionOption,
    removeQuestionOption,
    saveExam,
    copyCode,
  };
};
