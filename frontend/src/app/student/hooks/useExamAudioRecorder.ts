"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createAudioUploadUrl,
  finalizeAudioUpload,
  reportCheatEvent,
  type AudioChunkUploadPayload,
} from "@/api/cheat";
import type { User } from "@/lib/examGuard";

const CHUNK_DURATION_MS = 30_000;
const MAX_CONSECUTIVE_UPLOAD_FAILURES = 3;
const ELAPSED_REFRESH_MS = 500;

export type ExamAudioStatus =
  | "idle"
  | "requesting_permission"
  | "starting"
  | "recording"
  | "uploading"
  | "blocked"
  | "error"
  | "stopped"
  | "unsupported";

type UseExamAudioRecorderParams = {
  enabled: boolean;
  required: boolean;
  sessionId: string | null;
  user: User | null;
  onBlockingIssue?: (message: string) => void;
};

type UseExamAudioRecorderResult = {
  chunkCount: number;
  currentChunkElapsedMs: number;
  lastError: string | null;
  lastUploadedAt: string | null;
  mimeType: string | null;
  restart: () => Promise<void>;
  status: ExamAudioStatus;
  stop: () => void;
};

const AUDIO_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
];

const parseApiErrorCode = (error: unknown) => {
  if (!(error instanceof Error) || !error.message) return null;

  try {
    const parsed = JSON.parse(error.message) as {
      error?: {
        code?: string;
      };
    };
    return parsed.error?.code ?? null;
  } catch {
    return null;
  }
};

export const classifyAudioUploadFailure = (error: unknown) => {
  const errorCode = parseApiErrorCode(error);

  if (errorCode === "R2_UPLOAD_NOT_CONFIGURED") {
    return {
      blocking: false,
      nextStatus: "unsupported" as const,
      message:
        "Audio uploads are not configured on the server right now. The exam can continue without blocking audio upload.",
    };
  }

  return {
    blocking: true,
    nextStatus: null,
    message: null,
  };
};

const getSupportedMimeType = () => {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return null;
  }

  for (const candidate of AUDIO_MIME_CANDIDATES) {
    if (typeof MediaRecorder.isTypeSupported === "function") {
      if (MediaRecorder.isTypeSupported(candidate)) {
        return candidate;
      }
      continue;
    }

    return candidate;
  }

  return null;
};

const uploadAudioChunk = async ({
  blob,
  chunkEndedAt,
  chunkStartedAt,
  mimeType,
  sequenceNumber,
  sessionId,
  user,
}: AudioChunkUploadPayload & {
  blob: Blob;
  user: User;
}) => {
  const upload = await createAudioUploadUrl(
    {
      sessionId,
      mimeType,
      sequenceNumber,
      chunkStartedAt,
      chunkEndedAt,
      durationMs: Math.max(
        new Date(chunkEndedAt).getTime() - new Date(chunkStartedAt).getTime(),
        1,
      ),
      sizeBytes: blob.size,
    },
    user,
  );

  const response = await fetch(upload.uploadUrl, {
    method: "PUT",
    headers: upload.uploadHeaders,
    body: blob,
  });

  if (!response.ok) {
    throw new Error(`Аудио илгээхэд алдаа гарлаа (төлөв: ${response.status}).`);
  }

  await finalizeAudioUpload(
    {
      objectKey: upload.objectKey,
      sessionId,
      mimeType,
      sequenceNumber,
      chunkStartedAt,
      chunkEndedAt,
      durationMs: Math.max(
        new Date(chunkEndedAt).getTime() - new Date(chunkStartedAt).getTime(),
        1,
      ),
      sizeBytes: blob.size,
    },
    user,
  );
};

