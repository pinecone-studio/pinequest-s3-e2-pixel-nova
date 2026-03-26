import { useCallback, useState } from "react";
import { apiFetch, unwrapApi } from "@/lib/api-client";
import type { Exam, Question } from "../types";

export const useStudentJoinExam = () => {
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleLookup = useCallback(async () => {
    const code = roomCodeInput.trim().toUpperCase();
    if (!code) {
      setJoinError("Өрөөний код оруулна уу.");
      return;
    }
    setJoinLoading(true);
    try {
      const payload = await apiFetch<
        | {
            data?: {
              sessionId: string;
              exam: {
                id: string;
                title: string;
                durationMin: number;
                questionCount: number;
              };
            };
          }
        | {
            sessionId: string;
            exam: {
              id: string;
              title: string;
              durationMin: number;
              questionCount: number;
            };
          }
      >("/api/sessions/join", {
        method: "POST",
        body: JSON.stringify({ roomCode: code }),
      });
      const data = unwrapApi(payload);
      setSessionId(data.sessionId);
      const detailPayload = await apiFetch<
        | {
            data?: {
              session: {
                id: string;
                status: string;
                startedAt: string | null;
                submittedAt: string | null;
              };
              exam: {
                id: string;
                title: string;
                description?: string | null;
                durationMin: number;
              };
              questions: {
                id: string;
                type: string;
                questionText: string;
                imageUrl?: string | null;
                points: number;
                options?: {
                  id: string;
                  label: string;
                  text: string;
                }[];
              }[];
            };
          }
        | {
            session: {
              id: string;
              status: string;
              startedAt: string | null;
              submittedAt: string | null;
            };
            exam: {
              id: string;
              title: string;
              description?: string | null;
              durationMin: number;
            };
            questions: {
              id: string;
              type: string;
              questionText: string;
              imageUrl?: string | null;
              points: number;
              options?: {
                id: string;
                label: string;
                text: string;
              }[];
            }[];
          }
      >(`/api/sessions/${data.sessionId}`);
      const detail = unwrapApi(detailPayload);
      setSelectedExam({
        id: detail.exam.id,
        title: detail.exam.title,
        description: detail.exam.description ?? null,
        scheduledAt: detail.session.startedAt ?? new Date().toISOString(),
        examStartedAt: detail.session.startedAt ?? null,
        roomCode: code,
        questions: detail.questions.map((question) => ({
          id: question.id,
          text: question.questionText,
          type: question.type as Question["type"],
          options: question.options?.map((opt) => opt.text) ?? undefined,
          correctAnswer: "",
          points: Number(question.points ?? 1),
          imageUrl: question.imageUrl ?? undefined,
        })),
        duration: detail.exam.durationMin,
        createdAt: new Date().toISOString(),
      });
      setJoinError(null);
    } catch (err) {
      let message: unknown =
        "Өрөөний код олдсонгүй эсвэл шалгалт идэвхгүй байна.";
      if (err instanceof Error && err.message) {
        try {
          const parsed = JSON.parse(err.message) as {
            message?: string;
            error?: string | { message?: string; code?: string };
          };
          if (typeof parsed.message === "string") {
            message = parsed.message;
          } else if (typeof parsed.error === "string") {
            message = parsed.error;
          } else if (parsed.error && typeof parsed.error === "object") {
            message = parsed.error.message ?? message;
          }
        } catch {
          message = err.message;
        }
      }
      const messageText = String(message);
      if (
        messageText.toLowerCase().includes("load failed") ||
        messageText.toLowerCase().includes("failed to fetch")
      ) {
        setJoinError(
          "Сервертэй холбогдож чадсангүй. Backend ажиллаж байгаа эсэхийг шалгана уу.",
        );
      } else {
        setJoinError(messageText);
      }
      setSelectedExam(null);
    } finally {
      setJoinLoading(false);
    }
  }, [roomCodeInput]);

  return {
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
  };
};
