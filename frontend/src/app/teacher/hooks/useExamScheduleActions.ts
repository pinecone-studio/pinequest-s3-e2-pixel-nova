import { useCallback } from "react";
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
  scheduleDescription: string;
  scheduleLocationPolicy: "anywhere" | "school_only";
  scheduleLocationLabel: string;
  scheduleLocationLatitude: string;
  scheduleLocationLongitude: string;
  scheduleAllowedRadiusMeters: number;
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
  setScheduleLocationPolicy: (value: "anywhere" | "school_only") => void;
  setScheduleLocationLabel: (value: string) => void;
  setScheduleLocationLatitude: (value: string) => void;
  setScheduleLocationLongitude: (value: string) => void;
  setScheduleAllowedRadiusMeters: (value: number) => void;
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
  scheduleLocationPolicy,
  scheduleLocationLabel,
  scheduleLocationLatitude,
  scheduleLocationLongitude,
  scheduleAllowedRadiusMeters,
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
  setScheduleLocationPolicy,
  setScheduleLocationLabel,
  setScheduleLocationLatitude,
  setScheduleLocationLongitude,
  setScheduleAllowedRadiusMeters,
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

    let sourceExam = selectedScheduleExam ?? null;

    if (sourceExam && sourceExam.questions.length === 0) {
      try {
        sourceExam = await fetchTeacherExamDetail(sourceExam.id, currentUser.id);
      } catch {
        showToast("Шалгалтын материалыг дуудаж чадсангүй. Дахин оролдоно уу.");
        return;
      }
    }

    if (sourceExam) {
      if ((sourceExam.questionCount ?? sourceExam.questions.length) === 0) {
        showToast("Асуултгүй шалгалтыг хуваарьлах боломжгүй.");
        return;
      }
    }

    if (!sourceExam && questions.length === 0) {
      showToast("Хуваарьлахын тулд дор хаяж 1 асуулт бэлэн байх хэрэгтэй.");
      return;
    }

    const normalizedLatitude = scheduleLocationLatitude.trim()
      ? Number(scheduleLocationLatitude)
      : null;
    const normalizedLongitude = scheduleLocationLongitude.trim()
      ? Number(scheduleLocationLongitude)
      : null;

    if (
      scheduleLocationPolicy === "school_only" &&
      (normalizedLatitude === null ||
        normalizedLongitude === null ||
        Number.isNaN(normalizedLatitude) ||
        Number.isNaN(normalizedLongitude))
    ) {
      showToast("Сургуулийн байршлын өргөрөг, уртрагийг зөв оруулна уу.");
      return;
    }

    const locationConfig = {
      locationPolicy: scheduleLocationPolicy,
      locationLabel: scheduleLocationPolicy === "school_only" ? scheduleLocationLabel.trim() || "Сургууль" : null,
      locationLatitude: scheduleLocationPolicy === "school_only" ? normalizedLatitude : null,
      locationLongitude: scheduleLocationPolicy === "school_only" ? normalizedLongitude : null,
      allowedRadiusMeters: scheduleLocationPolicy === "school_only" ? scheduleAllowedRadiusMeters : 3000,
    } as const;

    let newExam = buildLocalExam({
      title: sourceExam?.title ?? scheduleTitle,
      description: scheduleDescription,
      examType: scheduleExamType,
      className: scheduleClassName,
      groupName: scheduleGroupName,
      scheduledAt: scheduleDate,
      expectedStudentsCount,
      questions: sourceExam?.questions ?? questions,
      durationMinutes,
      locationPolicy: locationConfig.locationPolicy,
      locationLabel: locationConfig.locationLabel,
      locationLatitude: locationConfig.locationLatitude,
      locationLongitude: locationConfig.locationLongitude,
      allowedRadiusMeters: locationConfig.allowedRadiusMeters,
      remote: null,
    });

    try {
      const syncedExam = await syncExamToBackend(currentUser, {
        title: sourceExam?.title ?? scheduleTitle,
        description:
          scheduleDescription || sourceExam?.description || "",
        examType: scheduleExamType || sourceExam?.examType || "",
        className: scheduleClassName,
        groupName: scheduleGroupName,
        duration: durationMinutes,
        scheduledAt: scheduleDate,
        expectedStudentsCount,
        location: locationConfig,
        questions: toSyncQuestions(sourceExam?.questions ?? questions),
      });

      newExam = buildLocalExam({
        title: sourceExam?.title ?? scheduleTitle,
        description:
          scheduleDescription || sourceExam?.description || "",
        examType: scheduleExamType || sourceExam?.examType || "",
        className: scheduleClassName,
        groupName: scheduleGroupName,
        scheduledAt: scheduleDate,
        expectedStudentsCount,
        questions: sourceExam?.questions ?? questions,
        durationMinutes,
        locationPolicy: locationConfig.locationPolicy,
        locationLabel: locationConfig.locationLabel,
        locationLatitude: locationConfig.locationLatitude,
        locationLongitude: locationConfig.locationLongitude,
        allowedRadiusMeters: locationConfig.allowedRadiusMeters,
        remote: syncedExam,
      });
      showToast("Шалгалтын материалыг хуулж шинэ хуваарь үүслээ.");
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

    setExams([newExam, ...exams]);
    setScheduleTitle("");
    setScheduleDate("");
    setScheduleExamType("progress");
    setScheduleClassName("");
    setScheduleGroupName("");
    setScheduleSubjectName("");
    setScheduleDescription("");
    setScheduleLocationPolicy("anywhere");
    setScheduleLocationLabel("Сургууль");
    setScheduleLocationLatitude("");
    setScheduleLocationLongitude("");
    setScheduleAllowedRadiusMeters(3000);
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
    scheduleLocationLabel,
    scheduleLocationLatitude,
    scheduleLocationLongitude,
    scheduleLocationPolicy,
    scheduleTitle,
    scheduleAllowedRadiusMeters,
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
    setScheduleLocationLabel,
    setScheduleLocationLatitude,
    setScheduleLocationLongitude,
    setScheduleLocationPolicy,
    setScheduleSubjectName,
    setScheduleTitle,
    setScheduleAllowedRadiusMeters,
    setSelectedScheduleExamId,
    showToast,
  ]);

  return { handleSchedule };
};
