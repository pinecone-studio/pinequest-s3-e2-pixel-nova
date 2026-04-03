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
    setSessionId,
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
    startingExam,
    startExam,
    submittingExam,
    submitExam,
    terminateExam,
    resultPending,
    resultCountdown,
    resultReleaseAt,
    updateAnswer,
    selectMcqAnswer,
    goNext,
    goPrev,
    resetExamSession,
    sidebarTimerRef,
  } = useStudentExamSession({
    currentUser,
    roomCodeInput,
    sessionId,
    setJoinError,
  });

  const handleStartExam = async () => {
    if (sessionId) {
      startExam();
      return;
    }

    if (!selectedExam?.roomCode) {
      startExam();
      return;
    }

    const joined = await handleLookup(selectedExam.roomCode);
    if (!joined?.sessionId) {
      return;
    }

    startExam({
      sessionId: joined.sessionId,
      roomCode: joined.exam.roomCode,
    });
  };

  const handleSubmitExam = async (
    auto?: boolean,
    terminated?: boolean,
    reason?: string,
  ) => {
    await submitExam(auto, terminated, reason);
    setActiveTab("Progress");
  };

  const leaveExamFlow = () => {
    resetExamSession();
    setSelectedExam(null);
    setSessionId(null);
    setRoomCodeInput("");
    setJoinError(null);
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
    sessionId,
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
    startingExam,
    startExam: handleStartExam,
    submittingExam,
    submitExam: handleSubmitExam,
    terminateExam,
    resultPending,
    resultCountdown,
    resultReleaseAt,
    updateAnswer,
    selectMcqAnswer,
    goNext,
    goPrev,
    leaveExamFlow,
    sidebarTimerRef,
  };
};
