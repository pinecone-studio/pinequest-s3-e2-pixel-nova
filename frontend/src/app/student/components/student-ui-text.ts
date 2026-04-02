const replacementRules: Array<[RegExp, string]> = [
  [/Go back to exam list/gi, "Шалгалтын жагсаалт руу буцах"],
  [/Starting exam\.\.\./gi, "Шалгалт эхлүүлж байна..."],
  [/Start Exam/gi, "Шалгалт эхлүүлэх"],
  [/Submitting exam\.\.\./gi, "Шалгалтыг илгээж байна..."],
  [/Retry microphone/gi, "Микрофоныг дахин асаах"],
  [/End exam/gi, "Шалгалтыг дуусгах"],
  [/Restart mic/gi, "Микрофоныг дахин асаах"],
  [/Microphone evidence is required/gi, "Микрофоны бичлэг заавал шаардлагатай"],
  [
    /Audio recording stopped, so the exam cannot continue until microphone recording is restored\./gi,
    "Аудио бичлэг тасарсан тул микрофоны бичлэгийг сэргээх хүртэл шалгалтыг үргэлжлүүлэх боломжгүй.",
  ],
  [/Exam audio evidence/gi, "Шалгалтын аудио баримт"],
  [
    /Required microphone recording in rolling 30-second chunks/gi,
    "30 секундийн хэсгүүдээр микрофоны бичлэг заавал хийгдэнэ",
  ],
  [/Current Chunk/gi, "Одоогийн хэсэг"],
  [/Uploaded Chunks/gi, "Илгээсэн хэсэг"],
  [/Audio Format/gi, "Аудио формат"],
  [/Unavailable/gi, "Боломжгүй"],
  [/Last Upload/gi, "Сүүлд илгээсэн"],
  [/Waiting for first chunk/gi, "Эхний хэсгийг хүлээж байна"],
  [
    /Audio is stored as evidence clips for teacher review\. The exam cannot continue without microphone recording\./gi,
    "Аудио бичлэг нь багш шалгах баримт байдлаар хадгалагдана. Микрофоны бичлэггүйгээр шалгалтыг үргэлжлүүлэх боломжгүй.",
  ],
  [
    /Microphone recording stays on while the exam is active\./gi,
    "Шалгалт үргэлжилж байх хугацаанд микрофоны бичлэг идэвхтэй байна.",
  ],
  [/Browser/gi, "Хөтөч"],
  [/Backend/gi, "Сервер"],
  [/Pinecone/gi, "Пайнкоун"],
  [/EduCore/gi, "Эдүкор"],
  [/AI-ийн/gi, "Хиймэл оюуны"],
  [/\bAI\b/gi, "Хиймэл оюун"],
  [/\bYOU\b/gi, "ТА"],
  [/\bLvl\b/gi, "Түвшин"],
  [/\bXP\b/gi, "оноо"],
  [/Social Studies/gi, "Нийгэм"],
  [/Mathematics/gi, "Математик"],
  [/\bMath\b/gi, "Математик"],
  [/Physics/gi, "Физик"],
  [/English/gi, "Англи хэл"],
  [/Mongolian/gi, "Монгол хэл"],
  [/Russian/gi, "Орос хэл"],
  [/Literature/gi, "уран зохиол"],
  [/Vocabulary/gi, "Үгийн сан"],
  [/Reading/gi, "унших"],
  [/Listening/gi, "сонсох"],
  [/Grammar/gi, "дүрэм"],
  [/Speaking/gi, "ярих"],
  [/Midterm/gi, "улирлын"],
  [/Final/gi, "эцсийн"],
  [/Mock/gi, "туршилтын"],
  [/Practice/gi, "дадлага"],
  [/Quiz/gi, "сорил"],
  [/Test/gi, "шалгалт"],
  [/Exam/gi, "шалгалт"],
];

const cameraStatusLabels = {
  idle: "Бэлэн",
  requesting_permission: "Зөвшөөрөл хүсэж байна",
  loading_models: "Шинжилгээ бэлдэж байна",
  running: "Идэвхтэй",
  stopped: "Зогссон",
  unsupported: "Дэмжигдэхгүй",
  error: "Алдаа",
} as const;

const audioStatusLabels = {
  idle: "Бэлэн",
  requesting_permission: "Зөвшөөрөл хүсэж байна",
  starting: "Эхлүүлж байна",
  recording: "Бичиж байна",
  uploading: "Илгээж байна",
  blocked: "Тасалдсан",
  error: "Алдаа",
  stopped: "Зогссон",
  unsupported: "Дэмжигдэхгүй",
} as const;

export const hasLatinLetters = (value: string) => /[A-Za-z]/.test(value);

export const localizeStudentText = (value: string) => {
  let localized = value.trim();

  replacementRules.forEach(([pattern, replacement]) => {
    localized = localized.replace(pattern, replacement);
  });

  return localized
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;!?])/g, "$1")
    .replace(/шалгалт\s+шалгалтын/gi, "шалгалтын")
    .replace(/сорил\s+шалгалтын/gi, "сорилын")
    .trim();
};

export const formatCompactStudentPoints = (value: number) => {
  if (value >= 1000) {
    const compact =
      value >= 10000 ? Math.round(value / 1000) : Math.round(value / 100) / 10;
    return `${compact.toString().replace(/\.0$/, "")} мян.`;
  }

  return value.toLocaleString("mn-MN");
};

export const formatStudentPointsLabel = (value: number) =>
  `${formatCompactStudentPoints(value)} оноо`;

export const localizeRiskLevel = (riskLevel?: string | null) => {
  switch (riskLevel) {
    case "medium":
      return "дунд";
    case "high":
      return "өндөр";
    case "critical":
      return "ноцтой";
    case "low":
    default:
      return "бага";
  }
};

export const localizeCameraStatus = (status: keyof typeof cameraStatusLabels | string) =>
  cameraStatusLabels[status as keyof typeof cameraStatusLabels] ??
  localizeStudentText(status.replace(/_/g, " "));

export const localizeAudioStatus = (status: keyof typeof audioStatusLabels | string) =>
  audioStatusLabels[status as keyof typeof audioStatusLabels] ??
  localizeStudentText(status.replace(/_/g, " "));

export const localizeCameraBlockedReason = (blockedReason: string | null) => {
  switch (blockedReason) {
    case "low_brightness":
      return "Гэрэл сул";
    case "sudden_landmark_loss":
      return "Нүүрний цэг гэнэт алдагдсан";
    default:
      return "Тодорхойгүй";
  }
};

export const localizeAudioMimeType = (mimeType: string | null) => {
  if (!mimeType) {
    return "Боломжгүй";
  }

  if (mimeType.startsWith("audio/webm")) {
    return "Вэбм аудио";
  }

  if (mimeType.startsWith("audio/ogg")) {
    return "Огг аудио";
  }

  return mimeType;
};
