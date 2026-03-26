export interface ExtractedOption {
  label: string;
  text: string;
  isCorrect: boolean;
}

export interface ExtractedQuestion {
  index: number;
  type: "multiple_choice" | "true_false" | "short_answer";
  questionText: string;
  options: ExtractedOption[];
  difficulty: "easy" | "medium" | "hard";
  correctAnswerText: string | null;
  needsReview: boolean;
}

export interface ExtractionResult {
  questions: ExtractedQuestion[];
  metadata: {
    totalPages: number;
    questionsFound: number;
  };
}

const SYSTEM_PROMPT = `You are an exam question extractor. You receive raw text from a PDF exam and extract structured questions from it.

Rules:
- Output ONLY a valid JSON array. No markdown, no explanation, no wrapping.
- Each element follows this exact schema:
{
  "type": "multiple_choice" | "true_false" | "short_answer",
  "questionText": "the question text",
  "options": [{"label": "A", "text": "option text", "isCorrect": true/false}],
  "difficulty": "easy" | "medium" | "hard",
  "correctAnswerText": "for short_answer only, otherwise null",
  "needsReview": false
}
- For multiple_choice: extract all options (A, B, C, D etc). If the correct answer is marked (✓, *, bold, underline, "Correct answer: X", "Зөв хариулт: X"), set isCorrect: true for that option.
- For true_false: options should be [{"label":"A","text":"True","isCorrect":?},{"label":"B","text":"False","isCorrect":?}] or the Mongolian equivalents Үнэн/Худал.
- For short_answer: questions with no listed options. Set options to empty array. Put the answer in correctAnswerText if provided.
- If you cannot determine the correct answer, set all isCorrect to false and needsReview to true.
- Default difficulty to "medium" unless the exam indicates otherwise.
- Handle both Mongolian and English text.
- Preserve the original language of questions and options exactly as written.
- Respect page boundaries and question numbering. Never merge content from two different question numbers into one question.
- If a page contains an answer key or solution section, use it only to mark correct answers for already-extracted questions. Do not output answer-key rows as questions.
- If question text references a graph, diagram, figure, image, table, coordinate plane, or chart, keep that reference inside questionText instead of dropping it.
- When extraction confidence is low, keep the question but set needsReview to true.`;

/**
 * Send extracted PDF text to Workers AI and parse the response into structured questions.
 * Processes text in chunks if it exceeds the token-safe limit.
 */
export async function extractQuestions(
  ai: Ai,
  source: string | string[],
  pageCount: number,
): Promise<ExtractionResult> {
  const pages = Array.isArray(source) ? source : [source];
  const chunks = splitPagesIntoChunks(pages, 4500);

  const allQuestions: ExtractedQuestion[] = [];
  let globalIndex = 0;

  for (const chunk of chunks) {
    const response = await ai.run("@cf/meta/llama-3.1-70b-instruct" as any, {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content:
            `Extract all exam questions from this page chunk.\n` +
            `Page chunk:\n${chunk}\n\n` +
            `Return only JSON.`,
        },
      ],
      max_tokens: 4096,
      temperature: 0.1,
    });

    const parsed = parseAiResponse(response);
    for (const q of parsed) {
      q.index = globalIndex++;
      allQuestions.push(q);
    }
  }

  return {
    questions: allQuestions,
    metadata: {
      totalPages: pageCount,
      questionsFound: allQuestions.length,
    },
  };
}

/**
 * Parse the AI model response into ExtractedQuestion array.
 * Handles common response quirks (markdown fences, trailing text).
 */
function parseAiResponse(response: unknown): ExtractedQuestion[] {
  let text = "";

  if (typeof response === "object" && response !== null && "response" in response) {
    text = (response as { response: string }).response;
  } else if (typeof response === "string") {
    text = response;
  } else {
    return [];
  }

  // Strip markdown code fences if present
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // Find the JSON array in the response
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");

  if (start === -1 || end === -1 || end <= start) {
    return [];
  }

  try {
    const arr = JSON.parse(text.slice(start, end + 1));
    if (!Array.isArray(arr)) return [];

    return arr
      .filter(
        (q: any) =>
          q &&
          typeof q.questionText === "string" &&
          ["multiple_choice", "true_false", "short_answer"].includes(q.type),
      )
      .map((q: any, idx: number) => ({
        index: idx,
        type: q.type,
        questionText: q.questionText,
        options: Array.isArray(q.options)
          ? q.options.map((o: any) => ({
              label: String(o.label ?? ""),
              text: String(o.text ?? ""),
              isCorrect: Boolean(o.isCorrect),
            }))
          : [],
        difficulty: ["easy", "medium", "hard"].includes(q.difficulty)
          ? q.difficulty
          : "medium",
        correctAnswerText: q.correctAnswerText ?? null,
        needsReview: Boolean(q.needsReview),
      }));
  } catch {
    return [];
  }
}

/**
 * Split text into chunks, trying to break at paragraph boundaries.
 */
function splitPagesIntoChunks(pages: string[], maxSize: number): string[] {
  const chunks: string[] = [];
  let currentChunk = "";

  pages.forEach((pageText, pageIndex) => {
    const normalizedPage = pageText.trim();
    if (!normalizedPage) return;

    const decoratedPage = `[[PAGE ${pageIndex + 1}]]\n${normalizedPage}`;

    if (!currentChunk) {
      currentChunk = decoratedPage;
      return;
    }

    if (currentChunk.length + decoratedPage.length + 2 <= maxSize) {
      currentChunk = `${currentChunk}\n\n${decoratedPage}`;
      return;
    }

    chunks.push(currentChunk);

    if (decoratedPage.length <= maxSize) {
      currentChunk = decoratedPage;
      return;
    }

    const splitPageChunks = splitTextIntoChunks(decoratedPage, maxSize);
    const lastPageChunk = splitPageChunks.pop();
    chunks.push(...splitPageChunks);
    currentChunk = lastPageChunk ?? "";
  });

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

function splitTextIntoChunks(text: string, maxSize: number): string[] {
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxSize) {
      chunks.push(remaining);
      return chunks;
    }

    let breakPoint = remaining.lastIndexOf("\n\n", maxSize);
    if (breakPoint <= 0) breakPoint = remaining.lastIndexOf("\n", maxSize);
    if (breakPoint <= 0) breakPoint = maxSize;

    chunks.push(remaining.slice(0, breakPoint));
    remaining = remaining.slice(breakPoint).trimStart();
  }

  return chunks;
}
