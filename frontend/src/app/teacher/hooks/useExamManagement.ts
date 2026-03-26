import { useCallback, useEffect, useRef, useState } from "react";
import { generateId, generateRoomCode, type User } from "@/lib/examGuard";
import {
  scheduleExistingExamInBackend,
  syncExamToBackend,
} from "@/lib/backend-exams";
import type { Exam, Question } from "../types";

export const useExamManagement = (params: {
  exams: Exam[];
  setExams: (next: Exam[]) => void;
  showToast: (message: string) => void;
  currentUser?: User | null;
}) => {
  const { exams, setExams, showToast, currentUser } = params;
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleExamType, setScheduleExamType] = useState("progress");
  const [scheduleClassName, setScheduleClassName] = useState("");
  const [scheduleGroupName, setScheduleGroupName] = useState("");
  const [scheduleSubjectName, setScheduleSubjectName] = useState("");
  const [scheduleDescription, setScheduleDescription] = useState("");
  const [selectedScheduleExamId, setSelectedScheduleExamId] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [createDate, setCreateDate] = useState("");
  const [expectedStudentsCount, setExpectedStudentsCount] = useState(0);
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<"text" | "open" | "mcq">(
    "text",
  );
  const [questionAnswer, setQuestionAnswer] = useState("");
  const [questionImageUrl, setQuestionImageUrl] = useState<string | undefined>(
    undefined,
  );
  const [questionPoints, setQuestionPoints] = useState(1);
  const [questionCorrectIndex, setQuestionCorrectIndex] = useState(0);
  const [mcqOptions, setMcqOptions] = useState<string[]>(["", "", "", ""]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const sidebarTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const examTypeLabel =
      scheduleExamType === "term" ? "Улирлын шалгалт" : "Явцын шалгалт";
    const nextTitle = [
      scheduleClassName,
      scheduleGroupName,
      scheduleSubjectName,
      examTypeLabel,
    ]
      .filter(Boolean)
      .join(" ");

    if (nextTitle !== scheduleTitle) {
      setScheduleTitle(nextTitle);
    }
  }, [
    scheduleClassName,
    scheduleExamType,
    scheduleGroupName,
    scheduleSubjectName,
    scheduleTitle,
  ]);

  const toSyncQuestions = useCallback(
    (sourceQuestions: Question[]) =>
      sourceQuestions.map((question) => ({
        type: question.type,
        text: question.text,
        points: question.points,
        correctAnswer: question.correctAnswer,
        imageUrl: question.imageUrl,
        options: question.options,
      })),
    [],
  );

  const buildLocalExam = useCallback(
    (
      payload: {
        title: string;
        description?: string | null;
        examType?: string | null;
        className?: string | null;
        groupName?: string | null;
        scheduledAt: string | null;
        expectedStudentsCount: number;
        questions: Question[];
      },
      remote?: {
        id: string;
        description?: string | null;
        examType?: string | null;
        className?: string | null;
        groupName?: string | null;
        roomCode?: string | null;
        scheduledAt?: string | null;
        durationMin?: number;
        expectedStudentsCount?: number | null;
        createdAt?: string;
      } | null,
    ): Exam => ({
      id: remote?.id ?? generateId(),
      title: payload.title,
      description: remote?.description ?? payload.description ?? null,
      examType: remote?.examType ?? payload.examType ?? null,
      className: remote?.className ?? payload.className ?? null,
      groupName: remote?.groupName ?? payload.groupName ?? null,
      scheduledAt: remote?.scheduledAt ?? payload.scheduledAt,
      examStartedAt: null,
      roomCode: remote?.roomCode ?? generateRoomCode(),
      expectedStudentsCount:
        remote?.expectedStudentsCount ?? payload.expectedStudentsCount,
      questions: payload.questions,
      duration: remote?.durationMin ?? durationMinutes,
      createdAt: remote?.createdAt ?? new Date().toISOString(),
    }),
    [durationMinutes],
  );

  const persistExams = useCallback(
    (next: Exam[]) => {
      setExams(next);
    },
    [setExams],
  );

  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      let changed = false;
      const nextExams = exams.map((exam) => {
        if (!exam.scheduledAt || exam.notified) return exam;
        const scheduled = new Date(exam.scheduledAt);
        const isTomorrow =
          scheduled.getFullYear() === tomorrow.getFullYear() &&
          scheduled.getMonth() === tomorrow.getMonth() &&
          scheduled.getDate() === tomorrow.getDate();
        if (!isTomorrow) return exam;
        changed = true;
        showToast(`Маргааш "${exam.title}" шалгалт эхэлнэ.`);
        return { ...exam, notified: true };
      });

      if (changed) persistExams(nextExams);
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 60000);
    return () => clearInterval(interval);
  }, [exams, persistExams, showToast]);

  const handleSchedule = async () => {
    if (!scheduleDate || isNaN(new Date(scheduleDate).getTime())) {
      showToast("Шалгалтын огноо оруулна уу.");
      return;
    }

    if (!currentUser) {
      showToast("Багшийн хэрэглэгч олдсонгүй.");
      return;
    }

    const selectedScheduleExam = exams.find(
      (exam) => exam.id === selectedScheduleExamId,
    );

    if (!selectedScheduleExam && !scheduleTitle) {
      showToast("Шалгалтын файл сонгоно уу.");
      return;
    }

    if (!selectedScheduleExam && questions.length === 0) {
      showToast("Хуваарьлахын тулд дор хаяж 1 асуулт бэлэн байх хэрэгтэй.");
      return;
    }

    let newExam = buildLocalExam({
      title: selectedScheduleExam?.title ?? scheduleTitle,
      description: scheduleDescription,
      examType: scheduleExamType,
      className: scheduleClassName,
      groupName: scheduleGroupName,
      scheduledAt: scheduleDate,
      expectedStudentsCount,
      questions: selectedScheduleExam?.questions ?? [],
    });

    try {
      const syncedExam = selectedScheduleExam
        ? await scheduleExistingExamInBackend(currentUser, {
            examId: selectedScheduleExam.id,
            title: selectedScheduleExam.title,
            description: scheduleDescription,
            examType: scheduleExamType,
            className: scheduleClassName,
            groupName: scheduleGroupName,
            duration: durationMinutes,
            scheduledAt: scheduleDate,
            expectedStudentsCount,
          })
        : await syncExamToBackend(currentUser, {
            title: scheduleTitle,
            description: scheduleDescription,
            examType: scheduleExamType,
            className: scheduleClassName,
            groupName: scheduleGroupName,
            duration: durationMinutes,
            scheduledAt: scheduleDate,
            expectedStudentsCount,
            questions: toSyncQuestions(questions),
          });

      newExam = buildLocalExam(
        {
          title: selectedScheduleExam?.title ?? scheduleTitle,
          description: scheduleDescription,
          examType: scheduleExamType,
          className: scheduleClassName,
          groupName: scheduleGroupName,
          scheduledAt: scheduleDate,
          expectedStudentsCount,
          questions: selectedScheduleExam?.questions ?? questions,
        },
        syncedExam,
      );
      showToast("Шалгалт backend дээр хуваарьлагдлаа.");
    } catch (err) {
      let message = "Хуваарьлах үед алдаа гарлаа. Дахин оролдоно уу.";
      if (err instanceof Error && err.message) {
        if (
          err.message.toLowerCase().includes("load failed") ||
          err.message.toLowerCase().includes("failed to fetch")
        ) {
          message =
            "Backend-тэй холбогдож чадсангүй. Сервер ажиллаж байгаа эсэхийг шалгана уу.";
        } else {
          message = err.message;
        }
      }
      showToast(message);
      return;
    }

    persistExams(
      selectedScheduleExam
        ? exams.map((exam) => (exam.id === newExam.id ? newExam : exam))
        : [...exams, newExam],
    );
    setScheduleTitle("");
    setScheduleDate("");
    setScheduleExamType("progress");
    setScheduleClassName("");
    setScheduleGroupName("");
    setScheduleSubjectName("");
    setScheduleDescription("");
    setSelectedScheduleExamId("");
    setRoomCode(newExam.roomCode);
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
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuestion = (id: string, patch: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
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
  };

  const saveExam = async () => {
    if (!examTitle || questions.length === 0) {
      showToast("Шалгалтын нэр болон асуултууд оруулна уу.");
      return;
    }

    if (!currentUser) {
      showToast("Багшийн хэрэглэгч олдсонгүй.");
      return;
    }

    const missingCorrect = questions.filter(
      (question) =>
        question.type === "mcq" &&
        (!question.correctAnswer || !question.correctAnswer.trim()),
    ).length;
    if (missingCorrect > 0) {
      showToast("Зөв хариулт сонгоогүй асуулт байна.");
      return;
    }

    let newExam = buildLocalExam({
      title: examTitle,
      scheduledAt: createDate || null,
      expectedStudentsCount,
      questions,
    });

    try {
      const syncedExam = await syncExamToBackend(currentUser, {
        title: newExam.title,
        duration: newExam.duration ?? 45,
        scheduledAt: createDate || null,
        expectedStudentsCount,
        questions: toSyncQuestions(newExam.questions),
      });

      if (!syncedExam) {
        showToast("Шалгалтыг backend дээр хадгалах боломжгүй байна.");
        return;
      }

      newExam = buildLocalExam(
        {
          title: examTitle,
          scheduledAt: createDate || null,
          expectedStudentsCount,
          questions,
        },
        syncedExam,
      );

      showToast(
        createDate
          ? "Шалгалт backend дээр хадгалагдаж, хуваарьлагдлаа."
          : "Шалгалт backend дээр амжилттай хадгалагдлаа.",
      );
    } catch (err) {
      let message = "Backend хадгалалт амжилтгүй боллоо.";
      if (err instanceof Error && err.message) {
        if (
          err.message.toLowerCase().includes("load failed") ||
          err.message.toLowerCase().includes("failed to fetch")
        ) {
          message =
            "Backend-тэй холбогдож чадсангүй. Сервер ажиллаж байгаа эсэхийг шалгана уу.";
        } else {
          message = err.message;
        }
      }
      showToast(message);
      return;
    }

    persistExams([...exams, newExam]);
    setExamTitle("");
    setCreateDate("");
    setQuestions([]);
    setDurationMinutes(45);
    setQuestionPoints(1);
    setExpectedStudentsCount(0);
    setRoomCode(newExam.roomCode);
    return true;
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
    scheduleExamType,
    setScheduleExamType,
    scheduleClassName,
    setScheduleClassName,
    scheduleGroupName,
    setScheduleGroupName,
    scheduleSubjectName,
    setScheduleSubjectName,
    scheduleDescription,
    setScheduleDescription,
    selectedScheduleExamId,
    setSelectedScheduleExamId,
    examTitle,
    setExamTitle,
    createDate,
    setCreateDate,
    expectedStudentsCount,
    setExpectedStudentsCount,
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
