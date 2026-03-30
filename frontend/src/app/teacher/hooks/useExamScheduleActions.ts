import { useCallback } from "react";
import { scheduleExistingExamInBackend, syncExamToBackend } from "@/lib/backend-exams";
import type { User } from "@/lib/examGuard";
import type { Exam, Question } from "../types";
import { buildLocalExam, toSyncQuestions } from "./exam-management-helpers";

type UseExamScheduleActionsParams = {
  exams: Exam[];
  setExams: (next: Exam[]) => void;
  showToast: (message: string) => void;
  currentUser?: User | null;
  scheduleTitle: string;
  scheduleDate: string;
  scheduleExamType: string;
  scheduleClassName: string;
  scheduleGroupName: string;
  scheduleDescription: string;
  selectedScheduleExamId: string;
  expectedStudentsCount: number;
  durationMinutes: number;
  questions: Question[];
  setScheduleTitle: (value: string) => void;
  setScheduleDate: (value: string) => void;
  setScheduleExamType: (value: string) => void;
  setScheduleClassName: (value: string) => void;
  setScheduleGroupName: (value: string) => void;
  setScheduleSubjectName: (value: string) => void;
  setScheduleDescription: (value: string) => void;
  setSelectedScheduleExamId: (value: string) => void;
  setRoomCode: (value: string | null) => void;
};

export const useExamScheduleActions = ({
  exams,
  setExams,
  showToast,
  currentUser,
  scheduleTitle,
  scheduleDate,
  scheduleExamType,
  scheduleClassName,
  scheduleGroupName,
  scheduleDescription,
  selectedScheduleExamId,
  expectedStudentsCount,
  durationMinutes,
  questions,
  setScheduleTitle,
  setScheduleDate,
  setScheduleExamType,
  setScheduleClassName,
  setScheduleGroupName,
  setScheduleSubjectName,
  setScheduleDescription,
  setSelectedScheduleExamId,
  setRoomCode,
}: UseExamScheduleActionsParams) => {
  const handleSchedule = useCallback(async () => {
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

    if (selectedScheduleExam) {
      if (
        (selectedScheduleExam.questionCount ?? selectedScheduleExam.questions.length) === 0
      ) {
        showToast("Асуултгүй шалгалтыг хуваарьлах боломжгүй.");
        return;
      }
    }

    const selectedStatus = selectedScheduleExam?.status ?? "draft";
    const canReuseExistingSchedule =
      Boolean(selectedScheduleExam) &&
      (selectedStatus === "draft" || selectedStatus === "scheduled");

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
      durationMinutes,
      remote: null,
    });

    try {
      const syncedExam = canReuseExistingSchedule && selectedScheduleExam
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
            title: selectedScheduleExam?.title ?? scheduleTitle,
            description:
              scheduleDescription || selectedScheduleExam?.description || "",
            examType: scheduleExamType || selectedScheduleExam?.examType || "",
            className: scheduleClassName,
            groupName: scheduleGroupName,
            duration: durationMinutes,
            scheduledAt: scheduleDate,
            expectedStudentsCount,
            questions: toSyncQuestions(
              selectedScheduleExam?.questions ?? questions,
            ),
          });

      newExam = buildLocalExam({
        title: selectedScheduleExam?.title ?? scheduleTitle,
        description:
          scheduleDescription || selectedScheduleExam?.description || "",
        examType: scheduleExamType || selectedScheduleExam?.examType || "",
        className: scheduleClassName,
        groupName: scheduleGroupName,
        scheduledAt: scheduleDate,
        expectedStudentsCount,
        questions: selectedScheduleExam?.questions ?? questions,
        durationMinutes,
        remote: syncedExam,
      });
      showToast(
        canReuseExistingSchedule
          ? "Шалгалтын хуваарь шинэчлэгдлээ."
          : "Шалгалтын сангаас хуулж шинэ хуваарь үүслээ.",
      );
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

    setExams(
      canReuseExistingSchedule
        ? exams.map((exam) => (exam.id === newExam.id ? newExam : exam))
        : [newExam, ...exams],
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
  }, [
    exams,
    questions,
    scheduleClassName,
    scheduleDate,
    scheduleDescription,
    scheduleExamType,
    scheduleGroupName,
    scheduleTitle,
    selectedScheduleExamId,
    durationMinutes,
    expectedStudentsCount,
    currentUser,
    setExams,
    setRoomCode,
    setScheduleClassName,
    setScheduleDate,
    setScheduleDescription,
    setScheduleExamType,
    setScheduleGroupName,
    setScheduleSubjectName,
    setScheduleTitle,
    setSelectedScheduleExamId,
    showToast,
  ]);

  return { handleSchedule };
};
