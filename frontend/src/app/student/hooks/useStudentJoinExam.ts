import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/api/client";
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

  const requestCurrentLocation = useCallback(
    () =>
      new Promise<{
        latitude: number;
        longitude: number;
        accuracy?: number;
      }>((resolve, reject) => {
        if (typeof window === "undefined" || !navigator.geolocation) {
          reject(new Error("Энэ төхөөрөмж байршлын мэдээлэл дэмжихгүй байна."));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) =>
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            }),
          () =>
            reject(
              new Error(
                "Энэ шалгалтыг өгөхийн тулд байршлын зөвшөөрлөө идэвхжүүлнэ үү.",
              ),
            ),
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          },
        );
      }),
    [],
  );

  const handleLookup = useCallback(async () => {
    const code = roomCodeInput.trim().toUpperCase();
    if (!code) {
      setJoinError("Өрөөний код оруулна уу.");
      return;
    }
    setJoinLoading(true);
    try {
      const joinWithLocation = (
        location?: { latitude: number; longitude: number; accuracy?: number },
      ) =>
<<<<<<< 195-enhacement
        apiFetch<
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
                teacherName?: string | null;
                durationMin: number;
                questionCount: number;
                requiresAudioRecording?: boolean;
                enabledCheatDetections?: string[];
              };
            };
          }
=======
        apiRequest<
>>>>>>> main
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
              teacherName?: string | null;
              durationMin: number;
              questionCount: number;
              requiresAudioRecording?: boolean;
              enabledCheatDetections?: string[];
            };
          }
        >("/api/sessions/join", {
          method: "POST",
          body: JSON.stringify({ roomCode: code, location }),
        });

      let payload;
      try {
        payload = await joinWithLocation();
      } catch (err) {
        let parsedCode: string | null = null;
        if (err instanceof Error && err.message) {
          try {
            const parsed = JSON.parse(err.message) as { error?: { code?: string } };
            parsedCode = parsed.error?.code ?? null;
          } catch {
            parsedCode = null;
          }
        }

        if (parsedCode === "LOCATION_REQUIRED") {
          const location = await requestCurrentLocation();
          payload = await joinWithLocation(location);
        } else {
          throw err;
        }
      }
      const data = payload;
      setSessionId(data.sessionId);
      setSelectedExam({
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
  }, [requestCurrentLocation, roomCodeInput]);

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
