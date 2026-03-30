import { newId } from "./id";

export type ExamGeneratorRequest = {
  topic: string;
  subject?: string | null;
  gradeOrClass?: string | null;
  difficulty: "easy" | "medium" | "hard";
  questionCount: number;
  instructions?: string | null;
};

type GeneratedOption = {
  label: string;
  text: string;
  isCorrect: boolean;
};

type GeneratedQuestion = {
  type: "multiple_choice" | "true_false" | "short_answer";
  questionText: string;
  options?: GeneratedOption[];
  correctAnswerText?: string | null;
  points?: number;
};

type GeneratedExamPayload = {
  title?: string;
  description?: string | null;
  questions?: GeneratedQuestion[];
};

export type NormalizedDraftQuestion = {
  id: string;
  text: string;
  type: "mcq" | "text";
  options?: string[];
  correctAnswer: string;
  points: number;
};

export type NormalizedDraftExam = {
  title: string;
  description: string | null;
  questions: NormalizedDraftQuestion[];
};

const SYSTEM_PROMPT = `You generate exam drafts for teachers.

Return ONLY valid JSON with this exact object shape:
{
  "title": "string",
  "description": "string or null",
  "questions": [
    {
      "type": "multiple_choice" | "true_false" | "short_answer",
      "questionText": "string",
      "options": [{"label":"A","text":"string","isCorrect":true}],
      "correctAnswerText": "string or null",
      "points": 1
    }
  ]
}

Rules:
- Generate exactly the requested number of questions.
- Use clear teacher-ready wording.
- For multiple_choice include 4 options and exactly one correct option.
- For true_false include True and False style options with exactly one correct option.
- For short_answer leave options empty or omitted and provide correctAnswerText.
- Keep points as a positive integer, default 1.
- Do not include markdown fences or commentary.`;

export async function generateExamDraft(
  ai: Ai,
  input: ExamGeneratorRequest,
): Promise<NormalizedDraftExam> {
  const response = await ai.run("@cf/meta/llama-3.1-70b-instruct" as any, {
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          `Topic: ${input.topic}`,
          input.subject ? `Subject: ${input.subject}` : null,
          input.gradeOrClass ? `Grade or class: ${input.gradeOrClass}` : null,
          `Difficulty: ${input.difficulty}`,
          `Question count: ${input.questionCount}`,
          input.instructions ? `Extra instructions: ${input.instructions}` : null,
          "Return JSON only.",
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ],
    max_tokens: 4096,
    temperature: 0.4,
  });

  return normalizeGeneratedExam(parseAiResponse(response), input);
}

function parseAiResponse(response: unknown): GeneratedExamPayload {
  let text = "";

  if (typeof response === "object" && response !== null && "response" in response) {
    text = String((response as { response: string }).response ?? "");
  } else if (typeof response === "string") {
    text = response;
  }

  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI exam generator returned malformed JSON");
  }

  try {
    return JSON.parse(text.slice(start, end + 1)) as GeneratedExamPayload;
  } catch {
    throw new Error("AI exam generator returned unparsable JSON");
  }
}

function normalizeGeneratedExam(
  payload: GeneratedExamPayload,
  input: ExamGeneratorRequest,
): NormalizedDraftExam {
  const questions = Array.isArray(payload.questions) ? payload.questions : [];
  const normalizedQuestions = questions
    .filter((question) => question && typeof question.questionText === "string")
    .map((question) => normalizeQuestion(question))
    .filter((question): question is NormalizedDraftQuestion => Boolean(question));

  if (normalizedQuestions.length !== input.questionCount) {
    throw new Error(
      `AI exam generator returned ${normalizedQuestions.length} questions instead of ${input.questionCount}`,
    );
  }

  return {
    title: payload.title?.trim() || buildFallbackTitle(input),
    description: payload.description?.trim() || null,
    questions: normalizedQuestions,
  };
}

function normalizeQuestion(
  question: GeneratedQuestion,
): NormalizedDraftQuestion | null {
  const questionText = question.questionText?.trim();
  if (!questionText) return null;

  const points = Math.max(1, Math.floor(Number(question.points ?? 1)));

  if (question.type === "multiple_choice" || question.type === "true_false") {
    const normalizedOptions = normalizeChoiceOptions(question);
    if (!normalizedOptions) return null;

    return {
      id: newId(),
      text: questionText,
      type: "mcq",
      options: normalizedOptions.options,
      correctAnswer: normalizedOptions.correctAnswer,
      points,
    };
  }

  return {
    id: newId(),
    text: questionText,
    type: "text",
    correctAnswer: question.correctAnswerText?.trim() || "",
    points,
  };
}

function normalizeChoiceOptions(question: GeneratedQuestion) {
  const rawOptions = Array.isArray(question.options) ? question.options : [];
  const options = rawOptions
    .map((option) => option?.text?.trim())
    .filter((value): value is string => Boolean(value));

  if (question.type === "true_false" && options.length < 2) {
    const fallback =
      question.correctAnswerText?.toLowerCase() === "false"
        ? "False"
        : "True";
    return {
      options: ["True", "False"],
      correctAnswer: fallback === "False" ? "False" : "True",
    };
  }

  const correctOption =
    rawOptions.find((option) => option?.isCorrect)?.text?.trim() ||
    question.correctAnswerText?.trim() ||
    options[0];

  if (!options.length || !correctOption) return null;

  return {
    options,
    correctAnswer: correctOption,
  };
}

function buildFallbackTitle(input: ExamGeneratorRequest) {
  const subject = input.subject?.trim();
  if (subject) return `${subject} ${capitalize(input.topic.trim())} Exam`;
  return `${capitalize(input.topic.trim())} Exam`;
}

function capitalize(value: string) {
  if (!value) return "Generated";
  return value.charAt(0).toUpperCase() + value.slice(1);
}
