import { useEffect } from "react";
import { getJSON } from "@/lib/examGuard";
import type { ExamSession } from "../types";

type Params = {
  view: "dashboard" | "exam" | "result";
  sessionKey: string | null;
  setAnswers: (value: Record<string, string>) => void;
  setCurrentQuestionIndex: (value: number) => void;
  setTimeLeft: (value: number) => void;
};

export const useExamSessionRestore = ({
  view,
  sessionKey,
  setAnswers,
  setCurrentQuestionIndex,
  setTimeLeft,
}: Params) => {
  useEffect(() => {
    if (view !== "exam" || !sessionKey) return;
    const session = getJSON<ExamSession | null>(sessionKey, null);
    if (session) {
      setAnswers(session.answers);
      setCurrentQuestionIndex(session.currentQuestionIndex);
      setTimeLeft(session.timeLeft);
    }
  }, [view, sessionKey, setAnswers, setCurrentQuestionIndex, setTimeLeft]);
};
