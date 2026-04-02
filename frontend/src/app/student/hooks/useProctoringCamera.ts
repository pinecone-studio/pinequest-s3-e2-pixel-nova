"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

export type ProctoringEventType =
  | "NO_FACE"
  | "MULTIPLE_FACES"
  | "LOOKING_AWAY"
  | "CAMERA_BLOCKED";

export type ProctoringEvent = {
  confidence: number;
  type: ProctoringEventType;
  duration: number;
  timestamp: string;
  details?: {
    brightness: number | null;
    faceCount: number;
    reason?: "low_brightness" | "sudden_landmark_loss";
    yaw: number | null;
  };
};

export type ProctoringStatus =
  | "idle"
  | "requesting_permission"
  | "loading_models"
  | "running"
  | "stopped"
  | "unsupported"
  | "error";

type DetectionResult = {
  detections?: unknown[];
};

type FaceLandmarkerResult = {
  faceLandmarks?: FacePoint[][];
};

type FaceDetectorInstance = {
  detectForVideo: (
    video: HTMLVideoElement,
    timestampMs: number,
  ) => DetectionResult | Promise<DetectionResult>;
};

type FaceLandmarkerInstance = {
  detectForVideo: (
    video: HTMLVideoElement,
    timestampMs: number,
  ) => FaceLandmarkerResult | Promise<FaceLandmarkerResult>;
};

type FacePoint = {
  x: number;
  y: number;
  z?: number;
};

type VisionModule = {
  FaceDetector: {
    createFromOptions: (
      fileset: unknown,
      options: Record<string, unknown>,
    ) => Promise<FaceDetectorInstance>;
  };
  FaceLandmarker: {
    createFromOptions: (
      fileset: unknown,
      options: Record<string, unknown>,
    ) => Promise<FaceLandmarkerInstance>;
  };
  FilesetResolver: {
    forVisionTasks: (wasmRoot: string) => Promise<unknown>;
  };
};

type Observation = {
  blockedReason: "low_brightness" | "sudden_landmark_loss" | null;
  brightness: number | null;
  faceCount: number;
  yaw: number | null;
};

type TimerState = {
  activeSince: number | null;
  activeFrames: number;
  lastEmittedAt: number | null;
  maxConfidence: number;
};

type UseProctoringCameraOptions = {
  cooldownMs?: number;
  enabled?: boolean;
  onEvent?: (event: ProctoringEvent) => void;
  processEveryMs?: number;
  videoConstraints?: MediaTrackConstraints;
};

type UseProctoringCameraResult = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  error: string | null;
  events: ProctoringEvent[];
  latestObservation: Observation;
  start: () => Promise<void>;
  status: ProctoringStatus;
  stop: () => void;
  videoRef: RefObject<HTMLVideoElement | null>;
};

const MEDIAPIPE_BUNDLE_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.mjs";
const MEDIAPIPE_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const FACE_DETECTOR_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";
const FACE_LANDMARKER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const DEFAULT_PROCESS_EVERY_MS = 400;
const DEFAULT_COOLDOWN_MS = 15_000;
const BRIGHTNESS_THRESHOLD = 28;
const SUDDEN_LOSS_WINDOW_MS = 1_500;

const THRESHOLDS_MS: Record<ProctoringEventType, number> = {
  NO_FACE: 3_000,
  MULTIPLE_FACES: 2_000,
  LOOKING_AWAY: 4_000,
  CAMERA_BLOCKED: 3_000,
};

const MIN_ACTIVE_FRAMES: Record<ProctoringEventType, number> = {
  NO_FACE: 3,
  MULTIPLE_FACES: 3,
  LOOKING_AWAY: 4,
  CAMERA_BLOCKED: 3,
};

const LEFT_EYE_INDICES = [33, 133, 159, 145];
const RIGHT_EYE_INDICES = [263, 362, 386, 374];
const NOSE_TIP_INDEX = 1;

let mediapipePromise:
  | Promise<{
      detector: FaceDetectorInstance;
      landmarker: FaceLandmarkerInstance;
    }>
  | null = null;

const SILENCED_CONSOLE_ERROR_PATTERNS = [
  "Created TensorFlow Lite XNNPACK delegate for CPU.",
];

