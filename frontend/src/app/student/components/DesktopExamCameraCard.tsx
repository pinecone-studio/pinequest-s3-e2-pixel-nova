"use client";

import { useCallback, useMemo } from "react";
import { reportCheatEvent } from "@/api/cheat";
import type { User } from "@/lib/examGuard";
import {
  useProctoringCamera,
  type ProctoringEvent,
} from "../hooks/useProctoringCamera";

type DesktopExamCameraCardProps = {
  sessionId: string | null;
  showWarning: (message: string) => void;
  user: User | null;
  view: "dashboard" | "exam" | "result";
};

const EVENT_LABELS: Record<ProctoringEvent["type"], string> = {
  NO_FACE: "No face detected",
  MULTIPLE_FACES: "Multiple faces detected",
  LOOKING_AWAY: "Looking away for too long",
  CAMERA_BLOCKED: "Camera appears blocked",
};

const mapEventTypeToBackend = (type: ProctoringEvent["type"]) => {
  switch (type) {
    case "NO_FACE":
      return "face_missing";
    case "MULTIPLE_FACES":
      return "multiple_faces";
    case "LOOKING_AWAY":
      return "looking_away";
    case "CAMERA_BLOCKED":
      return "camera_blocked";
    default:
      return "face_missing";
  }
};

const formatDuration = (durationMs: number) => {
  return `${(durationMs / 1000).toFixed(1)}s`;
};

const formatBrightness = (brightness: number | null) => {
  if (brightness === null) {
    return "n/a";
  }

  return `${brightness}/255`;
};

export default function DesktopExamCameraCard({
  sessionId,
  showWarning,
  user,
  view,
}: DesktopExamCameraCardProps) {
  const handleEvent = useCallback(
    (event: ProctoringEvent) => {
      showWarning(`${EVENT_LABELS[event.type]} (${formatDuration(event.duration)})`);

      if (!sessionId || !user) {
        return;
      }

      void reportCheatEvent(
        {
          sessionId,
          eventType: mapEventTypeToBackend(event.type),
          source: "browser_camera",
          confidence: event.confidence,
          details: {
            durationMs: event.duration,
            timestamp: event.timestamp,
            ...event.details,
          },
          metadata: JSON.stringify({
            source: "browser_camera",
            confidence: event.confidence,
            durationMs: event.duration,
            timestamp: event.timestamp,
            ...event.details,
          }),
        },
        user,
      ).catch((error) => {
        console.error("camera-event-log-failed", error);
      });
    },
    [sessionId, showWarning, user],
  );

  const { canvasRef, error, events, latestObservation, start, status, stop, videoRef } =
    useProctoringCamera({
      cooldownMs: 20_000,
      enabled: view === "exam",
      onEvent: handleEvent,
      processEveryMs: 400,
    });

  const latestEvent = events[0] ?? null;
  const yawLabel = useMemo(() => {
    if (latestObservation.yaw === null) {
      return "n/a";
    }

    return `${latestObservation.yaw.toFixed(1)}°`;
  }, [latestObservation.yaw]);

  return (
    <section className="overflow-hidden rounded-[24px] border border-[#d8e1f0] bg-white shadow-[0_18px_40px_-32px_rgba(15,23,42,0.25)]">
      <div className="flex items-center justify-between border-b border-[#e9eef7] px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Exam proctoring</p>
          <p className="text-xs text-slate-500">
            Browser-only webcam monitoring with local frame analysis
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
            status === "running"
              ? "bg-[#eefcf3] text-[#0f9960]"
              : status === "error" || status === "unsupported"
                ? "bg-[#fff1eb] text-[#d25b2b]"
                : "bg-[#edf3ff] text-[#355cde]"
          }`}
        >
          {status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="p-4">
        <video ref={videoRef} autoPlay muted playsInline className="sr-only" />
        <canvas ref={canvasRef} className="sr-only" />

        <div className="rounded-[20px] border border-[#d8e1f0] bg-[#f8fbff] p-4">
          <div className="grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#d8e1f0] bg-white px-3 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Face Count
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {latestObservation.faceCount}
              </div>
            </div>
            <div className="rounded-2xl border border-[#d8e1f0] bg-white px-3 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Estimated Yaw
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {yawLabel}
              </div>
            </div>
            <div className="rounded-2xl border border-[#d8e1f0] bg-white px-3 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Brightness
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {formatBrightness(latestObservation.brightness)}
              </div>
            </div>
            <div className="rounded-2xl border border-[#d8e1f0] bg-white px-3 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Last Event
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {latestEvent ? EVENT_LABELS[latestEvent.type] : "No suspicious events"}
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Only local analysis runs in the browser. No images or video are stored or
            uploaded.
          </p>
          {latestObservation.blockedReason && (
            <p className="mt-2 text-xs font-medium text-[#d25b2b]">
              Camera blocked signal: {latestObservation.blockedReason.replace(/_/g, " ")}
            </p>
          )}
          {error && (
            <p className="mt-2 text-xs font-medium text-[#d25b2b]">{error}</p>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="rounded-xl border border-[#d8e1f0] bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-[#f8fbff]"
            onClick={() => {
              stop();
              void start();
            }}
          >
            Restart camera
          </button>
          <button
            type="button"
            className="rounded-xl border border-[#d8e1f0] bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-[#f8fbff]"
            onClick={stop}
          >
            Stop
          </button>
        </div>

        {events.length > 0 && (
          <div className="mt-4 space-y-2">
            {events.slice(0, 3).map((event) => (
              <div
                key={`${event.type}-${event.timestamp}`}
                className="rounded-2xl border border-[#e9eef7] bg-[#fbfdff] px-3 py-2 text-xs text-slate-600"
              >
                <div className="font-semibold text-slate-900">
                  {EVENT_LABELS[event.type]}
                </div>
                <div className="mt-1">
                  Duration: {formatDuration(event.duration)}
                  {event.details?.yaw !== null && event.details?.yaw !== undefined
                    ? ` · yaw ${event.details.yaw.toFixed(1)}°`
                    : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
