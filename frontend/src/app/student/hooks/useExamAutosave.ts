import { useEffect } from "react";
import { setJSON } from "@/lib/examGuard";
import type { Exam, ExamSession } from "../types";
import type { User } from "@/lib/examGuard";

type Params = {
  view: "dashboard" | "exam" | "result";
  sessionKey: string | null;
  currentUser: User | null;
  activeExam: Exam | null;
  answers: Record<string, string>;
  currentQuestionIndex: number;
  timeLeft: number;
};

export const useExamAutosave = ({
  view,
  sessionKey,
  currentUser,
  activeExam,
  answers,
  currentQuestionIndex,
  timeLeft,
}: Params) => {
  useEffect(() => {
    if (view !== "exam" || !sessionKey || !currentUser || !activeExam) return;
    const autosave = setInterval(() => {
      const session: ExamSession = {
        examId: activeExam.id,
        studentId: currentUser.id,
        answers,
        currentQuestionIndex,
        timeLeft,
        startedAt: new Date().toISOString(),
      };
      setJSON(sessionKey, session);
    }, 30000);
    return () => clearInterval(autosave);
  }, [
    view,
    sessionKey,
    currentUser,
    activeExam,
    answers,
    currentQuestionIndex,
    timeLeft,
  ]);
};
