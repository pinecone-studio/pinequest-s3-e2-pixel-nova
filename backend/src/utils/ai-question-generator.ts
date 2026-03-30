export interface GeneratedOption {
  label: string;
  text: string;
  isCorrect: boolean;
}

export interface GeneratedQuestion {
  type: "multiple_choice" | "short_answer" | "open_ended";
  questionText: string;
  options: GeneratedOption[];
  correctAnswerText: string | null;
  evidence: string;
  explanation: string;
}

export interface GeneratedQuestionResult {
  questions: GeneratedQuestion[];
  metadata: {
    generatedCount: number;
    requestedCounts: {
      mcq: number;
      text: number;
      open: number;
    };
  };
}

type GenerationCounts = {
  mcq: number;
  text: number;
  open: number;
};

const buildSystemPrompt = (counts: GenerationCounts) => `You are an expert academic exam generator and verifier.

Your task is to read the provided study material and generate accurate exam questions with verified correct answers.

TASK:
Generate questions based strictly on the provided material with this exact target mix:
- multiple_choice: ${counts.mcq}
- short_answer: ${counts.text}
- open_ended: ${counts.open}

STRICT RULES:
- Every question must be derived directly from the provided material.
- Do not invent, infer, or assume information not clearly stated in the text.
- For multiple_choice questions, include exactly four options A, B, C, D and only one correct answer.
- For short_answer and open_ended questions, options must be an empty array.
- The correct answer must be explicitly supported by the material.
- If the material does not clearly support a question, do not generate that question.
- If the material is insufficient, return fewer questions rather than guessing.

VERIFICATION STEP:
- Re-check the study material for every question.
- Include the exact supporting sentence from the material as evidence.
- Explanations must be short and based strictly on the material.

OUTPUT RULES:
- Return valid JSON only.
- Do not include markdown.
- Do not include commentary outside JSON.
- Use this exact structure:
{
  "questions": [
    {
      "type": "multiple_choice" | "short_answer" | "open_ended",
      "questionText": "...",
      "options": [
        { "label": "A", "text": "...", "isCorrect": false },
        { "label": "B", "text": "...", "isCorrect": true },
        { "label": "C", "text": "...", "isCorrect": false },
        { "label": "D", "text": "...", "isCorrect": false }
      ],
      "correctAnswerText": "For short/open questions, the exact correct answer text. For multiple_choice, null.",
      "evidence": "Exact sentence from the material.",
      "explanation": "Short explanation based strictly on the material."
    }
  ]
}`;

export async function generateQuestionsFromMaterial(
  ai: Ai,
  source: string | string[],
  counts: GenerationCounts,
): Promise<GeneratedQuestionResult> {
  const material = Array.isArray(source) ? source.filter(Boolean).join("\n\n") : source;
  const requestedTotal = counts.mcq + counts.text + counts.open;

  if (!material.trim() || requestedTotal <= 0) {
    return {
      questions: [],
      metadata: {
        generatedCount: 0,
        requestedCounts: counts,
      },
    };
  }

  const response = await ai.run("@cf/meta/llama-3.1-70b-instruct" as any, {
    messages: [
      { role: "system", content: buildSystemPrompt(counts) },
      {
        role: "user",
        content: `Study material:\n"""\n${material}\n"""`,
      },
    ],
    max_tokens: 4096,
    temperature: 0.1,
  });

  const questions = parseGeneratedResponse(response).slice(0, requestedTotal);

  return {
    questions,
    metadata: {
      generatedCount: questions.length,
      requestedCounts: counts,
    },
  };
}

function parseGeneratedResponse(response: unknown): GeneratedQuestion[] {
  let text = "";

  if (typeof response === "object" && response !== null && "response" in response) {
    text = (response as { response: string }).response;
  } else if (typeof response === "string") {
    text = response;
  } else {
    return [];
  }

  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return [];

  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    const items = Array.isArray(parsed?.questions) ? parsed.questions : [];

    return items
      .filter((item: any) => item && typeof item.questionText === "string")
      .map((item: any) => {
        const type =
          item.type === "short_answer" || item.type === "open_ended"
            ? item.type
            : "multiple_choice";
        const rawOptions = Array.isArray(item.options) ? item.options : [];
        const options = rawOptions
          .map((option: any) => ({
            label: String(option?.label ?? "").trim(),
            text: String(option?.text ?? "").trim(),
            isCorrect: Boolean(option?.isCorrect),
          }))
          .filter((option: any) => option.label && option.text);

        return {
          type,
          questionText: String(item.questionText ?? "").trim(),
          options,
          correctAnswerText:
            item.correctAnswerText == null ? null : String(item.correctAnswerText).trim(),
          evidence: String(item.evidence ?? "").trim(),
          explanation: String(item.explanation ?? "").trim(),
        } satisfies GeneratedQuestion;
      })
      .filter((question: GeneratedQuestion) => {
        if (!question.questionText || !question.evidence) return false;
        if (question.type === "multiple_choice") {
          const correctCount = question.options.filter((option: GeneratedOption) => option.isCorrect).length;
          return question.options.length === 4 && correctCount === 1;
        }
        return Boolean(question.correctAnswerText);
      });
  } catch {
    return [];
  }
}
