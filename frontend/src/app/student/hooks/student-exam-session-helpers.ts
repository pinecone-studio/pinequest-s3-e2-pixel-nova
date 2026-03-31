import type { Exam, Question, Violations } from "../types";

export const EMPTY_VIOLATIONS: Violations = {
  tabSwitch: 0,
  windowBlur: 0,
  copyAttempt: 0,
  pasteAttempt: 0,
  fullscreenExit: 0,
  keyboardShortcut: 0,
  idleTooLong: 0,
  rightClick: 0,
  suspiciousResize: 0,
  eventCount: 0,
  riskLevel: "low",
  log: [],
};

export const EVENT_TYPE_MAP: Record<string, string> = {
  TAB_SWITCH: "tab_switch",
  WINDOW_BLUR: "window_blur",
  COPY_ATTEMPT: "copy_paste",
  PASTE_ATTEMPT: "copy_paste",
  FULLSCREEN_EXIT: "tab_hidden",
  KEYBOARD_SHORTCUT: "devtools_open",
  SUSPICIOUS_SPEED: "rapid_answers",
  NO_MOUSE_MOVEMENT: "idle_too_long",
  EXTENDED_DISPLAY: "multiple_monitors",
};

type SessionQuestion = {
  id: string;
  type: string;
  questionText: string;
  imageUrl?: string | null;
  points: number;
  options?: { id: string; label: string; text: string }[];
};

type SessionSavedAnswer = {
  questionId: string;
  selectedOptionId?: string | null;
  textAnswer?: string | null;
};

type SessionExam = {
  id: string;
  title: string;
  description?: string | null;
  durationMin: number;
  requiresAudioRecording?: boolean;
  enabledCheatDetections?: string[];
  status?: string | null;
  scheduledAt?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
};

type SessionPayload = {
  exam: SessionExam;
  answers?: SessionSavedAnswer[];
  questions: SessionQuestion[];
};

export const mapSessionToExam = (
  sessionData: SessionPayload,
  roomCodeInput: string,
): Exam => {
  const examData = sessionData.exam;

  return {
    id: examData.id,
    title: examData.title,
    description: examData.description ?? null,
    status: examData.status ?? null,
    scheduledAt: examData.scheduledAt ?? null,
    examStartedAt: examData.startedAt ?? null,
    finishedAt: examData.finishedAt ?? null,
    roomCode: roomCodeInput.trim().toUpperCase(),
    requiresAudioRecording: Boolean(examData.requiresAudioRecording),
    enabledCheatDetections: examData.enabledCheatDetections ?? undefined,
    questions: sessionData.questions.map((question) => ({
      id: question.id,
      text: question.questionText,
      type: question.type as Question["type"],
      options: question.options?.map((opt) => opt.text) ?? undefined,
      correctAnswer: "",
      points: Number(question.points ?? 1),
      imageUrl: question.imageUrl ?? undefined,
    })),
    duration: examData.durationMin,
    createdAt: new Date().toISOString(),
  };
};

export const mapSessionAnswers = (sessionData: SessionPayload) => {
  const answerMap: Record<string, string> = {};
  const answers = sessionData.answers ?? [];
  const questionMap = new Map(
    sessionData.questions.map((question) => [question.id, question] as const),
  );

  answers.forEach((answer) => {
    const question = questionMap.get(answer.questionId);
    if (!question) return;

    if (typeof answer.textAnswer === "string" && answer.textAnswer.trim()) {
      answerMap[answer.questionId] = answer.textAnswer;
      return;
    }

    if (answer.selectedOptionId && question.options?.length) {
      const matchedOption = question.options.find(
        (option) => option.id === answer.selectedOptionId,
      );
      if (matchedOption?.text) {
        answerMap[answer.questionId] = matchedOption.text;
      }
    }
  });

  return answerMap;
};

type ResultAnswer = {
  questionText: string;
  selectedAnswer: string | null;
  correctAnswer: string | null;
  isCorrect: boolean;
  points: number;
  pointsEarned: number;
};

type ResultPayload = {
  answers: ResultAnswer[];
  score: number;
  totalPoints: number;
};

export const mapResultToReport = (result: ResultPayload) =>
  result.answers.map((item) => ({
    question: {
      id: `${item.questionText}-${item.points}`,
      text: item.questionText,
      type: "text" as const,
      options: undefined,
      correctAnswer: item.correctAnswer ?? "",
      points: item.points ?? 1,
    },
    answer: item.selectedAnswer ?? "",
    correct: Boolean(item.isCorrect),
  }));
