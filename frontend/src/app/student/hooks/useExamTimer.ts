import { useEffect } from "react";
import type { Exam } from "../types";
import type { User } from "@/lib/examGuard";

type Params = {
  view: "dashboard" | "exam" | "result";
  currentUser: User | null;
  activeExam: Exam | null;
  setTimeLeft: (value: number | ((prev: number) => number)) => void;
  submitExam: (auto?: boolean) => void;
};

export const useExamTimer = ({
  view,
  currentUser,
  activeExam,
  setTimeLeft,
  submitExam,
}: Params) => {
  useEffect(() => {
    if (view !== "exam" || !currentUser || !activeExam) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          submitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [view, currentUser, activeExam, submitExam, setTimeLeft]);
};
