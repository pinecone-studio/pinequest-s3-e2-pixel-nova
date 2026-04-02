export type SubjectInsightMetric = {
  label: string;
  score: number;
};

export type SubjectInsightMistake = {
  topic: string;
  questionText: string;
  selectedAnswer: string | null;
  correctAnswer: string | null;
  examTitle: string | null;
  submittedAt: string | null;
};

export type SubjectInsightDetail = {
  subject: string;
  average: number;
  concerns: SubjectInsightMetric[];
  strengths: SubjectInsightMetric[];
  recommendations: string[];
  examCount: number;
  questionCount: number;
  accuracy: number;
  latestExamTitle: string | null;
  latestSubmittedAt: string | null;
  recentMistakes: SubjectInsightMistake[];
};

export type SubjectInsightAnswer = {
  sessionId?: string | null;
  topic?: string | null;
  questionText?: string | null;
  selectedAnswer?: string | null;
  correctAnswer?: string | null;
  isCorrect?: boolean | null;
  points?: number | null;
  pointsEarned?: number | null;
  examTitle?: string | null;
  submittedAt?: string | null;
};

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

const subjectLabelPresets: { match: RegExp; label: string }[] = [
  {
    match: /(mathematics|math|algebra|geometry|trigonometry|мат|алгебр|геометр|тригонометр)/i,
    label: "Математик",
  },
  {
    match: /(english|vocabulary|reading|grammar|listening|speaking|англи)/i,
    label: "Англи хэл",
  },
  {
    match: /(physics|mechanics|optics|физик)/i,
    label: "Физик",
  },
  {
    match: /(chemistry|chem|organic|atom|periodic|хими)/i,
    label: "Хими",
  },
  {
    match: /(biology|bio|биологи)/i,
    label: "Биологи",
  },
  {
    match: /(history|social studies|social|нийгэм|түүх)/i,
    label: "Нийгэм",
  },
  {
    match: /(mongolian|literature|монгол)/i,
    label: "Монгол хэл",
  },
  {
    match: /(russian|орос)/i,
    label: "Орос хэл",
  },
  {
    match: /(geography|газарзүй)/i,
    label: "Газарзүй",
  },
];

export const average = (values: number[]) =>
  values.length
    ? Math.round(values.reduce((sum, item) => sum + item, 0) / values.length)
    : 0;

const clampScore = (value: number) => Math.max(20, Math.min(98, Math.round(value)));

const getSubjectPreset = (subject: string) =>
  subjectTopicPresets.find((preset) => preset.match.test(subject)) ?? {
    strengths: ["Ойлголт", "Жишээ бодлого", "Сэдэв холболт"],
    concerns: ["Суурь ойлголт", "Алдаа засвар", "Нэмэлт давтлага"],
  };

export const localizeSubjectLabel = (value: string) => {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return "Хичээл";

  const preset = subjectLabelPresets.find((item) => item.match.test(cleaned));
  return preset?.label ?? cleaned;
};

