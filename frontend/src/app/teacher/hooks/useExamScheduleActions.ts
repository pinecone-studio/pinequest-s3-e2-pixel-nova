import { useCallback, useState } from "react";
import { syncExamToBackend } from "@/lib/backend-exams";
import { fetchTeacherExamDetail } from "./teacher-api";
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
  scheduleSubjectName: string;
  scheduleDescription: string;
  selectedScheduleExamId: string;
  scheduleExpectedStudentsCount: number;
  durationMinutes: number;
  questions: Question[];
  setScheduleTitle: (value: string) => void;
  setScheduleDate: (value: string) => void;
  setScheduleExamType: (value: string) => void;
  setScheduleClassName: (value: string) => void;
  setScheduleGroupName: (value: string) => void;
  setScheduleSubjectName: (value: string) => void;
  setScheduleDescription: (value: string) => void;
  setScheduleExpectedStudentsCount: (value: number) => void;
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
  scheduleSubjectName,
  scheduleDescription,
  selectedScheduleExamId,
  scheduleExpectedStudentsCount,
  durationMinutes,
  questions,
  setScheduleTitle,
  setScheduleDate,
  setScheduleExamType,
  setScheduleClassName,
  setScheduleGroupName,
  setScheduleSubjectName,
  setScheduleDescription,
  setScheduleExpectedStudentsCount,
  setSelectedScheduleExamId,
  setRoomCode,
}: UseExamScheduleActionsParams) => {
  const [scheduling, setScheduling] = useState(false);

  const handleSchedule = useCallback(async (): Promise<Exam | null> => {
    if (scheduling) {
      return null;
    }

    setScheduling(true);

    if (!scheduleDate || Number.isNaN(new Date(scheduleDate).getTime())) {
      showToast("Шалгалтын огноо оруулна уу.");
      setScheduling(false);
      return null;
    }

    if (!currentUser) {
      showToast("Багшийн хэрэглэгч олдсонгүй.");
      setScheduling(false);
      return null;
    }

    const selectedScheduleExam =
      exams.find((exam) => exam.id === selectedScheduleExamId) ?? null;

    if (!selectedScheduleExam && !scheduleTitle) {
      showToast("Шалгалтын файл сонгоно уу.");
      setScheduling(false);
      return null;
    }

    let sourceExam: Exam | null = selectedScheduleExam ?? null;

    if (sourceExam && sourceExam.questions.length === 0) {
      try {
        sourceExam = await fetchTeacherExamDetail(sourceExam.id, currentUser.id);
      } catch {
        showToast(
          "Шалгалтын материалыг дуудаж чадсангүй. Дахин оролдоно уу.",
        );
        setScheduling(false);
        return null;
      }
    }

    if (sourceExam) {
      if ((sourceExam.questionCount ?? sourceExam.questions.length) === 0) {
        showToast(
          "Асуултгүй шалгалтыг хуваарьлах боломжгүй.",
        );
        setScheduling(false);
        return null;
      }
    }

    if (!sourceExam && questions.length === 0) {
      showToast(
        "Хуваарьлахын тулд дор хаяж 1 асуулт бэлэн байх хэрэгтэй.",
      );
      setScheduling(false);
      return null;
    }

    const resolvedTitle =
      sourceExam?.title?.trim() ||
      scheduleSubjectName.trim() ||
      scheduleTitle.trim();
    const resolvedSubjectName =
      sourceExam?.subjectName?.trim() || scheduleSubjectName.trim() || null;

    let newExam = buildLocalExam({
      title: resolvedTitle,
      description: scheduleDescription,
      subjectName: resolvedSubjectName,
      examType: scheduleExamType,
      className: scheduleClassName,
      groupName: scheduleGroupName,
      scheduledAt: scheduleDate,
      expectedStudentsCount: scheduleExpectedStudentsCount,
      questions: sourceExam?.questions ?? questions,
      durationMinutes,
      locationPolicy: "anywhere",
      locationLabel: null,
      locationLatitude: null,
      locationLongitude: null,
      allowedRadiusMeters: 3000,
      remote: null,
    });

    try {
      const syncedExam = await syncExamToBackend(currentUser, {
        title: resolvedTitle,
        description: scheduleDescription || sourceExam?.description || "",
        subjectName: resolvedSubjectName,
        examType: scheduleExamType || sourceExam?.examType || "",
        className: scheduleClassName,
        groupName: scheduleGroupName,
        duration: durationMinutes,
        scheduledAt: scheduleDate,
        expectedStudentsCount: scheduleExpectedStudentsCount,
        questions: toSyncQuestions(sourceExam?.questions ?? questions),
      });

      newExam = buildLocalExam({
        title: resolvedTitle,
        description: scheduleDescription || sourceExam?.description || "",
        subjectName: resolvedSubjectName,
        examType: scheduleExamType || sourceExam?.examType || "",
        className: scheduleClassName,
        groupName: scheduleGroupName,
        scheduledAt: scheduleDate,
        expectedStudentsCount: scheduleExpectedStudentsCount,
        questions: sourceExam?.questions ?? questions,
        durationMinutes,
        locationPolicy: "anywhere",
        locationLabel: null,
        locationLatitude: null,
        locationLongitude: null,
        allowedRadiusMeters: 3000,
        remote: syncedExam,
      });
      showToast("Шалгалтын материалыг хуулж шинэ хуваарь үүслээ.");
    } catch (err) {
      let message =
        "Хуваарьлах үед алдаа гарлаа. Дахин оролдоно уу.";
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
      setScheduling(false);
      return null;
    }

    setExams([newExam, ...exams]);
    setScheduleTitle("");
    setScheduleDate("");
    setScheduleExamType("progress");
    setScheduleClassName("");
    setScheduleGroupName("");
    setScheduleSubjectName("");
    setScheduleDescription("");
    setScheduleExpectedStudentsCount(0);
    setSelectedScheduleExamId("");
    setRoomCode(newExam.roomCode);
    setScheduling(false);
    return newExam;
  }, [
    currentUser,
    durationMinutes,
    exams,
    scheduleExpectedStudentsCount,
    questions,
    scheduling,
    scheduleClassName,
    scheduleDate,
    scheduleDescription,
    scheduleExamType,
    scheduleGroupName,
    scheduleSubjectName,
    scheduleTitle,
    selectedScheduleExamId,
    setExams,
    setRoomCode,
    setScheduleClassName,
    setScheduleDate,
    setScheduleDescription,
    setScheduleExamType,
    setScheduleGroupName,
    setScheduleSubjectName,
    setScheduleTitle,
    setScheduleExpectedStudentsCount,
    setSelectedScheduleExamId,
    showToast,
  ]);

  return { handleSchedule, scheduling };
};
