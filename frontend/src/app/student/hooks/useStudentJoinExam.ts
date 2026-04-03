import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/api/client";
import type { Exam } from "../types";

const STUDENT_JOIN_STATE_KEY = "student:join-state";

const readStoredJoinState = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STUDENT_JOIN_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      roomCodeInput?: string;
      sessionId?: string | null;
      selectedExam?: Exam | null;
    };
    return parsed;
  } catch {
    return null;
  }
};

export const useStudentJoinExam = () => {
  const [roomCodeInput, setRoomCodeInput] = useState(
    () => readStoredJoinState()?.roomCodeInput ?? "",
  );
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(
    () => readStoredJoinState()?.selectedExam ?? null,
  );
  const [sessionId, setSessionId] = useState<string | null>(
    () => readStoredJoinState()?.sessionId ?? null,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (!roomCodeInput && !selectedExam && !sessionId) {
        window.sessionStorage.removeItem(STUDENT_JOIN_STATE_KEY);
        return;
      }
      window.sessionStorage.setItem(
        STUDENT_JOIN_STATE_KEY,
        JSON.stringify({
          roomCodeInput,
          sessionId,
          selectedExam,
        }),
      );
    } catch {
      // ignore persistence errors
    }
  }, [roomCodeInput, selectedExam, sessionId]);

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

  const handleLookup = useCallback(async (roomCodeOverride?: string) => {
    const code = (roomCodeOverride ?? roomCodeInput).trim().toUpperCase();
    if (!code) {
      setJoinError("Өрөөний код оруулна уу.");
      return null;
    }
    setJoinLoading(true);
    try {
      const payload = await apiRequest<{
        sessionId: string;
        status: string;
        sessionStatus?: string;
        entryStatus?: "on_time" | "late";
        scheduledAt?: string | null;
        startedAt?: string | null;
        exam: {
          id: string;
          title: string;
          teacherName?: string | null;
          durationMin: number;
          questionCount: number;
          requiresAudioRecording?: boolean;
          enabledCheatDetections?: string[];
        };
      }>("/api/sessions/join", {
        method: "POST",
        body: JSON.stringify({ roomCode: code }),
      });
      const data = payload;
      const nextSelectedExam: Exam = {
        id: data.exam.id,
        title: data.exam.title,
        teacherName: data.exam.teacherName ?? null,
        description: null,
        status: data.status ?? null,
        sessionStatus: data.sessionStatus ?? null,
        entryStatus: data.entryStatus ?? null,
        scheduledAt: data.scheduledAt ?? new Date().toISOString(),
        examStartedAt: data.startedAt ?? null,
        roomCode: code,
        requiresAudioRecording: Boolean(data.exam.requiresAudioRecording),
        enabledCheatDetections: data.exam.enabledCheatDetections ?? undefined,
        questions: [],
        duration: data.exam.durationMin,
        createdAt: new Date().toISOString(),
      };
      setSessionId(data.sessionId);
      setSelectedExam(nextSelectedExam);
      if (data.status === "scheduled") {
        setJoinError("Шалгалт хараахан эхлээгүй байна. Хүлээнэ үү.");
      } else {
        setJoinError(null);
      }
      return {
        sessionId: data.sessionId,
        exam: nextSelectedExam,
      };
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
          "Сервертэй холбогдож чадсангүй. Сервер ажиллаж байгаа эсэхийг шалгана уу.",
        );
      } else if (
        messageText.includes("LOCATION_REQUIRED") ||
        messageText.includes("LOCATION_OUTSIDE_ALLOWED_AREA")
      ) {
        setJoinError(
          "Энэ шалгалт хуучин байршлын тохиргоотой байна. Багш шинэчилсэн хуваарь үүсгэнэ үү.",
        );
      } else {
        setJoinError(messageText);
      }
      setSelectedExam(null);
      return null;
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
