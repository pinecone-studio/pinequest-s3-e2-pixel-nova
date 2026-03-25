import { useEffect, useRef, useState } from "react";
import { generateId, generateRoomCode, setJSON, getJSON } from "@/lib/examGuard";
import type { Exam, Question } from "../types";

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

  const persistExams = (next: Exam[]) => {
    setExams(next);
    const ok = setJSON("exams", next);
    if (!ok) {
      const stripped = next.map((exam) => ({
        ...exam,
        questions: exam.questions.map((question) => ({
          ...question,
          imageUrl: undefined,
        })),
      }));
      const fallbackOk = setJSON("exams", stripped);
      showToast(
        fallbackOk
          ? "Орон зай дүүрсэн тул зураг хадгалагдсангүй. Асуултууд хадгалагдлаа."
          : "Хадгалах орон зай дүүрсэн байна. Зургийн хэмжээ/тоо их байж магадгүй.",
      );
    }
  };

  useEffect(() => {
    const checkNotifications = () => {
      const stored = getJSON<Exam[]>("exams", []);
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      let changed = false;
      stored.forEach((exam) => {
        if (!exam.scheduledAt || exam.notified) return;
        const scheduled = new Date(exam.scheduledAt);
        const isTomorrow =
          scheduled.getFullYear() === tomorrow.getFullYear() &&
          scheduled.getMonth() === tomorrow.getMonth() &&
          scheduled.getDate() === tomorrow.getDate();
        if (isTomorrow) {
          exam.notified = true;
          changed = true;
          showToast(`📢 Маргааш "${exam.title}" шалгалт эхэлнэ!`);
        }
      });
      if (changed) persistExams(stored);
    };
    checkNotifications();
    const interval = setInterval(checkNotifications, 60000);
    return () => clearInterval(interval);
  }, [showToast]);

  const handleSchedule = () => {
    if (!scheduleTitle || !scheduleDate) {
      showToast("Шалгалтын нэр болон огноо оруулна уу.");
      return;
    }
    const newExam: Exam = {
      id: generateId(),
      title: scheduleTitle,
      scheduledAt: scheduleDate,
      examStartedAt: null,
      roomCode: generateRoomCode(),
      questions: [],
      duration: durationMinutes,
      createdAt: new Date().toISOString(),
    };
    persistExams([...exams, newExam]);
    setScheduleTitle("");
    setScheduleDate("");
    setRoomCode(newExam.roomCode);
    showToast("Шалгалт товлогдлоо.");
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

  const saveExam = () => {
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
    const newExam: Exam = {
      id: generateId(),
      title: examTitle,
      scheduledAt: createDate || null,
      examStartedAt: null,
      roomCode: generateRoomCode(),
      questions,
      duration: durationMinutes,
      createdAt: new Date().toISOString(),
    };
    persistExams([...exams, newExam]);
    setExamTitle("");
    setCreateDate("");
    setQuestions([]);
    setDurationMinutes(45);
    setQuestionPoints(1);
    setRoomCode(newExam.roomCode);
    showToast("Шалгалт амжилттай хадгалагдлаа.");
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
