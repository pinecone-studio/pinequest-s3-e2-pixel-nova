import type { CheatEventType } from './types';

export type MobileCameraPlatform = 'android' | 'ios';

export type ProctorEventType = Extract<
  CheatEventType,
  'face_missing' | 'multiple_faces' | 'looking_away' | 'looking_down'
>;

export type ProctorObservation = {
  cameraPosition: 'front';
  faceCount: number;
  pitch: number | null;
  platform: MobileCameraPlatform;
  timestamp: number;
  yaw: number | null;
};

export type ProctorEvent = {
  eventType: ProctorEventType;
  localMessage: string;
  metadata: string;
};

type ActiveSinceMap = Partial<Record<ProctorEventType, number>>;
type CooldownMap = Partial<Record<ProctorEventType, number>>;

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

const RULES: Record<ProctorEventType, RuleDefinition> = {
  face_missing: {
    threshold: 2_000,
    localMessage: 'Камер танд нүүр харахгүй байна. Камерын өмнө эргэж сууна уу.',
    predicate: (observation) => observation.faceCount === 0,
  },
  looking_away: {
    threshold: 1_500,
    localMessage: 'Та хэт удаан хажуу тийш харж байна. Анхаарлаа дэлгэц дээр төвлөрүүлнэ үү.',
    predicate: (observation) =>
      observation.faceCount === 1 &&
      observation.yaw !== null &&
      Math.abs(observation.yaw) >= 25,
  },
  looking_down: {
    threshold: 1_500,
    localMessage: 'Та хэт удаан доош харж байна. Толгойгоо дэлгэц рүү чиглүүлнэ үү.',
    predicate: (observation) =>
      observation.faceCount === 1 &&
      observation.pitch !== null &&
      observation.pitch >= 20,
  },
  multiple_faces: {
    threshold: 1_000,
    localMessage: 'Камерт нэгээс олон хүн илэрлээ. Зөвхөн ганцаараа кадрт байна уу.',
    predicate: (observation) => observation.faceCount > 1,
  },
};

const EVENT_ORDER: ProctorEventType[] = [
  'face_missing',
  'multiple_faces',
  'looking_away',
  'looking_down',
];

const roundMetric = (value: number | null) =>
  value === null ? null : Math.round(value * 100) / 100;

export const createInitialProctorState = (): ProctorState => ({
  activeSince: {},
  lastTriggeredAt: {},
});

export const buildProctorMetadata = (
  eventType: ProctorEventType,
  observation: ProctorObservation,
  durationMs: number
) =>
  JSON.stringify({
    source: 'mobile_camera',
    platform: observation.platform,
    faceCount: observation.faceCount,
    yaw: eventType === 'face_missing' ? null : roundMetric(observation.yaw),
    pitch: eventType === 'face_missing' ? null : roundMetric(observation.pitch),
    durationMs,
    threshold: RULES[eventType].threshold,
    cameraPosition: observation.cameraPosition,
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

export const getProctorDebugLabel = (observation: {
  faceCount: number;
  pitch: number | null;
  yaw: number | null;
}) =>
  `Faces: ${observation.faceCount} | yaw: ${
    observation.yaw === null ? 'n/a' : observation.yaw.toFixed(1)
  } | pitch: ${observation.pitch === null ? 'n/a' : observation.pitch.toFixed(1)}`;
