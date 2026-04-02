import { useCallback, useMemo, useRef, useState } from "react";

import { reportCheatEvent } from "../services/api";
import { uploadAudioChunkFromUri } from "../services/proctoring-media";
import type { ActiveExamSession, AuthUser } from "@/types/student-app";

type AudioRecorderStatus =
  | "idle"
  | "requesting_permission"
  | "ready"
  | "recording"
  | "uploading"
  | "stopped"
  | "unsupported"
  | "error"
  | "blocked";

type UseExamAudioRecorderArgs = {
  required: boolean;
  session: ActiveExamSession | null;
  student: AuthUser | null;
};

type UseExamAudioRecorderResult = {
  error: string | null;
  isSupported: boolean;
  lastUploadedAt: string | null;
  prepare: () => Promise<boolean>;
  start: () => Promise<boolean>;
  status: AudioRecorderStatus;
  stop: () => Promise<void>;
};

const CHUNK_DURATION_MS = 30_000;
const AUDIO_MIME_TYPE = "audio/m4a";

const getOptionalAudioModule = () => {
  try {
    return (0, eval)("require")("expo-av") as {
      Audio?: {
        Recording: new () => {
          prepareToRecordAsync: (options: unknown) => Promise<void>;
          startAsync: () => Promise<void>;
          stopAndUnloadAsync: () => Promise<void>;
          getURI: () => string | null;
        };
        RecordingOptionsPresets?: { HIGH_QUALITY?: unknown };
        requestPermissionsAsync?: () => Promise<{ granted?: boolean }>;
        setAudioModeAsync?: (options: Record<string, unknown>) => Promise<void>;
      };
    };
  } catch {
    return null;
  }
};

