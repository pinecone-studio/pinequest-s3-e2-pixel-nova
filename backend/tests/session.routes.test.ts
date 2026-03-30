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

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        status: "active",
        entryStatus: "on_time",
        exam: {
          id: "exam-1",
          title: "Algebra Final",
          durationMin: 45,
          questionCount: 0,
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

  it("allows late or joined students to answer against the shared exam timer", async () => {
    queueDbResults(
      [{ id: "student-1", fullName: "Nora Student" }],
      [{ id: "session-1", examId: "exam-1", status: "late", startedAt: null }],
      [{ id: "exam-1", durationMin: 45, startedAt: "2026-03-30T10:00:00.000Z", scheduledAt: "2026-03-30T10:00:00.000Z" }],
      undefined,
      [],
      undefined,
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

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        answerId: "test-id",
        updated: false,
      },
    });
  });

  it("accepts batched answer writes and persists each pending answer once", async () => {
    queueDbResults(
      [{ id: "student-1", fullName: "Nora Student" }],
      [{ id: "session-1", examId: "exam-1", status: "in_progress", startedAt: "2026-03-30T10:00:00.000Z" }],
      [{ id: "exam-1", durationMin: 45, startedAt: "2026-03-30T10:00:00.000Z", scheduledAt: "2026-03-30T10:00:00.000Z" }],
      [],
      undefined,
      [],
      undefined,
    );

    const response = await app.request(
      "http://localhost/api/sessions/session-1/answer",
      jsonRequest(
        {
          answers: [
            { questionId: "question-1", textAnswer: "4" },
            { questionId: "question-2", textAnswer: "6" },
          ],
        },
        studentHeaders(),
      ),
      workerEnv,
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        answers: [
          { questionId: "question-1", answerId: "test-id", updated: false },
          { questionId: "question-2", answerId: "test-id", updated: false },
        ],
        count: 2,
      },
    });
  });
});
