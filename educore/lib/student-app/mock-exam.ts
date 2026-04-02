import type {
  ActiveExamSession,
  AnswerValue,
  SessionQuestion,
  SessionResultResponse,
} from "@/types/student-app";

export const BIOLOGY_MOCK_ROOM_CODE = "BIO-MOCK";
export const BIOLOGY_MOCK_EXAM_ID = "mock-biology-exam";
export const BIOLOGY_MOCK_TITLE = "Biology Practice Mock";

const MOCK_SESSION_ID = "mock-biology-session";

const BIOLOGY_MOCK_QUESTIONS: SessionQuestion[] = [
  {
    id: "bio-q1",
    type: "multiple_choice",
    questionText: "What is the main function of chlorophyll in plants?",
    points: 1,
    difficulty: "easy",
    topic: "Photosynthesis",
    options: [
      { id: "bio-q1-a", label: "A", text: "Absorb light energy" },
      { id: "bio-q1-b", label: "B", text: "Store genetic code" },
      { id: "bio-q1-c", label: "C", text: "Pump blood" },
      { id: "bio-q1-d", label: "D", text: "Break down protein" },
    ],
  },
  {
    id: "bio-q2",
    type: "multiple_choice",
    questionText: "Which organelle is known as the powerhouse of the cell?",
    points: 1,
    difficulty: "easy",
    topic: "Cell biology",
    options: [
      { id: "bio-q2-a", label: "A", text: "Nucleus" },
      { id: "bio-q2-b", label: "B", text: "Mitochondrion" },
      { id: "bio-q2-c", label: "C", text: "Ribosome" },
      { id: "bio-q2-d", label: "D", text: "Vacuole" },
    ],
  },
  {
    id: "bio-q3",
    type: "true_false",
    questionText: "DNA is found only in animal cells.",
    points: 1,
    difficulty: "medium",
    topic: "Genetics",
    options: [
      { id: "bio-q3-a", label: "A", text: "True" },
      { id: "bio-q3-b", label: "B", text: "False" },
    ],
  },
  {
    id: "bio-q4",
    type: "multiple_choice",
    questionText: "Which blood cells help fight infection?",
    points: 1,
    difficulty: "easy",
    topic: "Human biology",
    options: [
      { id: "bio-q4-a", label: "A", text: "Red blood cells" },
      { id: "bio-q4-b", label: "B", text: "White blood cells" },
      { id: "bio-q4-c", label: "C", text: "Platelets" },
      { id: "bio-q4-d", label: "D", text: "Plasma only" },
    ],
  },
];

const CORRECT_OPTION_BY_QUESTION_ID: Record<string, string> = {
  "bio-q1": "bio-q1-a",
  "bio-q2": "bio-q2-b",
  "bio-q3": "bio-q3-b",
  "bio-q4": "bio-q4-b",
};

export function isMockExamRoomCode(roomCode: string) {
  return roomCode.trim().toUpperCase() === BIOLOGY_MOCK_ROOM_CODE;
}

export function createBiologyMockSession(now = new Date()): ActiveExamSession {
  return {
    sessionId: MOCK_SESSION_ID,
    roomCode: BIOLOGY_MOCK_ROOM_CODE,
    status: "joined",
    exam: {
      id: BIOLOGY_MOCK_EXAM_ID,
      title: BIOLOGY_MOCK_TITLE,
      description: "Local mock exam for practicing the student flow.",
      durationMin: 20,
      questionCount: BIOLOGY_MOCK_QUESTIONS.length,
      status: "active",
      scheduledAt: now.toISOString(),
      startedAt: null,
      finishedAt: null,
      requiresAudioRecording: false,
      enabledCheatDetections: [],
    },
    questions: BIOLOGY_MOCK_QUESTIONS,
    answers: {},
    currentQuestionIndex: 0,
    timerEndsAt: null,
    startedAt: null,
    lastAnswerAt: null,
    syncStatus: "ready",
    syncMessage: null,
    entryStatus: "on_time",
  };
}

export function isMockExamSession(
  session: Pick<ActiveExamSession, "roomCode" | "exam"> | null | undefined,
) {
  return Boolean(
    session &&
      (session.roomCode === BIOLOGY_MOCK_ROOM_CODE ||
        session.exam.id === BIOLOGY_MOCK_EXAM_ID),
  );
}

export function buildBiologyMockResult(
  session: ActiveExamSession,
  answers: Record<string, AnswerValue>,
): SessionResultResponse {
  const breakdown = session.questions.map((question) => {
    const answer = answers[question.id] ?? {};
    const correctOptionId = CORRECT_OPTION_BY_QUESTION_ID[question.id] ?? null;
    const correctOption =
      question.options.find((option) => option.id === correctOptionId) ?? null;
    const isCorrect =
      correctOptionId !== null &&
      answer.selectedOptionId === correctOptionId;

    return {
      questionId: question.id,
      questionText: question.questionText,
      questionType: question.type,
      points: question.points,
      correctAnswerText: correctOption?.text ?? null,
      selectedOptionId: answer.selectedOptionId ?? null,
      textAnswer: answer.textAnswer ?? null,
      isCorrect,
      pointsEarned: isCorrect ? question.points : 0,
      options: question.options,
    };
  });

  const earnedPoints = breakdown.reduce(
    (total, item) => total + (item.pointsEarned ?? 0),
    0,
  );
  const totalPoints = breakdown.reduce((total, item) => total + item.points, 0);
  const score =
    totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  return {
    sessionId: session.sessionId,
    status: "graded",
    score,
    earnedPoints,
    totalPoints,
    submittedAt: new Date().toISOString(),
    answers: breakdown,
    xpEarned: score,
  };
}