export const useExamAudioRecorder = ({
  required,
  session,
  student,
}: UseExamAudioRecorderArgs): UseExamAudioRecorderResult => {
  const recordingRef = useRef<{
    stopAndUnloadAsync: () => Promise<void>;
    getURI: () => string | null;
  } | null>(null);
  const chunkStartedAtRef = useRef<number | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sequenceNumberRef = useRef(0);
  const [status, setStatus] = useState<AudioRecorderStatus>(
    required ? "idle" : "ready",
  );
  const [error, setError] = useState<string | null>(null);
  const [lastUploadedAt, setLastUploadedAt] = useState<string | null>(null);

  const audioModule = useMemo(() => getOptionalAudioModule(), []);
  const isSupported = Boolean(audioModule?.Audio);

  const flushChunk = useCallback(async () => {
    if (!recordingRef.current || !student || !session || !chunkStartedAtRef.current) {
      return;
    }

    const activeRecording = recordingRef.current;
    recordingRef.current = null;
    const startedAt = chunkStartedAtRef.current;
    chunkStartedAtRef.current = null;

    await activeRecording.stopAndUnloadAsync();
    const uri = activeRecording.getURI();
    if (!uri) {
      throw new Error("Аудио хэсгийн локал файл үүссэнгүй.");
    }

    const endedAt = Date.now();
    const payload = {
      sessionId: session.sessionId,
      mimeType: AUDIO_MIME_TYPE,
      sequenceNumber: sequenceNumberRef.current,
      chunkStartedAt: new Date(startedAt).toISOString(),
      chunkEndedAt: new Date(endedAt).toISOString(),
      durationMs: Math.max(endedAt - startedAt, 1),
      sizeBytes: 1,
    };

    setStatus("uploading");
    await uploadAudioChunkFromUri(student, payload, uri);
    sequenceNumberRef.current += 1;
    setLastUploadedAt(new Date().toISOString());
  }, [session, student]);

  const stop = useCallback(async () => {
    if (chunkTimerRef.current) {
      clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }

    if (recordingRef.current) {
      try {
        await flushChunk();
      } catch (flushError) {
        const message =
          flushError instanceof Error
            ? flushError.message
            : "Сүүлийн аудио хэсгийг илгээж чадсангүй.";
        setError(message);
        setStatus(required ? "blocked" : "error");

        if (student && session) {
          await reportCheatEvent(student, {
            sessionId: session.sessionId,
            eventType: "audio_upload_failed",
            source: "mobile_audio",
            confidence: 0.86,
            metadata: JSON.stringify({ message }),
            details: {
              message,
            },
          }).catch(() => null);
        }
      }
    }

    setError(null);
    setStatus(required ? "stopped" : "ready");
  }, [flushChunk, required, session, student]);

  const prepare = useCallback(async () => {
    if (!required) {
      setStatus("ready");
      return true;
    }

    if (!audioModule?.Audio?.requestPermissionsAsync) {
      setStatus("unsupported");
      setError(
        "Микрофоны бичлэг хийхийн тулд аудио дэмждэг native build шаардлагатай.",
      );
      return false;
    }

    setStatus("requesting_permission");
    const permission = await audioModule.Audio.requestPermissionsAsync();
    if (!permission?.granted) {
      setStatus("error");
      setError("Шалгалт эхлэхээс өмнө микрофоны зөвшөөрөл шаардлагатай.");

      if (student && session) {
        await reportCheatEvent(student, {
          sessionId: session.sessionId,
          eventType: "microphone_permission_denied",
          source: "mobile_audio",
          confidence: 0.99,
          metadata: JSON.stringify({ reason: "permission_denied" }),
          details: {
            reason: "permission_denied",
          },
        }).catch(() => null);
      }
      return false;
    }

    setStatus("ready");
    setError(null);
    return true;
  }, [audioModule, required, session, student]);

  const start = useCallback(async () => {
    if (!required) {
      setStatus("ready");
      return true;
    }

    if (status === "recording" || status === "uploading") {
      return true;
    }

    const prepared = await prepare();
    if (!prepared) {
      return false;
    }

    if (
      !audioModule?.Audio?.Recording ||
      !audioModule.Audio.RecordingOptionsPresets?.HIGH_QUALITY
    ) {
      setStatus("unsupported");
      setError(
        "Микрофоны бичлэг хийхийн тулд аудио дэмждэг native build шаардлагатай.",
      );
      return false;
    }

    try {
      await audioModule.Audio.setAudioModeAsync?.({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new audioModule.Audio.Recording();
      await recording.prepareToRecordAsync(
        audioModule.Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      await recording.startAsync();

      recordingRef.current = recording;
      chunkStartedAtRef.current = Date.now();
      chunkTimerRef.current = setInterval(() => {
        void (async () => {
          try {
            await flushChunk();
            if (!audioModule.Audio?.Recording) {
              return;
            }

            const nextRecording = new audioModule.Audio.Recording();
            await nextRecording.prepareToRecordAsync(
              audioModule.Audio.RecordingOptionsPresets?.HIGH_QUALITY,
            );
            await nextRecording.startAsync();
            recordingRef.current = nextRecording;
            chunkStartedAtRef.current = Date.now();
            setStatus("recording");
          } catch (recordingError) {
            const message =
              recordingError instanceof Error
                ? recordingError.message
                : "Аудио бичлэг тасалдлаа.";
            setError(message);
            setStatus("blocked");

            if (student && session) {
              await reportCheatEvent(student, {
                sessionId: session.sessionId,
                eventType: "audio_recording_interrupted",
                source: "mobile_audio",
                confidence: 0.96,
                metadata: JSON.stringify({ message }),
                details: {
                  message,
                },
              }).catch(() => null);
            }
          }
        })();
      }, CHUNK_DURATION_MS);
      setStatus("recording");
      setError(null);
      return true;
    } catch (startError) {
      const message =
        startError instanceof Error
          ? startError.message
          : "Микрофоны бичлэгийг эхлүүлж чадсангүй.";
      setStatus("error");
      setError(message);
      return false;
    }
  }, [audioModule, flushChunk, prepare, required, session, status, student]);

  return {
    error,
    isSupported,
    lastUploadedAt,
    prepare,
    start,
    status,
    stop,
  };
};
