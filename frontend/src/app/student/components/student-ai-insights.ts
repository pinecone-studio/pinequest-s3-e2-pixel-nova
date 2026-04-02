import { localizeSubjectLabel, toSubjectLabel } from "./student-progress-insights";

type StudentHistoryItem = {
  examId: string;
  title: string;
  percentage: number;
  date: string;
};

type InsightSubjectSignal = {
  subject: string;
  average: number;
  status: "strong" | "focus" | "steady";
};

type InsightSubjectBreakdown = {
  label: string;
  score: number;
};

export type SubjectInsightDetail = {
  subject: string;
  concerns: InsightSubjectBreakdown[];
  strengths: InsightSubjectBreakdown[];
  recommendations: string[];
};

export type StudentAiInsightSnapshot = {
  generatedAt: string;
  signature: string;
  headline: string;
  summary: string;
  encouragement: string;
  strengths: string[];
  focusAreas: string[];
  actionPlan: string[];
  subjectSignals: InsightSubjectSignal[];
  subjectDetails: SubjectInsightDetail[];
  stats: {
    average: number;
    best: number;
    examCount: number;
    trendLabel: string;
    consistencyLabel: string;
  };
};

type BuildStudentAiInsightInput = {
  currentUserName: string;
  levelInfo: {
    level: number;
    name: string;
    minXP: number;
  };
  currentXp: number;
  currentRank: number | null;
  totalStudents: number;
  studentHistory: StudentHistoryItem[];
};

const encouragements = [
  "Өдөр бүрийн жижиг ахиц урт хугацаанд хамгийн том ялгааг бий болгодог.",
  "Алдаа гарч байгаа сэдэв бол сул тал биш, харин дараагийн өсөлтийн цэг юм.",
  "Чи тогтвортой давтвал одоогийн түвшнээсээ хурдан дээшилж чадна.",
  "Өмнөхөөсөө жаахан дээрдэх бүр чинь бодит ахиц гэдгийг санаарай.",
  "Оноо өсөхөөс өмнө ойлголт гүнзгийрдэг. Тэр процессыг бүү алгас.",
  "Сайн байгаа сэдвээ хадгалж, сул байгаа сэдвээ бага багаар шахах нь хамгийн зөв стратеги.",
];

const stableSuggestions = [
  "Өдөрт 15-20 минутын богино давтлага хийж хэвшвэл одоогийн хэмнэлээ алдахгүй.",
  "Шалгалтын өмнө сүүлийн 3 алдаагаа нэг удаа сөхөж харах нь үр дүнтэй.",
  "Өөртөө богино хугацааны зорилт тавь: дараагийн шалгалтад дундажаа 5%-иар өсгөх.",
];

const lowPerformanceSuggestions = [
  "Хамгийн бага оноотой 1-2 сэдвээ ялгаад эхлээд зөвхөн тэр хэсэг дээр төвлөр.",
  "Нэг дор бүхнийг нөхөх гэж яарахгүй, богино сэдэвчилсэн давтлага хий.",
  "Алдсан асуултуудаа зөв хариутай нь харьцуулж яагаад андуурснаа тэмдэглэ.",
];

const highPerformanceSuggestions = [
  "Өндөр дүнтэй байгаа сэдвүүд дээрээ тайлбарлаж сурвал мэдлэг чинь бүр батжинa.",
  "Одоо сайн байгаа хэмнэлээ хадгалахын тулд давтлагаа таслахгүй үргэлжлүүл.",
  "Амжилттай байгаа сэдвээ бусад сул сэдэвтэйгээ холбож давтвал илүү тэнцвэртэй болно.",
];

