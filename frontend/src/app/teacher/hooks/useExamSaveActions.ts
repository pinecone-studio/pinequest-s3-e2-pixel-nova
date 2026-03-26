import { useCallback } from "react";
import { syncExamToBackend } from "@/lib/backend-exams";
import type { User } from "@/lib/examGuard";
import type { Exam, Question } from "../types";
import { buildLocalExam, toSyncQuestions } from "./exam-management-helpers";

type UseExamSaveActionsParams = {
  exams: Exam[];
  setExams: (next: Exam[]) => void;
  showToast: (message: string) => void;
  currentUser?: User | null;
  examTitle: string;
  createDate: string;
  expectedStudentsCount: number;
  durationMinutes: number;
  questions: Question[];
  setExamTitle: (value: string) => void;
  setCreateDate: (value: string) => void;
  setQuestions: (value: Question[]) => void;
  setDurationMinutes: (value: number) => void;
  setQuestionPoints: (value: number) => void;
  setExpectedStudentsCount: (value: number) => void;
  setRoomCode: (value: string | null) => void;
};

export const useExamSaveActions = ({
  exams,
  setExams,
  showToast,
  currentUser,
  examTitle,
  createDate,
  expectedStudentsCount,
  durationMinutes,
  questions,
  setExamTitle,
  setCreateDate,
  setQuestions,
  setDurationMinutes,
  setQuestionPoints,
  setExpectedStudentsCount,
  setRoomCode,
}: UseExamSaveActionsParams) => {
  const saveExam = useCallback(async () => {
    if (!examTitle || questions.length === 0) {
      showToast("Шалгалтын нэр болон асуултууд оруулна уу.");
      return false;
    }

    if (!currentUser) {
      showToast("Багшийн хэрэглэгч олдсонгүй.");
      return false;
    }

    const missingCorrect = questions.filter(
      (question) =>
        question.type === "mcq" &&
        (!question.correctAnswer || !question.correctAnswer.trim()),
    ).length;
    if (missingCorrect > 0) {
      showToast("Зөв хариулт сонгоогүй асуулт байна.");
      return false;
    }

    let newExam = buildLocalExam({
      title: examTitle,
      scheduledAt: createDate || null,
      expectedStudentsCount,
      questions,
      durationMinutes,
      remote: null,
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
        return false;
      }

      newExam = buildLocalExam({
        title: examTitle,
        scheduledAt: createDate || null,
        expectedStudentsCount,
        questions,
        durationMinutes,
        remote: syncedExam,
      });

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
      return false;
    }

    setExams([...exams, newExam]);
    setExamTitle("");
    setCreateDate("");
    setQuestions([]);
    setDurationMinutes(45);
    setQuestionPoints(1);
    setExpectedStudentsCount(0);
    setRoomCode(newExam.roomCode);
    return true;
  }, [
    createDate,
    currentUser,
    examTitle,
    exams,
    expectedStudentsCount,
    questions,
    durationMinutes,
    setCreateDate,
    setDurationMinutes,
    setExamTitle,
    setExpectedStudentsCount,
    setExams,
    setQuestionPoints,
    setQuestions,
    setRoomCode,
    showToast,
  ]);

  return { saveExam };
};
