export const DEFAULT_ENABLED_CHEAT_DETECTIONS = [
  "tab_switch",
  "tab_hidden",
  "window_blur",
  "copy_paste",
  "screen_capture",
  "devtools_open",
  "face_missing",
  "multiple_faces",
  "looking_away",
  "looking_down",
  "camera_blocked",
] as const;

export type ConfigurableCheatDetection =
  (typeof DEFAULT_ENABLED_CHEAT_DETECTIONS)[number];

const DETECTION_SET = new Set<string>(DEFAULT_ENABLED_CHEAT_DETECTIONS);

export const normalizeEnabledCheatDetections = (
  detections?: readonly string[] | null,
): ConfigurableCheatDetection[] => {
  if (!detections?.length) {
    return [...DEFAULT_ENABLED_CHEAT_DETECTIONS];
  }

  const normalized = detections.filter(
    (value): value is ConfigurableCheatDetection => {
      return DETECTION_SET.has(value);
    },
  );

  return normalized.length > 0
    ? Array.from(new Set(normalized))
    : [...DEFAULT_ENABLED_CHEAT_DETECTIONS];
};

export const isCheatDetectionEnabled = (
  eventType: string,
  enabledDetections?: readonly string[] | null,
) =>
  normalizeEnabledCheatDetections(enabledDetections).includes(
    eventType as ConfigurableCheatDetection,
  );

export const CHEAT_DETECTION_LABELS: Record<
  ConfigurableCheatDetection,
  string
> = {
  tab_switch: "Дэлгэц солих",
  tab_hidden: "Камер нээх",
  window_blur: "Дуу хураагуур",
  copy_paste: "Хуулах эсвэл буулгах оролдлого",
  screen_capture: "Дэлгэцийн зураг авах",
  devtools_open: "Хулганы баруун товч дарах ",
  face_missing: "Нүүр илрэхгүй байх",
  multiple_faces: "Олон нүүр илрэх",
  looking_away: "Хажуу тийш харах",
  looking_down: "Доош харах",
  camera_blocked: "Камер хаагдах",
};