const averagePoint = (points: FacePoint[]) => {
  if (!points.length) {
    return null;
  }

  const total = points.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
    }),
    { x: 0, y: 0 },
  );

  return {
    x: total.x / points.length,
    y: total.y / points.length,
  };
};

const pickPoints = (landmarks: FacePoint[], indices: number[]) =>
  indices.map((index) => landmarks[index]).filter(Boolean) as FacePoint[];

const clampYawDegrees = (value: number) => {
  return Math.max(-90, Math.min(90, Math.round(value * 10) / 10));
};

const estimateYawDegrees = (faceLandmarks: FacePoint[][]) => {
  if (faceLandmarks.length !== 1) {
    return null;
  }

  const landmarks = faceLandmarks[0];
  const leftEye = averagePoint(pickPoints(landmarks, LEFT_EYE_INDICES));
  const rightEye = averagePoint(pickPoints(landmarks, RIGHT_EYE_INDICES));
  const nose = landmarks[NOSE_TIP_INDEX] ?? null;

  if (!leftEye || !rightEye || !nose) {
    return null;
  }

  const eyeMidX = (leftEye.x + rightEye.x) / 2;
  const eyeDistance = Math.max(Math.abs(rightEye.x - leftEye.x), 0.001);

  return clampYawDegrees(((nose.x - eyeMidX) / eyeDistance) * 60);
};

const getAverageBrightness = (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
) => {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context || video.videoWidth === 0 || video.videoHeight === 0) {
    return null;
  }

  const sampleWidth = 64;
  const sampleHeight = 48;
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  context.drawImage(video, 0, 0, sampleWidth, sampleHeight);

  const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
  let luminanceTotal = 0;
  const pixelCount = pixels.length / 4;

  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    luminanceTotal += red * 0.299 + green * 0.587 + blue * 0.114;
  }

  return Math.round(luminanceTotal / pixelCount);
};

const buildDefaultObservation = (): Observation => ({
  blockedReason: null,
  brightness: null,
  faceCount: 0,
  yaw: null,
});

const shouldSilenceConsoleError = (args: unknown[]) => {
  const message = args
    .map((arg) => (typeof arg === "string" ? arg : ""))
    .join(" ");

  return SILENCED_CONSOLE_ERROR_PATTERNS.some((pattern) =>
    message.includes(pattern),
  );
};

const withSilencedConsoleErrors = async <T>(run: () => Promise<T>) => {
  if (typeof console === "undefined") {
    return run();
  }

  const originalConsoleError = console.error.bind(console);
  let patched = false;

  try {
    console.error = (...args: unknown[]) => {
      if (shouldSilenceConsoleError(args)) {
        return;
      }

      originalConsoleError(...args);
    };
    patched = true;
  } catch {
    return run();
  }

  try {
    return await run();
  } finally {
    if (patched) {
      try {
        console.error = originalConsoleError;
      } catch {
        // Ignore console restore failures in browsers that lock console methods.
      }
    }
  }
};

const clampConfidenceScore = (value: number) =>
  Math.max(0, Math.min(1, Math.round(value * 100) / 100));

const getObservationConfidence = (
  type: ProctoringEventType,
  observation: Observation,
) => {
  switch (type) {
    case "NO_FACE":
      return observation.faceCount === 0 ? 0.92 : 0.25;
    case "MULTIPLE_FACES":
      return observation.faceCount > 1 ? 0.98 : 0.3;
    case "LOOKING_AWAY": {
      const yaw = Math.abs(observation.yaw ?? 0);
      return clampConfidenceScore(Math.min(0.99, 0.55 + yaw / 90));
    }
    case "CAMERA_BLOCKED":
      if (observation.blockedReason === "low_brightness") {
        const brightness = observation.brightness ?? BRIGHTNESS_THRESHOLD;
        return clampConfidenceScore(
          Math.min(0.98, 0.65 + Math.max(BRIGHTNESS_THRESHOLD - brightness, 0) / 60),
        );
      }
      return observation.blockedReason === "sudden_landmark_loss" ? 0.78 : 0.35;
    default:
      return 0.5;
  }
};

