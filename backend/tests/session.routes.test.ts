import {
  jsonRequest,
  queueDbResults,
  resetDbMock,
  studentHeaders,
  workerEnv,
} from "./helpers/mock-db";
import app from "../src/index";

describe("session routes", () => {
  beforeEach(() => {
    resetDbMock();
  });

  it("joins an active exam and returns session metadata", async () => {
    queueDbResults(
      [{ id: "student-1", fullName: "Nora Student" }],
      [{ id: "exam-1", title: "Algebra Final", durationMin: 45, status: "active" }],
      [],
      [{ count: 3 }],
      undefined,
    );

    const response = await app.request(
      "http://localhost/api/sessions/join",
      jsonRequest({ roomCode: "ROOM01" }, studentHeaders()),
      workerEnv,
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        sessionId: "test-id",
        exam: {
          id: "exam-1",
          title: "Algebra Final",
          durationMin: 45,
          questionCount: 3,
        },
      },
    });
  });

  it("hides correctness fields when a student fetches a session", async () => {
    queueDbResults(
      [{ id: "student-1", fullName: "Nora Student" }],
      [{ id: "session-1", examId: "exam-1", status: "joined", startedAt: null, submittedAt: null }],
      [{ id: "exam-1", title: "Algebra Final", description: "Practice", durationMin: 45 }],
      [
        {
          id: "question-1",
          type: "multiple_choice",
          questionText: "2 + 2 = ?",
          imageUrl: null,
          audioUrl: null,
          points: 1,
          orderIndex: 0,
          difficulty: "easy",
          topic: "addition",
        },
      ],
      [
        {
          id: "option-1",
          questionId: "question-1",
          label: "A",
          text: "4",
          imageUrl: null,
          orderIndex: 0,
        },
      ],
    );

    const response = await app.request(
      "http://localhost/api/sessions/session-1",
      {
        headers: studentHeaders(),
      },
      workerEnv,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        session: {
          id: "session-1",
          status: "joined",
          startedAt: null,
          submittedAt: null,
        },
        exam: {
          id: "exam-1",
          title: "Algebra Final",
          description: "Practice",
          durationMin: 45,
        },
        questions: [
          {
            id: "question-1",
            type: "multiple_choice",
            questionText: "2 + 2 = ?",
            imageUrl: null,
            audioUrl: null,
            points: 1,
            orderIndex: 0,
            difficulty: "easy",
            topic: "addition",
            options: [
              {
                id: "option-1",
                questionId: "question-1",
                label: "A",
                text: "4",
                imageUrl: null,
                orderIndex: 0,
              },
            ],
          },
        ],
      },
    });
  });

  it("rejects answers when the session is not in progress", async () => {
    queueDbResults(
      [{ id: "student-1", fullName: "Nora Student" }],
      [{ id: "session-1", examId: "exam-1", status: "joined" }],
    );

    const response = await app.request(
      "http://localhost/api/sessions/session-1/answer",
      jsonRequest(
        {
          questionId: "question-1",
          selectedOptionId: "option-1",
        },
        studentHeaders(),
      ),
      workerEnv,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "INVALID_STATUS",
        message: "Session is not in progress",
      },
    });
  });
});