export const useExamAudioRecorder = ({
  enabled,
  required,
  sessionId,
  user,
  onBlockingIssue,
}: UseExamAudioRecorderParams): UseExamAudioRecorderResult => {
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunkStartRef = useRef<number | null>(null);
  const sequenceNumberRef = useRef(0);
  const uploadFailureCountRef = useRef(0);
  const mountedRef = useRef(true);
  const latestBlockingCallbackRef = useRef(onBlockingIssue);
  const [status, setStatus] = useState<ExamAudioStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const [chunkCount, setChunkCount] = useState(0);
  const [lastUploadedAt, setLastUploadedAt] = useState<string | null>(null);
  const [currentChunkElapsedMs, setCurrentChunkElapsedMs] = useState(0);

  const mimeType = useMemo(() => getSupportedMimeType(), []);

  useEffect(() => {
    latestBlockingCallbackRef.current = onBlockingIssue;
  }, [onBlockingIssue]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    sequenceNumberRef.current = 0;
    uploadFailureCountRef.current = 0;
    setChunkCount(0);
    setLastUploadedAt(null);
    setLastError(null);
  }, [sessionId]);

  const stop = useCallback((nextStatus: ExamAudioStatus = "stopped") => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    chunkStartRef.current = null;
    setCurrentChunkElapsedMs(0);
    setStatus((current) => (current === "unsupported" ? current : nextStatus));
  }, []);

  const emitBlockingIssue = useCallback(
    async (message: string, eventType: string, details?: Record<string, unknown>) => {
      setLastError(message);
      setStatus("blocked");

      if (sessionId && user) {
        await reportCheatEvent(
          {
            sessionId,
            eventType,
            source: "browser_audio",
            confidence: 0.99,
            details: {
              ...(details ?? {}),
              message,
            } as Record<string, string | number | boolean | null>,
            metadata: JSON.stringify({
              ...(details ?? {}),
              message,
              source: "browser_audio",
            }),
          },
          user,
        ).catch(() => null);
      }

      latestBlockingCallbackRef.current?.(message);
    },
    [sessionId, user],
  );

  const handleUploadFailure = useCallback(
    async (message: string, details?: Record<string, unknown>) => {
      const failure = classifyAudioUploadFailure(details?.rawError ?? null);

      if (!failure.blocking) {
        setLastError(failure.message);
        stop(failure.nextStatus);
        return;
      }

      uploadFailureCountRef.current += 1;
      setLastError(message);

      if (sessionId && user) {
        await reportCheatEvent(
          {
            sessionId,
            eventType: "audio_upload_failed",
            source: "browser_audio",
            confidence: 0.85,
            details: {
              attempt: uploadFailureCountRef.current,
              ...(details ?? {}),
            } as Record<string, string | number | boolean | null>,
            metadata: JSON.stringify({
              attempt: uploadFailureCountRef.current,
              ...(details ?? {}),
              source: "browser_audio",
            }),
          },
          user,
        ).catch(() => null);
      }

      if (uploadFailureCountRef.current >= MAX_CONSECUTIVE_UPLOAD_FAILURES) {
        await emitBlockingIssue(
          "Аудио илгээх оролдлого дахин дахин амжилтгүй боллоо. Микрофоны бичлэггүйгээр шалгалтыг үргэлжлүүлэх боломжгүй.",
          "audio_recording_interrupted",
          {
            reason: "upload_failure_threshold",
            failures: uploadFailureCountRef.current,
          },
        );
        stop();
      }
    },
    [emitBlockingIssue, sessionId, stop, user],
  );

  const start = useCallback(async () => {
    if (!enabled) {
      return;
    }

    if (
      typeof window === "undefined" ||
      !window.isSecureContext ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setStatus("unsupported");
      setLastError("Энэ хөтөч дээр аюулгүй микрофоны бичлэг ашиглах боломжгүй байна.");
      if (required) {
        await emitBlockingIssue(
          "Энэ хөтөч дээр аюулгүй микрофоны бичлэг ашиглах боломжгүй байна.",
          "microphone_permission_denied",
          { reason: "unsupported_browser" },
        );
      }
      return;
    }

    if (!mimeType) {
      setStatus("unsupported");
      setLastError("Энэ хөтөч зөвхөн аудио бичлэгийн форматыг дэмжихгүй байна.");
      if (required) {
        await emitBlockingIssue(
          "Энэ хөтөч зөвхөн аудио бичлэгийн форматыг дэмжихгүй байна.",
          "microphone_permission_denied",
          { reason: "unsupported_mime_type" },
        );
      }
      return;
    }

    setLastError(null);
    setStatus("requesting_permission");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: false,
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      uploadFailureCountRef.current = 0;
      setStatus("starting");

      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      chunkStartRef.current = Date.now();

      for (const track of stream.getAudioTracks()) {
        track.addEventListener("ended", () => {
          void emitBlockingIssue(
            "Шалгалтын үеэр микрофоны хандалт тасарлаа.",
            "audio_recording_interrupted",
            { reason: "track_ended" },
          );
          stop();
        });
      }

      recorder.addEventListener("dataavailable", (event) => {
        const startedAt = chunkStartRef.current;
        const endedAt = Date.now();
        chunkStartRef.current = endedAt;

        if (!event.data || event.data.size === 0 || !sessionId || !user || !startedAt) {
          return;
        }

        setStatus("uploading");

        void uploadAudioChunk({
          blob: event.data,
          chunkStartedAt: new Date(startedAt).toISOString(),
          chunkEndedAt: new Date(endedAt).toISOString(),
          mimeType,
          sequenceNumber: sequenceNumberRef.current,
          sessionId,
          user,
          durationMs: Math.max(endedAt - startedAt, 1),
          sizeBytes: event.data.size,
        })
          .then(() => {
            uploadFailureCountRef.current = 0;
            sequenceNumberRef.current += 1;
            setChunkCount(sequenceNumberRef.current);
            setLastUploadedAt(new Date().toISOString());
            setStatus("recording");
          })
          .catch((error) => {
            void handleUploadFailure(
              error instanceof Error ? error.message : "Аудио илгээхэд алдаа гарлаа.",
              {
                rawError: error,
                sequenceNumber: sequenceNumberRef.current,
              },
            );
          });
      });

      recorder.addEventListener("error", () => {
        void emitBlockingIssue(
          "Шалгалтын үеэр аудио бичлэг хийхэд алдаа гарлаа.",
          "audio_recording_interrupted",
          { reason: "recorder_error" },
        );
        stop();
      });

      recorder.start(CHUNK_DURATION_MS);
      setStatus("recording");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Микрофоны хандалтыг эхлүүлж чадсангүй.";
      setStatus("error");
      setLastError(message);
      if (required) {
        await emitBlockingIssue(message, "microphone_permission_denied", {
          reason: "permission_denied",
        });
      }
    }
  }, [emitBlockingIssue, enabled, handleUploadFailure, mimeType, required, sessionId, stop, user]);

  const restart = useCallback(async () => {
    stop();
    await start();
  }, [start, stop]);

  useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }

    void start();

    return () => {
      stop();
    };
  }, [enabled, start, stop]);

  useEffect(() => {
    if (!enabled || status !== "recording") {
      setCurrentChunkElapsedMs(0);
      return;
    }

    const timer = window.setInterval(() => {
      const chunkStartedAt = chunkStartRef.current;
      if (!chunkStartedAt) {
        setCurrentChunkElapsedMs(0);
        return;
      }
      setCurrentChunkElapsedMs(Date.now() - chunkStartedAt);
    }, ELAPSED_REFRESH_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [enabled, status]);

  return {
    chunkCount,
    currentChunkElapsedMs,
    lastError,
    lastUploadedAt,
    mimeType,
    restart,
    status,
    stop,
  };
};
