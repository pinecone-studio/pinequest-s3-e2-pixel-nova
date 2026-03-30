export type DesktopCameraEventType =
  | "face_missing"
  | "multiple_faces"
  | "looking_away"
  | "looking_down";

export type DesktopLookingDirection =
  | "forward"
  | "left"
  | "right"
  | "down"
  | "up"
  | "unclear";

export type FacePoint = {
  x: number;
  y: number;
  z?: number;
};

export type DesktopCameraObservation = {
  direction: DesktopLookingDirection;
  faceCount: number;
  pitch: number | null;
  timestamp: number;
  yaw: number | null;
};

export type DesktopCameraEvent = {
  eventType: DesktopCameraEventType;
  localMessage: string;
  metadata: string;
};

export type DesktopCameraState = {
  activeSince: Partial<Record<DesktopCameraEventType, number>>;
  lastTriggeredAt: Partial<Record<DesktopCameraEventType, number>>;
};

type RuleDefinition = {
  localMessage: string;
  predicate: (observation: DesktopCameraObservation) => boolean;
  threshold: number;
};

const LEFT_EYE_INDICES = [33, 133, 159, 145];
const RIGHT_EYE_INDICES = [263, 362, 386, 374];
const MOUTH_INDICES = [13, 14, 78, 308];
const NOSE_TIP_INDEX = 1;

const COOLDOWN_MS = 15_000;
const FACE_MISSING_THRESHOLD_MS = 2_200;
const MULTIPLE_FACES_THRESHOLD_MS = 1_200;
const LOOKING_AWAY_THRESHOLD_MS = 1_800;
const LOOKING_DOWN_THRESHOLD_MS = 1_800;
const YAW_SIDE_THRESHOLD = 22;
const PITCH_DOWN_THRESHOLD = 64;
const PITCH_UP_THRESHOLD = 24;

const RULES: Record<DesktopCameraEventType, RuleDefinition> = {
  face_missing: {
    threshold: FACE_MISSING_THRESHOLD_MS,
    localMessage: "Камер таны нүүрийг олсонгүй. Камерын өмнө буцаж сууна уу.",
    predicate: (observation) => observation.faceCount === 0,
  },
  multiple_faces: {
    threshold: MULTIPLE_FACES_THRESHOLD_MS,
    localMessage: "Камерт нэгээс олон хүн илэрлээ.",
    predicate: (observation) => observation.faceCount > 1,
  },
  looking_away: {
    threshold: LOOKING_AWAY_THRESHOLD_MS,
    localMessage: "Та дэлгэцээс хэт удаан хажуу тийш харж байна.",
    predicate: (observation) =>
      observation.faceCount === 1 &&
      (observation.direction === "left" || observation.direction === "right"),
  },
  looking_down: {
    threshold: LOOKING_DOWN_THRESHOLD_MS,
    localMessage: "Та хэт удаан доош харж байна.",
    predicate: (observation) =>
      observation.faceCount === 1 && observation.direction === "down",
  },
};

const EVENT_ORDER: DesktopCameraEventType[] = [
  "face_missing",
  "multiple_faces",
  "looking_away",
  "looking_down",
];

const averagePoint = (points: FacePoint[]) => {
  if (!points.length) {
    return null;
  }

  const totals = points.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
    }),
    { x: 0, y: 0 },
  );

  return {
    x: totals.x / points.length,
    y: totals.y / points.length,
  };
};

const pickPoints = (landmarks: FacePoint[], indices: number[]) =>
  indices.map((index) => landmarks[index]).filter(Boolean) as FacePoint[];

const roundMetric = (value: number | null) =>
  value === null ? null : Math.round(value * 100) / 100;

const getDirection = (yaw: number | null, pitch: number | null): DesktopLookingDirection => {
  if (yaw === null || pitch === null) {
    return "unclear";
  }

  if (pitch >= PITCH_DOWN_THRESHOLD) {
    return "down";
  }

  if (pitch <= PITCH_UP_THRESHOLD) {
    return "up";
  }

  if (yaw >= YAW_SIDE_THRESHOLD) {
    return "right";
  }

  if (yaw <= -YAW_SIDE_THRESHOLD) {
    return "left";
  }

  return "forward";
};