const subjectTopicPresets: { match: RegExp; strengths: string[]; concerns: string[] }[] = [
  {
    match: /(math|мат|алгебр|геометр|тригонометр)/i,
    strengths: ["Геометр", "Тригонометр", "Функц"],
    concerns: ["Алгебр", "Матриц", "Тэгшитгэл"],
  },
  {
    match: /(english|англи|vocabulary|reading|grammar|listening)/i,
    strengths: ["Унших", "Сонсох", "Дүрэм"],
    concerns: ["Үгийн сан", "Үсэглэлт", "Өгүүлбэрийн хэрэглээ"],
  },
  {
    match: /(physics|физик|mechanics|optics)/i,
    strengths: ["Механик", "Хөдөлгөөн", "Хэмжилт"],
    concerns: ["Оптик", "Цахилгаан", "Томьёо"],
  },
  {
    match: /(chem|хими|organic|atom|periodic)/i,
    strengths: ["Атомын бүтэц", "Химийн холбоо", "Урвал"],
    concerns: ["Тэнцвэржүүлэлт", "Органик", "Томьёо"],
  },
  {
    match: /(history|түүх|нийгэм|social)/i,
    strengths: ["Ойлголт", "Нэр томьёо", "Он цаг"],
    concerns: ["Харьцуулалт", "Шалтгаан үр дагавар", "Дэс дараалал"],
  },
];

const normalizeTitle = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "Ерөнхий сэдэв";
  return toSubjectLabel(trimmed);
};

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const average = (values: number[]) =>
  values.length > 0
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : 0;

const getTrendLabel = (scores: number[]) => {
  if (scores.length <= 1) return "Шинэ дата хуримтлагдаж байна";

  const latest = scores[0] ?? 0;
  const previousAverage = average(scores.slice(1));
  const diff = latest - previousAverage;

  if (diff >= 8) return "Сүүлийн үед ахицтай байна";
  if (diff <= -8) return "Сүүлийн үед буурсан тул анхаарах хэрэгтэй";
  return "Тогтвортой явж байна";
};

const getConsistencyLabel = (scores: number[]) => {
  if (scores.length <= 1) return "Тогтвортой байдлыг дүгнэх дата бага байна";

  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const spread = max - min;

  if (spread <= 10) return "Оноо тогтвортой байна";
  if (spread <= 24) return "Жаахан савлагаатай ч боломжийн байна";
  return "Онооны савлагаа их байна";
};

const buildSubjectSignals = (history: StudentHistoryItem[]): InsightSubjectSignal[] => {
  const grouped = new Map<string, number[]>();

  history.forEach((item) => {
    const key = normalizeTitle(item.title);
    grouped.set(key, [...(grouped.get(key) ?? []), item.percentage]);
  });

  const entries = [...grouped.entries()]
    .map(([subject, scores]) => ({
      subject,
      average: average(scores),
    }))
    .sort((left, right) => right.average - left.average);

  const strongest = entries[0]?.subject ?? null;
  const weakest = entries[entries.length - 1]?.subject ?? null;

  return entries.slice(0, 4).map((entry) => {
    const status: InsightSubjectSignal["status"] =
      entry.subject === strongest
        ? "strong"
        : entry.subject === weakest
          ? "focus"
          : "steady";

    return {
      ...entry,
      status,
    };
  });
};

const getSubjectPreset = (subject: string) =>
  subjectTopicPresets.find((preset) => preset.match.test(subject)) ?? {
    strengths: ["Ойлголт", "Асуулт тайлбарлалт", "Жишээ бодлого"],
    concerns: ["Суурь ойлголт", "Нарийн нэр томьёо", "Алдаа засвар"],
  };

const clampScore = (value: number) => Math.max(20, Math.min(98, Math.round(value)));

