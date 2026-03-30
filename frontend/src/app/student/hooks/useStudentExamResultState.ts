import { useEffect, useState } from "react";
import { apiFetch, unwrapApi } from "@/lib/api-client";
import type { Exam, Question, Submission } from "../types";
import { mapResultToReport } from "./student-exam-session-helpers";

type AnswerReportItem = { question: Question; answer: string; correct: boolean }[];
const RESULT_PENDING_POLL_MS = 15000;

export function useStudentExamResultState(sessionId: string | null, activeExam: Exam | null) {
  const [lastSubmission, setLastSubmission] = useState<Submission | null>(null);
  const [resultPending, setResultPending] = useState(false);
  const [resultReleaseAt, setResultReleaseAt] = useState<string | null>(null);
  const [resultCountdown, setResultCountdown] = useState("00:00:00");
  const [answerReport, setAnswerReport] = useState<AnswerReportItem>([]);

  useEffect(() => {
    if (!resultPending) return;
    if (!resultReleaseAt) {
      setResultCountdown("00:00:00");
      return;
    }

    const releaseTime = new Date(resultReleaseAt).getTime();
    if (Number.isNaN(releaseTime)) return;
    const timer = window.setInterval(() => {
      const diff = Math.max(releaseTime - Date.now(), 0);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setResultCountdown(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [resultPending, resultReleaseAt]);

  useEffect(() => {
    if (!resultPending || !sessionId || !activeExam) return;

    const fetchResult = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }

      const examStatus = activeExam.status ?? null;
      if (examStatus === "finished" || examStatus === "archived") {
        return;
      }

      try {
        const resultPayload = await apiFetch(`/api/sessions/${sessionId}/result`);
        const result = unwrapApi(resultPayload as never) as {
          answers: {
            questionText: string;
            selectedAnswer: string | null;
            correctAnswer: string | null;
            isCorrect: boolean;
            points: number;
            pointsEarned: number;
          }[];
          score: number;
          totalPoints: number;
        };
        setAnswerReport(mapResultToReport(result));
        setLastSubmission((prev) =>
          prev
            ? {
                ...prev,
                score: result.score ?? 0,
                totalPoints: result.totalPoints ?? 0,
                percentage: result.score ?? 0,
              }
            : prev,
        );
        setResultPending(false);
        setResultReleaseAt(null);
      } catch {
        return;
      }
    };

    const interval = window.setInterval(() => {
      void fetchResult();
    }, RESULT_PENDING_POLL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchResult();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [resultPending, sessionId, activeExam]);

  return {
    lastSubmission,
    setLastSubmission,
    resultPending,
    setResultPending,
    resultReleaseAt,
    setResultReleaseAt,
    resultCountdown,
    answerReport,
    setAnswerReport,
  };
}