export const createInitialDesktopCameraState = (): DesktopCameraState => ({
  activeSince: {},
  lastTriggeredAt: {},
});

export const resetDesktopCameraActiveTimers = (
  currentState: DesktopCameraState,
): DesktopCameraState => ({
  activeSince: {},
  lastTriggeredAt: { ...currentState.lastTriggeredAt },
});

export const getDesktopCameraStatusLabel = (observation: DesktopCameraObservation) =>
  `Faces: ${observation.faceCount} | direction: ${observation.direction} | yaw: ${
    observation.yaw === null ? "n/a" : observation.yaw.toFixed(1)
  } | pitch: ${observation.pitch === null ? "n/a" : observation.pitch.toFixed(1)}`;

export const buildDesktopCameraMetadata = (
  eventType: DesktopCameraEventType,
  observation: DesktopCameraObservation,
  durationMs: number,
) =>
  JSON.stringify({
    source: "desktop_camera",
    platform: "web",
    faceCount: observation.faceCount,
    yaw: eventType === "face_missing" ? null : roundMetric(observation.yaw),
    pitch: eventType === "face_missing" ? null : roundMetric(observation.pitch),
    durationMs,
    threshold: RULES[eventType].threshold,
    cameraPosition: "front",
    lookingDirection: observation.direction,
  });

export const evaluateDesktopCameraObservation = (
  currentState: DesktopCameraState,
  observation: DesktopCameraObservation,
): { events: DesktopCameraEvent[]; state: DesktopCameraState } => {
  const nextState: DesktopCameraState = {
    activeSince: { ...currentState.activeSince },
    lastTriggeredAt: { ...currentState.lastTriggeredAt },
  };
  const events: DesktopCameraEvent[] = [];

  for (const eventType of EVENT_ORDER) {
    const rule = RULES[eventType];
    const isActive = rule.predicate(observation);

    if (!isActive) {
      delete nextState.activeSince[eventType];
      continue;
    }

    const startedAt = nextState.activeSince[eventType] ?? observation.timestamp;
    nextState.activeSince[eventType] = startedAt;

    const durationMs = observation.timestamp - startedAt;
    const lastTriggeredAt = nextState.lastTriggeredAt[eventType];

    if (durationMs < rule.threshold) {
      continue;
    }

    if (
      lastTriggeredAt !== undefined &&
      observation.timestamp - lastTriggeredAt < COOLDOWN_MS
    ) {
      continue;
    }

    nextState.lastTriggeredAt[eventType] = observation.timestamp;
    events.push({
      eventType,
      localMessage: rule.localMessage,
      metadata: buildDesktopCameraMetadata(eventType, observation, durationMs),
    });
  }

  return { events, state: nextState };
};

export const estimateDesktopCameraObservation = (
  faceLandmarks: FacePoint[][],
  timestamp: number,
): DesktopCameraObservation => {
  const faceCount = faceLandmarks.length;

  if (faceCount !== 1) {
    return {
      direction: "unclear",
      faceCount,
      pitch: null,
      timestamp,
      yaw: null,
    };
  }

  const landmarks = faceLandmarks[0];
  const leftEye = averagePoint(pickPoints(landmarks, LEFT_EYE_INDICES));
  const rightEye = averagePoint(pickPoints(landmarks, RIGHT_EYE_INDICES));
  const mouth = averagePoint(pickPoints(landmarks, MOUTH_INDICES));
  const nose = landmarks[NOSE_TIP_INDEX] ?? null;

  if (!leftEye || !rightEye || !mouth || !nose) {
    return {
      direction: "unclear",
      faceCount,
      pitch: null,
      timestamp,
      yaw: null,
    };
  }

  const eyeMidX = (leftEye.x + rightEye.x) / 2;
  const eyeMidY = (leftEye.y + rightEye.y) / 2;
  const eyeDistance = Math.max(Math.abs(rightEye.x - leftEye.x), 0.001);
  const verticalSpan = Math.max(mouth.y - eyeMidY, 0.001);

  const yaw = ((nose.x - eyeMidX) / eyeDistance) * 100;
  const pitch = ((nose.y - eyeMidY) / verticalSpan) * 100;

  return {
    direction: getDirection(yaw, pitch),
    faceCount,
    pitch,
    timestamp,
    yaw,
  };
};
