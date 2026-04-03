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
      [{
        id: "exam-1",
        title: "Algebra Final",
        durationMin: 45,
        status: "active",
        requiresAudioRecording: 1,
        enabledCheatDetections: '["tab_switch","camera_blocked"]',
      }],
      [{ fullName: "Б.Сундуйбасар" }],
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
          teacherName: "Б.Сундуйбасар",
          durationMin: 45,
          questionCount: 0,
          requiresAudioRecording: true,
          enabledCheatDetections: ["tab_switch", "camera_blocked"],
        },
      },
    });
  });

  it("requires location before joining a school-only exam", async () => {
    queueDbResults(
      [{ id: "student-1", fullName: "Nora Student" }],
      [
        {
          id: "exam-1",
          title: "Algebra Final",
          durationMin: 45,
          status: "active",
          locationPolicy: "school_only",
          locationLabel: "PineQuest сургууль",
          locationLatitude: 47.918873,
          locationLongitude: 106.917701,
          allowedRadiusMeters: 3000,
        },
      ],
      [{ fullName: "Б.Сундуйбасар" }],
    );

    const response = await app.request(
      "http://localhost/api/sessions/join",
      jsonRequest({ roomCode: "ROOM01" }, studentHeaders()),
      workerEnv,
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "LOCATION_REQUIRED",
        message: "PineQuest сургууль-ээс шалгалт өгөх тул байршлаа зөвшөөрнө үү.",
      },
    });
  });

  it("allows a student inside the allowed school radius to join", async () => {
    queueDbResults(
      [{ id: "student-1", fullName: "Nora Student" }],
      [
        {
          id: "exam-1",
          title: "Algebra Final",
          durationMin: 45,
          status: "active",
          locationPolicy: "school_only",
          locationLabel: "PineQuest сургууль",
          locationLatitude: 47.918873,
          locationLongitude: 106.917701,
          allowedRadiusMeters: 3000,
        },
      ],
      [{ fullName: "Б.Сундуйбасар" }],
      [{ count: 3 }],
      [],
      undefined,
      [{ teacherId: "teacher-1", title: "Algebra Final" }],
      [{ fullName: "Nora Student" }],
    );

    const response = await app.request(
      "http://localhost/api/sessions/join",
      jsonRequest(
        {
          roomCode: "ROOM01",
          location: {
            latitude: 47.918873,
            longitude: 106.917701,
            accuracy: 20,
          },
        },
        studentHeaders(),
      ),
      workerEnv,
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        sessionId: "test-id",
        status: "active",
        sessionStatus: "joined",
        entryStatus: "on_time",
        exam: {
          id: "exam-1",
          title: "Algebra Final",
          teacherName: "Б.Сундуйбасар",
          durationMin: 45,
          questionCount: 3,
          enabledCheatDetections: expect.any(Array),
        },
      },
    });
  });

  it("hides correctness fields when a student fetches a session", async () => {
    queueDbResults(
      [{ id: "student-1", fullName: "Nora Student" }],
      [{ id: "session-1", examId: "exam-1", status: "joined", startedAt: null, submittedAt: null }],
      [{
        id: "exam-1",
        title: "Algebra Final",
        description: "Practice",
        durationMin: 45,
        requiresAudioRecording: 1,
        enabledCheatDetections: '["tab_switch","camera_blocked"]',
      }],
      [{ fullName: "Б.Сундуйбасар" }],
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
      [
        {
          questionId: "question-1",
          selectedOptionId: "option-1",
          textAnswer: null,
          answeredAt: "2026-03-31T09:00:00.000Z",
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
          teacherName: "Б.Сундуйбасар",
          description: "Practice",
          durationMin: 45,
          requiresAudioRecording: true,
          enabledCheatDetections: ["tab_switch", "camera_blocked"],
        },
        answers: [
          {
            questionId: "question-1",
            selectedOptionId: "option-1",
            textAnswer: null,
            answeredAt: "2026-03-31T09:00:00.000Z",
          },
        ],
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
    const sharedStart = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    queueDbResults(
      [{ id: "student-1", fullName: "Nora Student" }],
      [{ id: "session-1", examId: "exam-1", status: "late", startedAt: null }],
      [{ id: "exam-1", durationMin: 45, startedAt: sharedStart, scheduledAt: sharedStart }],
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
    const sharedStart = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    queueDbResults(
      [{ id: "student-1", fullName: "Nora Student" }],
      [{ id: "session-1", examId: "exam-1", status: "in_progress", startedAt: sharedStart }],
      [{ id: "exam-1", durationMin: 45, startedAt: sharedStart, scheduledAt: sharedStart }],
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

  it("allows starting a required-audio exam even when audio is not ready", async () => {
    queueDbResults(
      [{ id: "student-1", fullName: "Nora Student" }],
      [{ id: "session-1", examId: "exam-1", status: "joined" }],
      [{ id: "exam-1", requiresAudioRecording: 1, status: "active" }],
      undefined,
    );

    const response = await app.request(
      "http://localhost/api/sessions/session-1/start",
      jsonRequest({}, studentHeaders()),
      workerEnv,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        sessionId: "session-1",
        status: "in_progress",
        startedAt: expect.any(String),
      },
    });
  });

});
