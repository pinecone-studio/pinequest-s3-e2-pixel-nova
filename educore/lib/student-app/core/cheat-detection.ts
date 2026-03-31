import type { CheatEventType } from "@/types/student-app";

export const DEFAULT_ENABLED_CHEAT_DETECTIONS: CheatEventType[] = [
  "tab_switch",
  "tab_hidden",
  "window_blur",
  "copy_paste",
  "right_click",
  "screen_capture",
  "devtools_open",
  "multiple_monitors",
  "suspicious_resize",
  "rapid_answers",
  "idle_too_long",
  "face_missing",
  "multiple_faces",
  "looking_away",
  "looking_down",
  "camera_blocked",
];

const DETECTION_SET = new Set<string>(DEFAULT_ENABLED_CHEAT_DETECTIONS);

export const normalizeEnabledCheatDetections = (
  detections?: readonly string[] | null,
): CheatEventType[] => {
  if (!detections?.length) {
    return [...DEFAULT_ENABLED_CHEAT_DETECTIONS];
  }

  const normalized = detections.filter((value): value is CheatEventType => {
    return DETECTION_SET.has(value);
  });

  return normalized.length > 0
    ? Array.from(new Set(normalized))
    : [...DEFAULT_ENABLED_CHEAT_DETECTIONS];
};

export const isCheatDetectionEnabled = (
  eventType: CheatEventType,
  enabledDetections?: readonly string[] | null,
) => normalizeEnabledCheatDetections(enabledDetections).includes(eventType);
