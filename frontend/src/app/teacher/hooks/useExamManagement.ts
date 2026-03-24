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
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<"text" | "open" | "mcq">(
    "text",
  );
  const [questionAnswer, setQuestionAnswer] = useState("");
  const [mcqOptions, setMcqOptions] = useState<string[]>(["", "", "", ""]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const sidebarTimerRef = useRef<number | null>(null);

  const persistExams = (next: Exam[]) => {
    setExams(next);
    setJSON("exams", next);
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
    if (!questionText || !questionAnswer) {
      showToast("Асуулт болон зөв хариулт оруулна уу.");
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
    setQuestions((prev) => [
      ...prev,
      {
        id: generateId(),
        text: questionText,
        type: questionType,
        options,
        correctAnswer: questionAnswer,
      },
    ]);
    setQuestionText("");
    setQuestionAnswer("");
    if (questionType === "mcq") setMcqOptions(["", "", "", ""]);
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((item) => item.id !== id));
  };

  const saveExam = () => {
    if (!examTitle || questions.length === 0) {
      showToast("Шалгалтын нэр болон асуултууд оруулна уу.");
      return;
    }
    const newExam: Exam = {
      id: generateId(),
      title: examTitle,
      scheduledAt: null,
      roomCode: generateRoomCode(),
      questions,
      duration: durationMinutes,
      createdAt: new Date().toISOString(),
    };
    persistExams([...exams, newExam]);
    setExamTitle("");
    setQuestions([]);
    setDurationMinutes(45);
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
    questionText,
    setQuestionText,
    questionType,
    setQuestionType,
    questionAnswer,
    setQuestionAnswer,
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
    saveExam,
    copyCode,
  };
};