export const toSubjectLabel = (value: string) => {
  const cleaned = value
    .replace(/[_-]+/g, " ")
    .replace(/\bхэлний\b/gi, "хэл")
    .replace(/\bявцын\b/gi, "")
    .replace(/\bавцын\b/gi, "")
    .replace(/\bшалгалт\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const localized = localizeSubjectLabel(cleaned);
  if (localized !== cleaned) {
    return localized;
  }

  const englishStopWords = new Set([
    "exam",
    "final",
    "midterm",
    "quiz",
    "reading",
    "mock",
    "practice",
    "test",
  ]);

  const filteredWords = cleaned
    .split(/\s+/)
    .filter((word) => !englishStopWords.has(word.toLowerCase()));

  if (filteredWords.length === 0) {
    return localizeSubjectLabel(cleaned);
  }

  return localizeSubjectLabel(filteredWords.slice(0, 2).join(" "));
};

const getQuestionTopicLabel = (
  answer: SubjectInsightAnswer,
  index: number,
) => {
  const explicitTopic = answer.topic?.replace(/\s+/g, " ").trim();
  if (explicitTopic) {
    return explicitTopic;
  }

  const questionText = answer.questionText?.replace(/\s+/g, " ").trim() ?? "";
  const firstSentence = questionText.split(/[?.!]/)[0]?.trim() ?? "";
  const shortened = firstSentence.split(/\s+/).slice(0, 4).join(" ").trim();
  if (shortened) {
    return shortened;
  }

  return `Асуулт ${index + 1}`;
};

const buildRecommendations = (
  concerns: SubjectInsightMetric[],
  strengths: SubjectInsightMetric[],
) => {
  const next = [
    concerns[0]
      ? `${concerns[0].label} сэдвийг өдөр бүр бага багаар давтаарай.`
      : null,
    concerns[1]
      ? `${concerns[1].label} хэсгийн алдаатай асуултуудаа тайлбарлаж дахин ажиллаарай.`
      : null,
    strengths[0]
      ? `${strengths[0].label} дээр ажиллаж байгаа сайн арга барилаа бусад сэдэв дээр давтаарай.`
      : null,
  ].filter((item): item is string => Boolean(item));

  if (next.length >= 3) {
    return next;
  }

  const presetAdvice = [
    "Алдаатай асуултуудаа тэмдэглээд дараагийн давтлага дээрээ түрүүлж ажиллаарай.",
    "Сайн байгаа сэдвээ хадгалахын тулд богино тогтмол давтлага хийж хэвшээрэй.",
    "Нэг дор олон сэдэв биш, нэг сул сэдэв дээр төвлөрсөн давтлага илүү үр дүнтэй.",
  ];

  return [...next, ...presetAdvice].slice(0, 3);
};

export const buildFallbackSubjectInsightDetail = (
  subject: string,
  averagePercentage: number,
): SubjectInsightDetail => {
  const preset = getSubjectPreset(subject);
  const strengthBase = Math.max(averagePercentage + 10, 72);
  const concernBase = Math.min(averagePercentage - 18, 58);

  const strengths = preset.strengths.slice(0, 2).map((label, index) => ({
    label,
    score: clampScore(strengthBase - index * 4),
  }));

  const concerns = preset.concerns.slice(0, 2).map((label, index) => ({
    label,
    score: clampScore(concernBase + index * 7),
  }));

  return {
    subject,
    average: averagePercentage,
    concerns,
    strengths,
    recommendations: buildRecommendations(concerns, strengths),
    examCount: 0,
    questionCount: 0,
    accuracy: averagePercentage,
    latestExamTitle: null,
    latestSubmittedAt: null,
    recentMistakes: [],
  };
};

export const buildBackendSubjectInsightDetail = (
  subject: string,
  averagePercentage: number,
  answers: SubjectInsightAnswer[],
): SubjectInsightDetail => {
  if (answers.length === 0) {
    return buildFallbackSubjectInsightDetail(subject, averagePercentage);
  }

  const grouped = new Map<string, { earned: number; total: number }>();
  const attempts = new Set<string>();
  let earnedTotal = 0;
  let availableTotal = 0;
  let latestExamTitle: string | null = null;
  let latestSubmittedAt: string | null = null;
  const recentMistakes: SubjectInsightMistake[] = [];

  answers.forEach((answer, index) => {
    const label = getQuestionTopicLabel(answer, index);
    const total = Math.max(Number(answer.points ?? 0), 1);
    const earned =
      answer.pointsEarned != null
        ? Number(answer.pointsEarned)
        : answer.isCorrect
          ? total
          : 0;

    const current = grouped.get(label) ?? { earned: 0, total: 0 };
    grouped.set(label, {
      earned: current.earned + earned,
      total: current.total + total,
    });

    earnedTotal += Math.max(earned, 0);
    availableTotal += total;

    if (answer.sessionId) {
      attempts.add(answer.sessionId);
    }

    if (answer.submittedAt && (!latestSubmittedAt || answer.submittedAt > latestSubmittedAt)) {
      latestSubmittedAt = answer.submittedAt;
      latestExamTitle = answer.examTitle ?? null;
    }

    const isIncorrect =
      answer.isCorrect === false ||
      (answer.isCorrect == null && earned < total);

    if (isIncorrect) {
      recentMistakes.push({
        topic: label,
        questionText:
          answer.questionText?.replace(/\s+/g, " ").trim() || `Асуулт ${index + 1}`,
        selectedAnswer: answer.selectedAnswer ?? null,
        correctAnswer: answer.correctAnswer ?? null,
        examTitle: answer.examTitle ?? null,
        submittedAt: answer.submittedAt ?? null,
      });
    }
  });

  const topicScores = [...grouped.entries()]
    .map(([label, score]) => ({
      label,
      score:
        score.total > 0 ? Math.round((Math.max(score.earned, 0) / score.total) * 100) : 0,
    }))
    .sort((left, right) => right.score - left.score);

  if (topicScores.length === 0) {
    return buildFallbackSubjectInsightDetail(subject, averagePercentage);
  }

  const strengths = topicScores
    .slice(0, Math.min(2, topicScores.length))
    .map((item) => ({
      label: item.label,
      score: clampScore(item.score),
    }));

  const concerns = [...topicScores]
    .sort((left, right) => left.score - right.score)
    .slice(0, Math.min(2, topicScores.length))
    .map((item) => ({
      label: item.label,
      score: clampScore(item.score),
    }));

  const accuracy =
    availableTotal > 0
      ? Math.round((Math.max(earnedTotal, 0) / availableTotal) * 100)
      : averagePercentage;

  const orderedMistakes = recentMistakes
    .sort((left, right) => {
      const leftDate = left.submittedAt ?? "";
      const rightDate = right.submittedAt ?? "";
      return rightDate.localeCompare(leftDate);
    })
    .slice(0, 3);

  return {
    subject,
    average: averagePercentage,
    concerns,
    strengths,
    recommendations: buildRecommendations(concerns, strengths),
    examCount: attempts.size,
    questionCount: answers.length,
    accuracy,
    latestExamTitle,
    latestSubmittedAt,
    recentMistakes: orderedMistakes,
  };
};
