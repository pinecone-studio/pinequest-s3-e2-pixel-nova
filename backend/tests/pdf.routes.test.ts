import {
  jsonRequest,
  queueDbResults,
  resetDbMock,
  teacherHeaders,
  studentHeaders,
  workerEnv,
} from "./helpers/mock-db";
import app from "../src/index";

// Mock pdf-parse v2 class-based API
jest.mock("pdf-parse", () => ({
  __esModule: true,
  PDFParse: jest.fn().mockImplementation(() => ({
    getInfo: jest.fn(() =>
      Promise.resolve({ total: 1, pages: [] }),
    ),
    getText: jest.fn(() =>
      Promise.resolve({
        text: "1. What is 2+2?\nA) 3\nB) 4\nC) 5\nD) 6\nCorrect: B",
        pages: [{ num: 1, text: "1. What is 2+2?\nA) 3\nB) 4\nC) 5\nD) 6\nCorrect: B" }],
        total: 1,
      }),
    ),
    destroy: jest.fn(() => Promise.resolve()),
  })),
}));

// Mock R2 bucket
const mockR2 = {
  put: jest.fn(() => Promise.resolve()),
  get: jest.fn(() =>
    Promise.resolve({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
    }),
  ),
};

// Mock AI
const mockAi = {
  run: jest.fn(() =>
    Promise.resolve({
      response: JSON.stringify([
        {
          type: "multiple_choice",
          questionText: "What is 2+2?",
          options: [
            { label: "A", text: "3", isCorrect: false },
            { label: "B", text: "4", isCorrect: true },
            { label: "C", text: "5", isCorrect: false },
            { label: "D", text: "6", isCorrect: false },
          ],
          difficulty: "easy",
          correctAnswerText: null,
          needsReview: false,
        },
      ]),
    }),
  ),
};

// Patch workerEnv with R2 and AI mocks
const pdfEnv = {
  ...workerEnv,
  EXAM_FILES: mockR2,
  AI: mockAi,
} as any;

describe("pdf routes", () => {
  beforeEach(() => {
    resetDbMock();
    mockR2.put.mockClear();
    mockR2.get.mockClear();
    mockAi.run.mockClear();
  });

  it("POST /api/pdf/upload rejects non-PDF files", async () => {
    const formData = new FormData();
    formData.append("file", new File(["hello"], "test.txt", { type: "text/plain" }));

    const res = await app.request(
      "http://localhost/api/pdf/upload",
      {
        method: "POST",
        headers: teacherHeaders(),
        body: formData,
      },
      pdfEnv,
    );

    expect(res.status).toBe(400);
    const json: any = await res.json();
    expect(json.error.message).toContain("PDF");
  });

  it("POST /api/pdf/extract returns structured questions", async () => {
    const res = await app.request(
      "http://localhost/api/pdf/extract",
      jsonRequest({ fileKey: "test-file-key" }, teacherHeaders()),
      pdfEnv,
    );

    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.data.questions).toHaveLength(1);
    expect(json.data.questions[0].type).toBe("multiple_choice");
    expect(json.data.metadata.questionsFound).toBe(1);
  });

  it("POST /api/pdf/extract returns 404 for missing file", async () => {
    mockR2.get.mockResolvedValueOnce(null as any);

    const res = await app.request(
      "http://localhost/api/pdf/extract",
      jsonRequest({ fileKey: "nonexistent" }, teacherHeaders()),
      pdfEnv,
    );

    expect(res.status).toBe(404);
  });

  it("POST /api/pdf/confirm saves questions to exam", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Test Teacher" }], // auth
      [{ id: "exam-1", teacherId: "teacher-1" }], // exam lookup
      [{ count: 0 }], // existing question count
      undefined, // insert question
      undefined, // insert options
    );

    const res = await app.request(
      "http://localhost/api/pdf/confirm",
      jsonRequest(
        {
          destination: "exam",
          examId: "exam-1",
          questions: [
            {
              type: "multiple_choice",
              questionText: "What is 2+2?",
              options: [
                { label: "A", text: "3", isCorrect: false },
                { label: "B", text: "4", isCorrect: true },
              ],
              difficulty: "easy",
            },
          ],
        },
        teacherHeaders(),
      ),
      pdfEnv,
    );

    expect(res.status).toBe(201);
    const json: any = await res.json();
    expect(json.data.saved).toBe(1);
    expect(json.data.destination).toBe("exam");
    expect(json.data.ids).toHaveLength(1);
  });

  it("POST /api/pdf/confirm saves questions to question bank", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Test Teacher" }], // auth
      [{ id: "subj-1", name: "Math" }], // subject lookup
      undefined, // insert bank question
      undefined, // insert bank options
    );

    const res = await app.request(
      "http://localhost/api/pdf/confirm",
      jsonRequest(
        {
          destination: "question_bank",
          subjectId: "subj-1",
          questions: [
            {
              type: "short_answer",
              questionText: "What is the capital of Mongolia?",
              options: [],
              difficulty: "easy",
              correctAnswerText: "Ulaanbaatar",
            },
          ],
        },
        teacherHeaders(),
      ),
      pdfEnv,
    );

    expect(res.status).toBe(201);
    const json: any = await res.json();
    expect(json.data.saved).toBe(1);
    expect(json.data.destination).toBe("question_bank");
  });

  it("rejects student role on pdf endpoints", async () => {
    const res = await app.request(
      "http://localhost/api/pdf/extract",
      jsonRequest({ fileKey: "test" }, studentHeaders()),
      pdfEnv,
    );

    expect(res.status).toBe(403);
  });
});