const buildSubjectDetail = (
  subject: InsightSubjectSignal,
  signature: string,
): SubjectInsightDetail => {
  const preset = getSubjectPreset(subject.subject);
  const seed = hashString(`${signature}:${subject.subject}`);
  const strengthBase = Math.max(subject.average + 10, 72);
  const concernBase = Math.min(subject.average - 18, 58);

  const strengths = preset.strengths.slice(0, 2).map((label, index) => ({
    label,
    score: clampScore(strengthBase - ((seed + index * 7) % 8)),
  }));

  const concerns = preset.concerns.slice(0, 2).map((label, index) => ({
    label,
    score: clampScore(concernBase + ((seed + index * 5) % 9)),
  }));

  const recommendations = [
    `${concerns[0]?.label ?? "Сул сэдэв"}-ийн бодлогуудыг өдөр бүр бага багаар давтаарай.`,
    `${concerns[1]?.label ?? "Энэ хэсэг"} дээр 5 нэмэлт дасгал хийж баталгаажуулаарай.`,
    `${strengths[0]?.label ?? "Сайн байгаа сэдэв"} дээрх арга барилаа бусад сэдэв дээр давтаж хэрэглээрэй.`,
  ];

  return {
    subject: localizeSubjectLabel(subject.subject),
    concerns,
    strengths,
    recommendations,
  };
};

export const buildStudentAiInsightSignature = ({
  currentUserName,
  levelInfo,
  currentXp,
  currentRank,
  totalStudents,
  studentHistory,
}: Omit<BuildStudentAiInsightInput, "bucket">) =>
  JSON.stringify({
    currentUserName,
    level: levelInfo.level,
    currentXp,
    currentRank,
    totalStudents,
    studentHistory: studentHistory.map((item) => ({
      examId: item.examId,
      title: item.title,
      percentage: item.percentage,
      date: item.date,
    })),
  });

