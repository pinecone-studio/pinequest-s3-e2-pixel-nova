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

const DETECTION_SET = new Set<string>(DEFAULT_ENABLED_CHEAT_DETECTIONS);

export const normalizeEnabledCheatDetections = (
  detections?: readonly string[] | null,
): ConfigurableCheatDetection[] => {
  if (!detections?.length) {
    return [...DEFAULT_ENABLED_CHEAT_DETECTIONS];
  }

  const normalized = detections.filter((value): value is ConfigurableCheatDetection => {
    return DETECTION_SET.has(value);
  });

  return normalized.length > 0
    ? Array.from(new Set(normalized))
    : [...DEFAULT_ENABLED_CHEAT_DETECTIONS];
};

export const isCheatDetectionEnabled = (
  eventType: string,
  enabledDetections?: readonly string[] | null,
) => normalizeEnabledCheatDetections(enabledDetections).includes(
  eventType as ConfigurableCheatDetection,
);

export const CHEAT_DETECTION_LABELS: Record<ConfigurableCheatDetection, string> = {
  tab_switch: "Таб солих",
  tab_hidden: "Бүтэн дэлгэцээс гарах",
  window_blur: "Цонхноос гарах",
  copy_paste: "Хуулах, буулгах",
  right_click: "Баруун товшилт",
  screen_capture: "Дэлгэцийн зураг авах",
  devtools_open: "Developer tools нээх",
  multiple_monitors: "Олон дэлгэц",
  suspicious_resize: "Сэжигтэй хэмжээс өөрчлөх",
  rapid_answers: "Хэт хурдан хариулах",
  idle_too_long: "Хэт удаан идэвхгүй байх",
  face_missing: "Нүүр илрэхгүй байх",
  multiple_faces: "Олон нүүр илрэх",
  looking_away: "Хажуу тийш харах",
  looking_down: "Доош харах",
  camera_blocked: "Камер хаагдах",
};