const ensureModels = async () => {
  if (!mediapipePromise) {
    mediapipePromise = withSilencedConsoleErrors(async () => {
      const vision = (await import(
        /* webpackIgnore: true */ MEDIAPIPE_BUNDLE_URL
      )) as VisionModule;
      const fileset = await vision.FilesetResolver.forVisionTasks(
        MEDIAPIPE_WASM_URL,
      );

      const [detector, landmarker] = await Promise.all([
        vision.FaceDetector.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: FACE_DETECTOR_MODEL_URL,
          },
          minDetectionConfidence: 0.6,
          runningMode: "VIDEO",
        }),
        vision.FaceLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: FACE_LANDMARKER_MODEL_URL,
          },
          minFaceDetectionConfidence: 0.6,
          minFacePresenceConfidence: 0.6,
          minTrackingConfidence: 0.6,
          numFaces: 2,
          runningMode: "VIDEO",
        }),
      ]);

      return { detector, landmarker };
    });
  }

  return mediapipePromise;
};

const createTimerMap = (): Record<ProctoringEventType, TimerState> => ({
  NO_FACE: { activeSince: null, activeFrames: 0, lastEmittedAt: null, maxConfidence: 0 },
  MULTIPLE_FACES: { activeSince: null, activeFrames: 0, lastEmittedAt: null, maxConfidence: 0 },
  LOOKING_AWAY: { activeSince: null, activeFrames: 0, lastEmittedAt: null, maxConfidence: 0 },
  CAMERA_BLOCKED: { activeSince: null, activeFrames: 0, lastEmittedAt: null, maxConfidence: 0 },
});

const isAbortLikeError = (cause: unknown) => {
  if (typeof DOMException !== "undefined" && cause instanceof DOMException) {
    return cause.name === "AbortError";
  }

  if (!(cause instanceof Error)) {
    return false;
  }

  return (
    cause.name === "AbortError" ||
    cause.message.toLowerCase().includes("operation was aborted")
  );
};