export const buildStudentAiInsight = ({
  currentUserName,
  levelInfo,
  currentXp,
  currentRank,
  totalStudents,
  studentHistory,
}: BuildStudentAiInsightInput): StudentAiInsightSnapshot => {
  const signature = buildStudentAiInsightSignature({
    currentUserName,
    levelInfo,
    currentXp,
    currentRank,
    totalStudents,
    studentHistory,
  });
  const seed = hashString(signature);
  const scores = [...studentHistory]
    .sort((left, right) => right.date.localeCompare(left.date))
    .map((item) => item.percentage);
  const examCount = studentHistory.length;
  const averageScore = average(scores);
  const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const trendLabel = getTrendLabel(scores.slice(0, 4));
  const consistencyLabel = getConsistencyLabel(scores.slice(0, 5));
  const subjectSignals = buildSubjectSignals(studentHistory);
  const strongestSubject =
    subjectSignals.find((item) => item.status === "strong")?.subject ?? null;
  const focusSubject =
    subjectSignals.find((item) => item.status === "focus")?.subject ?? null;

  const performanceTier =
    averageScore >= 80 ? "high" : averageScore >= 60 ? "mid" : "low";
  const headline =
    performanceTier === "high"
      ? "Чиний суурь сайн байна, одоо тогтвортой байдлаа хадгалах нь чухал."
      : performanceTier === "mid"
        ? "Чиний явц боломжийн байна, гэхдээ зарим сэдэв дээр оноо хурдан өсөх боломж харагдаж байна."
        : "Чиний сүүлийн дүнг харахад үндсэн ойлголтоо илүү цэгцлэх шаардлагатай байна.";

  const summary =
    examCount === 0
      ? "Шалгалтын өгөгдөл хараахан бүрдээгүй байна. Эхний хэдэн шалгалтын дараа илүү бодит зөвлөмж гарч ирнэ."
      : focusSubject && strongestSubject && focusSubject !== strongestSubject
        ? `${currentUserName.split(" ")[0] ?? "Чи"}, ${strongestSubject} сэдэв дээр чинь илүү сайн гүйцэтгэл харагдаж байна. Харин ${focusSubject} талд алдаа давтагдаж байгаа тул дараагийн давтлагаа тэнд төвлөрүүлэх нь үр дүнтэй.`
        : `${currentUserName.split(" ")[0] ?? "Чи"}, сүүлийн ${examCount} шалгалтын дундаж ${averageScore}% байна. ${trendLabel.toLowerCase()}.`;

  const strengths = examCount === 0
    ? [
        "Эхний шалгалтаа өгсний дараа систем чиний давуу сэдвийг илүү нарийн танина.",
        "XP болон түвшний мэдээлэл чинь энэ хэсгийн зөвлөмжийг улам оновчтой болгоно.",
      ]
    : [
        strongestSubject
          ? `${strongestSubject} сэдэв дээр дундажаар ${subjectSignals.find((item) => item.subject === strongestSubject)?.average ?? averageScore}% авч байна.`
          : `Сүүлийн шалгалтуудын дундаж ${averageScore}% байна.`,
        bestScore > 0
          ? `Хамгийн өндөр үзүүлэлт чинь ${bestScore}% хүрсэн нь илүү өндөр түвшинд гарах боломжтойг харуулж байна.`
          : "Одоогоор эхний бодит дүнг хүлээж байна.",
        currentRank && totalStudents > 0
          ? `Ерөнхий XP эрэмбэд #${currentRank}/${totalStudents} явж байгаа нь хичээлдээ тогтмол оролцож байгааг илтгэнэ.`
          : `${levelInfo.name} түвшинд хүрсэн нь хуримтлуулсан XP тогтвортой өсөж байгааг харуулж байна.`,
      ];

  const focusAreas = examCount === 0
    ? [
        "Шалгалт эхлэхээс өмнө өөрийн хамгийн сул гэж боддог 1-2 сэдвээ сонгоод давт.",
        "Эхний хэдэн оролдлогоо хийсний дараа энэ хэсэг илүү тодорхой зөвлөмж гаргана.",
      ]
    : [
        focusSubject
          ? `${focusSubject} дээрх дундаж чинь бусад сэдвээс доогуур байна.`
          : "Сэдэв тус бүрийн ялгаа бага байна, тиймээс тогтвортой давтлагаа үргэлжлүүл.",
        trendLabel.includes("буурсан")
          ? "Сүүлийн шалгалтын оноо өмнөхүүдээс доош орсон тул сүүлийн алдаануудаа эргэж харах хэрэгтэй."
          : "Сүүлийн шалгалтынхаа буруу хариултуудыг сэдэвчилж тэмдэглэвэл ахиц хурдан гарна.",
        consistencyLabel,
      ];

  const suggestionPool =
    performanceTier === "high"
      ? highPerformanceSuggestions
      : performanceTier === "mid"
        ? stableSuggestions
        : lowPerformanceSuggestions;

  const actionPlan = [
    suggestionPool[seed % suggestionPool.length] ?? stableSuggestions[0],
    focusSubject
      ? `${focusSubject} сэдвээр 10-15 минутын богино давтлага хийж, дараа нь 3-5 жишээ бодлого ажилла.`
      : "Сүүлийн шалгалтынхаа хамгийн их алдсан 3 асуултыг дахин тайлбарлаж үз.",
    strongestSubject
      ? `${strongestSubject} дээрээ сайн байгаа арга барилаа бусад сэдэв дээр туршиж хэрэглэ.`
      : "Нэг дор олон сэдэв биш, нэг сэдэв дээр төвлөрсөн давтлага илүү үр дүнтэй.",
  ];

  const encouragement =
    encouragements[(seed + examCount + levelInfo.level) % encouragements.length] ??
    encouragements[0];

  const subjectDetails = subjectSignals.map((item) => buildSubjectDetail(item, signature));

  return {
    generatedAt: new Date().toISOString(),
    signature,
    headline,
    summary,
    encouragement,
    strengths,
    focusAreas,
    actionPlan,
    subjectSignals,
    subjectDetails,
    stats: {
      average: averageScore,
      best: bestScore,
      examCount,
      trendLabel,
      consistencyLabel,
    },
  };
};
