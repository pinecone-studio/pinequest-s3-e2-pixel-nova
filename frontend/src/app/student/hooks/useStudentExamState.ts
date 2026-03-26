import { useState } from "react";
import type { StudentTab } from "../types";
import type { User } from "@/lib/examGuard";
import { useStudentJoinExam } from "./useStudentJoinExam";
import { useStudentExamSession } from "./useStudentExamSession";
export const useStudentExamState = (params: {
  currentUser: User | null;
}) => {
  const { currentUser } = params;
  const [activeTab, setActiveTab] = useState<StudentTab>("Home");
  const {
    roomCodeInput,
    setRoomCodeInput,
    joinError,
    setJoinError,
    joinLoading,
    selectedExam,
    setSelectedExam,
    sessionId,
    handleLookup,
  } = useStudentJoinExam();

  const {
    view,
    setView,
    activeExam,
    answers,
    setAnswers,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    timeLeft,
    setTimeLeft,
    lastSubmission,
    answerReport,
    setAnswerReport,
    violations,
    setViolations,
    warning,
    showWarning,
    logViolation,
    startExam,
    submitExam,
    terminateExam,
    updateAnswer,
    selectMcqAnswer,
    goNext,
    goPrev,
    sidebarTimerRef,
  } = useStudentExamSession({
    currentUser,
    roomCodeInput,
    sessionId,
  });

  const handleSubmitExam = async (
    auto?: boolean,
    terminated?: boolean,
    reason?: string,
  ) => {
    await submitExam(auto, terminated, reason);
    setActiveTab("Progress");
  };

  return {
    view,
    setView,
    activeTab,
    setActiveTab,
    handleLookup,
    roomCodeInput,
    setRoomCodeInput,
    joinLoading,
    joinError,
    setJoinError,
    selectedExam,
    setSelectedExam,
    activeExam,
    answers,
    setAnswers,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    timeLeft,
    setTimeLeft,
    lastSubmission,
    answerReport,
    setAnswerReport,
    violations,
    setViolations,
    warning,
    showWarning,
    logViolation,
    startExam,
    submitExam: handleSubmitExam,
    terminateExam,
    updateAnswer,
    selectMcqAnswer,
    goNext,
    goPrev,
    sidebarTimerRef,
  };
};
