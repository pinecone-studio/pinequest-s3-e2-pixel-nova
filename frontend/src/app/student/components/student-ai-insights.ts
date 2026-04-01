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

export type StudentAiInsightSnapshot = {
  bucket: number;
  generatedAt: string;
  signature: string;
  headline: string;
  summary: string;
  encouragement: string;
  strengths: string[];
  focusAreas: string[];
  actionPlan: string[];
  subjectSignals: InsightSubjectSignal[];
  stats: {
    average: number;
    best: number;
    examCount: number;
    trendLabel: string;
    consistencyLabel: string;
  };
};

type BuildStudentAiInsightInput = {
  bucket: number;
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

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;

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

const normalizeTitle = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "Ерөнхий сэдэв";

  const withoutNoise = trimmed
    .replace(/[_-]+/g, " ")
    .replace(/\b(test|exam|mock|practice|final|quiz)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return withoutNoise || trimmed;
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

export const getStudentAiInsightBucket = (timestamp = Date.now()) =>
  Math.floor(timestamp / FIVE_HOURS_MS);

export const getMsUntilNextInsightRefresh = (timestamp = Date.now()) =>
  FIVE_HOURS_MS - (timestamp % FIVE_HOURS_MS);

export const formatInsightRefreshCountdown = (milliseconds: number) => {
  const safeMs = Math.max(0, milliseconds);
  const totalMinutes = Math.ceil(safeMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes} минутын дараа`;
  }

  return `${hours}ц ${minutes.toString().padStart(2, "0")}м дараа`;
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
  bucket,
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
  const seed = hashString(`${signature}:${bucket}`);
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

  return {
    bucket,
    generatedAt: new Date().toISOString(),
    signature,
    headline,
    summary,
    encouragement,
    strengths,
    focusAreas,
    actionPlan,
    subjectSignals,
    stats: {
      average: averageScore,
      best: bestScore,
      examCount,
      trendLabel,
      consistencyLabel,
    },
  };
};