export const useProctoringCamera = (
  options: UseProctoringCameraOptions = {},
): UseProctoringCameraResult => {
  const {
    cooldownMs = DEFAULT_COOLDOWN_MS,
    enabled = false,
    onEvent,
    processEveryMs = DEFAULT_PROCESS_EVERY_MS,
    videoConstraints,
  } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopTimeoutRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const latestCallbackRef = useRef(onEvent);
  const timersRef = useRef(createTimerMap());
  const lastSingleFaceSeenAtRef = useRef<number | null>(null);
  const lastSingleFaceCountRef = useRef(0);

  const [status, setStatus] = useState<ProctoringStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<ProctoringEvent[]>([]);
  const [latestObservation, setLatestObservation] = useState<Observation>(
    buildDefaultObservation(),
  );

  useEffect(() => {
    latestCallbackRef.current = onEvent;
  }, [onEvent]);

  const clearLoop = useCallback(() => {
    if (loopTimeoutRef.current !== null) {
      window.clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    clearLoop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    timersRef.current = createTimerMap();
    lastSingleFaceSeenAtRef.current = null;
    lastSingleFaceCountRef.current = 0;
    setLatestObservation(buildDefaultObservation());
    setStatus((current) =>
      current === "idle" || current === "unsupported" ? current : "stopped",
    );
  }, [clearLoop]);

  const emitEvent = useCallback((event: ProctoringEvent) => {
    setEvents((current) => [event, ...current].slice(0, 20));
    latestCallbackRef.current?.(event);
  }, []);

  const updateTimer = useCallback(
    (
      type: ProctoringEventType,
      isActive: boolean,
      now: number,
      observation: Observation,
    ) => {
      const timer = timersRef.current[type];

      if (!isActive) {
        timer.activeSince = null;
        timer.activeFrames = 0;
        timer.maxConfidence = 0;
        return;
      }

      if (timer.activeSince === null) {
        timer.activeSince = now;
      }
      timer.activeFrames += 1;
      timer.maxConfidence = Math.max(
        timer.maxConfidence,
        getObservationConfidence(type, observation),
      );

      const duration = now - timer.activeSince;
      if (
        duration < THRESHOLDS_MS[type] ||
        timer.activeFrames < MIN_ACTIVE_FRAMES[type]
      ) {
        return;
      }

      if (
        timer.lastEmittedAt !== null &&
        now - timer.lastEmittedAt < cooldownMs
      ) {
        return;
      }

      timer.lastEmittedAt = now;
      timer.activeSince = now;
      timer.activeFrames = 0;

      emitEvent({
        confidence: clampConfidenceScore(timer.maxConfidence),
        type,
        duration,
        timestamp: new Date(now).toISOString(),
        details: {
          brightness: observation.brightness,
          faceCount: observation.faceCount,
          reason: observation.blockedReason ?? undefined,
          yaw: observation.yaw,
        },
      });
      timer.maxConfidence = 0;
    },
    [cooldownMs, emitEvent],
  );

  const processFrame = useCallback(
    async (
      detector: FaceDetectorInstance,
      landmarker: FaceLandmarkerInstance,
    ) => {
      if (!runningRef.current || !videoRef.current || !canvasRef.current) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        loopTimeoutRef.current = window.setTimeout(() => {
          void processFrame(detector, landmarker);
        }, processEveryMs);
        return;
      }

      const timestampMs = performance.now();
      const [detectorResult, landmarkerResult] = await Promise.all([
        detector.detectForVideo(video, timestampMs),
        landmarker.detectForVideo(video, timestampMs),
      ]);

      const faceLandmarks = landmarkerResult.faceLandmarks ?? [];
      const detectorFaceCount = detectorResult.detections?.length ?? 0;
      const landmarkFaceCount = faceLandmarks.length;
      const faceCount = Math.max(detectorFaceCount, landmarkFaceCount);
      const yaw = estimateYawDegrees(faceLandmarks);
      const brightness = getAverageBrightness(video, canvas);
      const now = Date.now();

      if (faceCount === 1) {
        lastSingleFaceSeenAtRef.current = now;
      }

      const hadRecentSingleFace =
        lastSingleFaceSeenAtRef.current !== null &&
        now - lastSingleFaceSeenAtRef.current <= SUDDEN_LOSS_WINDOW_MS;
      const suddenLandmarkLoss =
        faceCount === 0 &&
        lastSingleFaceCountRef.current === 1 &&
        hadRecentSingleFace;
      const lowBrightness =
        brightness !== null && brightness < BRIGHTNESS_THRESHOLD;
      const blockedReason = lowBrightness
        ? "low_brightness"
        : suddenLandmarkLoss
          ? "sudden_landmark_loss"
          : null;

      const observation: Observation = {
        blockedReason,
        brightness,
        faceCount,
        yaw,
      };

      setLatestObservation(observation);

      updateTimer(
        "CAMERA_BLOCKED",
        blockedReason !== null,
        now,
        observation,
      );
      updateTimer(
        "NO_FACE",
        faceCount === 0 && blockedReason === null,
        now,
        observation,
      );
      updateTimer("MULTIPLE_FACES", faceCount > 1, now, observation);
      updateTimer(
        "LOOKING_AWAY",
        faceCount === 1 && yaw !== null && Math.abs(yaw) > 25,
        now,
        observation,
      );

      lastSingleFaceCountRef.current = faceCount;

      if (runningRef.current) {
        loopTimeoutRef.current = window.setTimeout(() => {
          void processFrame(detector, landmarker);
        }, processEveryMs);
      }
    },
    [processEveryMs, updateTimer],
  );

  const start = useCallback(async () => {
    if (runningRef.current) {
      return;
    }

    if (
      typeof window === "undefined" ||
      !window.isSecureContext ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setStatus("unsupported");
      setError("Энэ хөтөч дээр аюулгүй камерын хандалт ашиглах боломжгүй байна.");
      return;
    }

    setError(null);
    setStatus("requesting_permission");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
          ...videoConstraints,
        },
      });

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        throw new Error("Камерын видео элемент холбогдоогүй байна.");
      }

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      setStatus("loading_models");
      const { detector, landmarker } = await ensureModels();

      runningRef.current = true;
      timersRef.current = createTimerMap();
      setStatus("running");
      void processFrame(detector, landmarker);
    } catch (cause) {
      if (isAbortLikeError(cause)) {
        stop();
        setError(null);
        setStatus("stopped");
        return;
      }

      console.error("use-proctoring-camera-start-failed", cause);
      stop();
      setStatus("error");
      setError(
        cause instanceof Error
          ? cause.message
          : "Хөтөч доторх камерын хяналтыг эхлүүлж чадсангүй.",
      );
    }
  }, [processFrame, stop, videoConstraints]);

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

  return {
    canvasRef,
    error,
    events,
    latestObservation,
    start,
    status,
    stop,
    videoRef,
  };
};
