import { useCallback, useEffect, useState } from "react";
import { apiFetch, unwrapApi } from "@/lib/api-client";
import type { Exam } from "../types";

export const useStudentJoinExam = () => {
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedExam?.scheduledAt) return;
    if (!joinError) return;
    const scheduledTime = new Date(selectedExam.scheduledAt).getTime();
    if (Number.isNaN(scheduledTime)) return;
    if (Date.now() >= scheduledTime) {
      setJoinError(null);
      return;
    }
    const timer = window.setInterval(() => {
      if (Date.now() >= scheduledTime) {
        setJoinError(null);
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [joinError, selectedExam?.scheduledAt]);

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
              status: string;
              sessionStatus?: string;
              entryStatus?: "on_time" | "late";
              scheduledAt?: string | null;
              startedAt?: string | null;
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
            status: string;
            sessionStatus?: string;
            entryStatus?: "on_time" | "late";
            scheduledAt?: string | null;
            startedAt?: string | null;
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
      setSelectedExam({
        id: data.exam.id,
        title: data.exam.title,
        description: null,
        status: data.status ?? null,
        sessionStatus: data.sessionStatus ?? null,
        entryStatus: data.entryStatus ?? null,
        scheduledAt: data.scheduledAt ?? new Date().toISOString(),
        examStartedAt: data.startedAt ?? null,
        roomCode: code,
        questions: [],
        duration: data.exam.durationMin,
        createdAt: new Date().toISOString(),
      });
      if (data.status === "scheduled") {
        setJoinError("Шалгалт хараахан эхлээгүй байна. Хүлээнэ үү.");
      } else {
        setJoinError(null);
      }
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
