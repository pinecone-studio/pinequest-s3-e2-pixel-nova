import type { CheatEventType } from '@/types/student-app';

export type MobileCameraPlatform = 'android' | 'ios' | 'web' | 'unknown';

export type LocalProctorEventType = Extract<
  CheatEventType,
  'face_missing' | 'multiple_faces' | 'looking_away' | 'camera_blocked'
>;

export type ProctorObservation = {
  blockedReason?: 'low_brightness' | 'sudden_landmark_loss' | null;
  brightness?: number | null;
  cameraPosition: 'front';
  faceCount: number;
  platform: MobileCameraPlatform;
  timestamp: number;
  yaw: number | null;
};

export type ProctorEvent = {
  eventType: LocalProctorEventType;
  localMessage: string;
  metadata: string;
};

type ActiveSinceMap = Partial<Record<LocalProctorEventType, number>>;
type CooldownMap = Partial<Record<LocalProctorEventType, number>>;

export type ProctorState = {
  activeSince: ActiveSinceMap;
  lastTriggeredAt: CooldownMap;
};

type RuleDefinition = {
  localMessage: string;
  predicate: (observation: ProctorObservation) => boolean;
  threshold: number;
};

const COOLDOWN_MS = 15_000;

const RULES: Record<LocalProctorEventType, RuleDefinition> = {
  face_missing: {
    threshold: 3_000,
    localMessage:
      'No face is visible for too long. Return to the camera view.',
    predicate: (observation) =>
      observation.faceCount === 0 && observation.blockedReason == null,
  },
  multiple_faces: {
    threshold: 2_000,
    localMessage:
      'More than one face is visible. Only one student should stay in frame.',
    predicate: (observation) => observation.faceCount > 1,
  },
  looking_away: {
    threshold: 4_000,
    localMessage:
      'The student has been looking away for too long. Refocus on the exam screen.',
    predicate: (observation) =>
      observation.faceCount === 1 &&
      observation.yaw !== null &&
      Math.abs(observation.yaw) > 25,
  },
  camera_blocked: {
    threshold: 3_000,
    localMessage:
      'The camera appears blocked or too dark. Clear the lens and keep the face visible.',
    predicate: (observation) =>
      observation.blockedReason != null ||
      (observation.brightness != null && observation.brightness < 28),
  },
};

const EVENT_ORDER: LocalProctorEventType[] = [
  'camera_blocked',
  'face_missing',
  'multiple_faces',
  'looking_away',
];

const roundMetric = (value: number | null | undefined) =>
  value == null ? null : Math.round(value * 100) / 100;

export const createInitialProctorState = (): ProctorState => ({
  activeSince: {},
  lastTriggeredAt: {},
});

export const buildProctorMetadata = (
  eventType: LocalProctorEventType,
  observation: ProctorObservation,
  durationMs: number
) =>
  JSON.stringify({
    source: 'mobile_camera_local',
    platform: observation.platform,
    faceCount: observation.faceCount,
    yaw: eventType === 'face_missing' ? null : roundMetric(observation.yaw),
    brightness: roundMetric(observation.brightness),
    durationMs,
    threshold: RULES[eventType].threshold,
    cameraPosition: observation.cameraPosition,
    reason: observation.blockedReason ?? null,
  });

export const evaluateProctorObservation = (
  currentState: ProctorState,
  observation: ProctorObservation
): { events: ProctorEvent[]; state: ProctorState } => {
  const nextState: ProctorState = {
    activeSince: { ...currentState.activeSince },
    lastTriggeredAt: { ...currentState.lastTriggeredAt },
  };
  const events: ProctorEvent[] = [];

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
      metadata: buildProctorMetadata(eventType, observation, durationMs),
    });
  }

  return { events, state: nextState };
};

export const resetProctorActiveTimers = (
  currentState: ProctorState
): ProctorState => ({
  activeSince: {},
  lastTriggeredAt: { ...currentState.lastTriggeredAt },
});

export const getProctorLocalMessage = (eventType: LocalProctorEventType) =>
  RULES[eventType].localMessage;
