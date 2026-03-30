"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { reportCheatEvent } from "@/api/cheat";
import type { User } from "@/lib/examGuard";
import {
  createInitialDesktopCameraState,
  estimateDesktopCameraObservation,
  evaluateDesktopCameraObservation,
  getDesktopCameraStatusLabel,
  resetDesktopCameraActiveTimers,
  type FacePoint,
} from "../hooks/desktop-camera-proctoring";

type DesktopExamCameraCardProps = {
  sessionId: string | null;
  showWarning: (message: string) => void;
  user: User | null;
  view: "dashboard" | "exam" | "result";
};

type FaceLandmarkerResult = {
  faceLandmarks?: FacePoint[][];
};

type FaceLandmarkerInstance = {
  detectForVideo: (video: HTMLVideoElement, timestamp: number) => FaceLandmarkerResult;
};

const MEDIAPIPE_BUNDLE_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.mjs";
const MEDIAPIPE_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const FACE_LANDMARKER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const PROCESS_EVERY_MS = 300;

let landmarkerPromise: Promise<FaceLandmarkerInstance> | null = null;

const isDesktopViewport = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(min-width: 1024px)").matches;
};

const loadFaceLandmarker = async (): Promise<FaceLandmarkerInstance> => {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = (await import(
        /* webpackIgnore: true */ MEDIAPIPE_BUNDLE_URL
      )) as {
        FaceLandmarker: {
          createFromOptions: (
            visionFileset: unknown,
            options: Record<string, unknown>,
          ) => Promise<FaceLandmarkerInstance>;
        };
        FilesetResolver: {
          forVisionTasks: (wasmRoot: string) => Promise<unknown>;
        };
      };

      const fileset = await vision.FilesetResolver.forVisionTasks(
        MEDIAPIPE_WASM_URL,
      );

      return vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: FACE_LANDMARKER_MODEL_URL,
        },
        numFaces: 2,
        runningMode: "VIDEO",
        minFaceDetectionConfidence: 0.6,
        minFacePresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });
    })();
  }

  return landmarkerPromise;
};

export default function DesktopExamCameraCard({
  sessionId,
  showWarning,
  user,
  view,
}: DesktopExamCameraCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastProcessedAtRef = useRef(0);
  const cameraStateRef = useRef(createInitialDesktopCameraState());
  const [status, setStatus] = useState<
    | "idle"
    | "unsupported"
    | "requesting_permission"
    | "loading_model"
    | "monitoring"
    | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState(
    "Desktop camera monitoring exam эхлэхэд идэвхжинэ.",
  );
  const [debugLabel, setDebugLabel] = useState("Faces: 0 | direction: unclear | yaw: n/a | pitch: n/a");

  const stopMonitoring = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    cameraStateRef.current = resetDesktopCameraActiveTimers(cameraStateRef.current);
    lastProcessedAtRef.current = 0;
  }, []);

  useEffect(() => {
    if (view !== "exam") {
      stopMonitoring();
      setStatus("idle");
      setStatusMessage("Desktop camera monitoring exam эхлэхэд идэвхжинэ.");
      return;
    }

    if (!isDesktopViewport()) {
      stopMonitoring();
      setStatus("unsupported");
      setStatusMessage("Desktop web дээр нээж camera monitoring ашиглана уу.");
      return;
    }

    if (
      typeof window === "undefined" ||
      !window.isSecureContext ||
      !navigator.mediaDevices?.getUserMedia ||
      !sessionId ||
      !user
    ) {
      stopMonitoring();
      setStatus("unsupported");
      setStatusMessage(
        "Camera monitoring secure browser environment шаардлагатай байна.",
      );
      return;
    }

    let cancelled = false;

    const startMonitoring = async () => {
      try {
        setStatus("requesting_permission");
        setStatusMessage("Camera permission авч байна...");

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.playsInline = true;
          await videoRef.current.play().catch(() => null);
        }

        setStatus("loading_model");
        setStatusMessage("Face monitoring model ачаалж байна...");

        const landmarker = await loadFaceLandmarker();

        if (cancelled) {
          return;
        }

        setStatus("monitoring");
        setStatusMessage("Desktop camera monitoring идэвхтэй.");

        const processFrame = async () => {
          if (
            cancelled ||
            !videoRef.current ||
            videoRef.current.readyState < 2 ||
            !sessionId
          ) {
            rafRef.current = window.requestAnimationFrame(() => {
              void processFrame();
            });
            return;
          }

          const now = performance.now();
          if (now - lastProcessedAtRef.current >= PROCESS_EVERY_MS) {
            lastProcessedAtRef.current = now;

            const result = landmarker.detectForVideo(videoRef.current, now);
            const observation = estimateDesktopCameraObservation(
              result.faceLandmarks ?? [],
              Date.now(),
            );

            setDebugLabel(getDesktopCameraStatusLabel(observation));

            const { events, state } = evaluateDesktopCameraObservation(
              cameraStateRef.current,
              observation,
            );
            cameraStateRef.current = state;

            for (const event of events) {
              showWarning(event.localMessage);
              void reportCheatEvent(
                {
                  sessionId,
                  eventType: event.eventType,
                  metadata: event.metadata,
                },
                user,
              );
            }
          }

          rafRef.current = window.requestAnimationFrame(() => {
            void processFrame();
          });
        };

        rafRef.current = window.requestAnimationFrame(() => {
          void processFrame();
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("desktop-camera-proctoring-failed", error);
        stopMonitoring();
        setStatus("error");
        setStatusMessage(
          "Camera permission эсвэл AI monitoring эхлүүлэхэд алдаа гарлаа.",
        );
      }
    };

    void startMonitoring();

    return () => {
      cancelled = true;
      stopMonitoring();
    };
  }, [sessionId, showWarning, stopMonitoring, user, view]);

  return (
    <section className="overflow-hidden rounded-[24px] border border-[#d8e1f0] bg-white shadow-[0_18px_40px_-32px_rgba(15,23,42,0.25)]">
      <div className="flex items-center justify-between border-b border-[#e9eef7] px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Desktop camera</p>
          <p className="text-xs text-slate-500">Browser AI monitoring</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
            status === "monitoring"
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
        <div className="overflow-hidden rounded-[20px] border border-[#d8e1f0] bg-[#0f172a]">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="aspect-video w-full object-cover"
          />
        </div>

        <p className="mt-3 text-sm font-medium text-slate-800">{statusMessage}</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          `face_missing`, `multiple_faces`, `looking_away`, `looking_down`
          event-үүдийг desktop browser camera-аас backend руу илгээнэ.
        </p>
        <p className="mt-2 text-[11px] text-slate-400">{debugLabel}</p>
      </div>
    </section>
  );
}
