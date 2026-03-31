import { useRef, useState } from "react";
import type { User } from "@/lib/examGuard";
import type { Exam } from "../types";
import { useExamQuestions } from "./useExamQuestions";
import { useExamScheduleState } from "./useExamScheduleState";
import { useExamScheduleActions } from "./useExamScheduleActions";
import { useExamSaveActions } from "./useExamSaveActions";
import { useExamNotifications } from "./useExamNotifications";

export const useExamManagement = (params: {
  exams: Exam[];
  setExams: (next: Exam[]) => void;
  showToast: (message: string) => void;
  currentUser?: User | null;
}) => {
  const { exams, setExams, showToast, currentUser } = params;
  const hasCurrentUser = Boolean(currentUser?.id);
  const {
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
    scheduleExpectedStudentsCount,
    setScheduleExpectedStudentsCount,
    scheduleLocationPolicy,
    setScheduleLocationPolicy,
    scheduleLocationLabel,
    setScheduleLocationLabel,
    scheduleLocationLatitude,
    setScheduleLocationLatitude,
    scheduleLocationLongitude,
    setScheduleLocationLongitude,
    scheduleAllowedRadiusMeters,
    setScheduleAllowedRadiusMeters,
  } = useExamScheduleState();
  const [examTitle, setExamTitle] = useState("");
  const [createDate, setCreateDate] = useState("");
  const [expectedStudentsCount, setExpectedStudentsCount] = useState(0);
  const {
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
  } = useExamQuestions({ showToast });
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const sidebarTimerRef = useRef<number | null>(null);

  useExamNotifications({ exams, setExams, showToast });

  const { handleSchedule } = useExamScheduleActions({
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
    setScheduleLocationPolicy,
    setScheduleLocationLabel,
    setScheduleLocationLatitude,
    setScheduleLocationLongitude,
    setScheduleAllowedRadiusMeters,
    setScheduleExpectedStudentsCount,
    setSelectedScheduleExamId,
    setRoomCode,
  });

  // Question handlers come from useExamQuestions.

  const { saveExam, saving } = useExamSaveActions({
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
  });

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast("Өрөөний код хууллаа.");
      return true;
    } catch {
      showToast("Өрөөний код хуулж чадсангүй.");
      return false;
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
    scheduleExpectedStudentsCount,
    setScheduleExpectedStudentsCount,
    scheduleLocationPolicy,
    setScheduleLocationPolicy,
    scheduleLocationLabel,
    setScheduleLocationLabel,
    scheduleLocationLatitude,
    setScheduleLocationLatitude,
    scheduleLocationLongitude,
    setScheduleLocationLongitude,
    scheduleAllowedRadiusMeters,
    setScheduleAllowedRadiusMeters,
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
    saving,
    hasCurrentUser,
    copyCode,
  };
};
