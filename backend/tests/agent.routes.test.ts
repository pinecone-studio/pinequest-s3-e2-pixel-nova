import {
  jsonRequest,
  queueDbResults,
  resetDbMock,
  studentHeaders,
  teacherHeaders,
  workerEnv,
} from "./helpers/mock-db";
import app from "../src/index";

describe("agent routes", () => {
  beforeEach(() => {
    resetDbMock();
  });

  it("blocks students from teacher agent routes", async () => {
    queueDbResults([{ id: "student-1", fullName: "Nora Student" }]);

    const response = await app.request(
      "http://localhost/api/agent/exam-generator/generate",
      jsonRequest(
        {
          topic: "Algebra",
          difficulty: "medium",
          questionCount: 5,
        },
        studentHeaders(),
      ),
      workerEnv,
    );

    expect(response.status).toBe(403);
  });

  it("returns a normalized generated draft", async () => {
    queueDbResults([{ id: "teacher-1", fullName: "Ada Teacher" }]);
    workerEnv.AI.run.mockResolvedValue({
      response: JSON.stringify({
        title: "Algebra Practice",
        description: "Generated exam",
        questions: [
          {
            type: "multiple_choice",
            questionText: "2 + 2 = ?",
            options: [
              { label: "A", text: "3", isCorrect: false },
              { label: "B", text: "4", isCorrect: true },
              { label: "C", text: "5", isCorrect: false },
              { label: "D", text: "6", isCorrect: false },
            ],
            correctAnswerText: "4",
            points: 1,
          },
          {
            type: "short_answer",
            questionText: "Name a prime number greater than 2",
            correctAnswerText: "3",
            points: 2,
          },
        ],
      }),
    });

    const response = await app.request(
      "http://localhost/api/agent/exam-generator/generate",
      jsonRequest(
        {
          topic: "Algebra",
          subject: "Math",
          gradeOrClass: "Grade 8",
          difficulty: "medium",
          questionCount: 2,
        },
        teacherHeaders(),
      ),
      workerEnv,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        draft: {
          title: "Algebra Practice",
          description: "Generated exam",
          questions: [
            {
              type: "mcq",
              text: "2 + 2 = ?",
              correctAnswer: "4",
              points: 1,
            },
            {
              type: "text",
              text: "Name a prime number greater than 2",
              correctAnswer: "3",
              points: 2,
            },
          ],
        },
      },
    });
  });

  it("returns a clean error when AI output is malformed", async () => {
    queueDbResults([{ id: "teacher-1", fullName: "Ada Teacher" }]);
    workerEnv.AI.run.mockResolvedValue({ response: "not-json" });

    const response = await app.request(
      "http://localhost/api/agent/exam-generator/generate",
      jsonRequest(
        {
          topic: "Biology",
          difficulty: "easy",
          questionCount: 3,
        },
        teacherHeaders(),
      ),
      workerEnv,
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: {
        code: "AI_GENERATION_FAILED",
      },
    });
  });

  it("persists accepted drafts only on save", async () => {
    queueDbResults([{ id: "teacher-1", fullName: "Ada Teacher" }]);

    const response = await app.request(
      "http://localhost/api/agent/exam-generator/save",
      jsonRequest(
        {
          generatorInput: {
            topic: "Geometry",
            subject: "Math",
            gradeOrClass: "Grade 7",
            difficulty: "medium",
            questionCount: 1,
          },
          draft: {
            title: "Geometry Check",
            description: null,
            questions: [
              {
                id: "draft-q1",
                text: "A triangle has how many sides?",
                type: "mcq",
                options: ["2", "3", "4", "5"],
                correctAnswer: "3",
                points: 1,
              },
            ],
          },
        },
        teacherHeaders(),
      ),
      workerEnv,
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        id: "test-id",
        status: "accepted",
      },
    });
  });
});
