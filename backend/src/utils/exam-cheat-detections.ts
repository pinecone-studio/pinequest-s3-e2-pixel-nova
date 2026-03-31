export const DEFAULT_ENABLED_CHEAT_DETECTIONS = [
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
] as const;

export type ConfigurableCheatDetection =
  (typeof DEFAULT_ENABLED_CHEAT_DETECTIONS)[number];

const DEFAULT_DETECTION_SET = new Set<string>(DEFAULT_ENABLED_CHEAT_DETECTIONS);

export const isConfigurableCheatDetection = (
  value: string,
): value is ConfigurableCheatDetection => DEFAULT_DETECTION_SET.has(value);

export const normalizeEnabledCheatDetections = (
  detections: unknown,
): ConfigurableCheatDetection[] => {
  if (!Array.isArray(detections)) {
    return [...DEFAULT_ENABLED_CHEAT_DETECTIONS];
  }

  const normalized = detections.filter((value): value is ConfigurableCheatDetection => {
    return typeof value === "string" && isConfigurableCheatDetection(value);
  });

  return normalized.length > 0
    ? Array.from(new Set(normalized))
    : [...DEFAULT_ENABLED_CHEAT_DETECTIONS];
};

export const parseEnabledCheatDetections = (
  rawValue: string | null | undefined,
): ConfigurableCheatDetection[] => {
  if (!rawValue) {
    return [...DEFAULT_ENABLED_CHEAT_DETECTIONS];
  }

  try {
    return normalizeEnabledCheatDetections(JSON.parse(rawValue));
  } catch {
    return [...DEFAULT_ENABLED_CHEAT_DETECTIONS];
  }
};

export const serializeEnabledCheatDetections = (
  detections?: readonly string[] | null,
) => JSON.stringify(normalizeEnabledCheatDetections(detections ?? undefined));

export const canUpdateExamCheatDetections = (status?: string | null) =>
  status === "draft" || status === "scheduled";
