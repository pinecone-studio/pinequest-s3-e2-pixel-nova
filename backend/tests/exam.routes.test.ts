import {
  mockDb,
  jsonRequest,
  queueDbResults,
  resetDbMock,
  studentHeaders,
  teacherHeaders,
  workerEnv,
} from "./helpers/mock-db";
import app from "../src/index";

describe("exam routes", () => {
  beforeEach(() => {
    resetDbMock();
  });

  it("blocks students from teacher-only exam routes", async () => {
    queueDbResults([{ id: "student-1", fullName: "Nora Student" }]);

    const response = await app.request(
      "http://localhost/api/exams",
      {
        headers: studentHeaders(),
      },
      workerEnv,
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "This action requires 'teacher' role",
      },
    });
  });

  it("creates an exam for an authenticated teacher", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Ada Teacher" }],
      [{ id: "math-1" }],
      undefined,
      [{
        id: "exam-1",
        teacherId: "teacher-1",
        subjectId: "math-1",
        title: "Algebra Final",
        description: "Quarter-end exam",
        durationMin: 45,
        passScore: 70,
        shuffleQuestions: true,
        enabledCheatDetections: '["tab_switch","copy_paste"]',
      }],
    );

    const response = await app.request(
      "http://localhost/api/exams",
      {
        ...jsonRequest(
          {
            subjectId: "math-1",
            title: "Algebra Final",
            description: "Quarter-end exam",
            durationMin: 45,
            passScore: 70,
            shuffleQuestions: true,
          },
          teacherHeaders(),
        ),
      },
      workerEnv,
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        id: "exam-1",
        teacherId: "teacher-1",
        subjectId: "math-1",
        title: "Algebra Final",
        description: "Quarter-end exam",
        durationMin: 45,
        passScore: 70,
        shuffleQuestions: true,
        enabledCheatDetections: ["tab_switch", "copy_paste"],
      },
    });
  });

  it("defaults exam cheat detections to the full allowlist", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Ada Teacher" }],
      [{ id: "math-1" }],
      undefined,
      [{
        id: "exam-1",
        teacherId: "teacher-1",
        subjectId: "math-1",
        title: "Algebra Final",
        enabledCheatDetections:
          '["tab_switch","tab_hidden","window_blur","copy_paste","right_click","screen_capture","devtools_open","multiple_monitors","suspicious_resize","rapid_answers","idle_too_long","face_missing","multiple_faces","looking_away","looking_down","camera_blocked"]',
      }],
    );

    const response = await app.request(
      "http://localhost/api/exams",
      {
        ...jsonRequest(
          {
            subjectId: "math-1",
            title: "Algebra Final",
          },
          teacherHeaders(),
        ),
      },
      workerEnv,
    );

    expect(response.status).toBe(201);
    const payload: any = await response.json();
    expect(payload.data.enabledCheatDetections).toHaveLength(16);
    expect(payload.data.enabledCheatDetections).toContain("tab_switch");
    expect(payload.data.enabledCheatDetections).toContain("camera_blocked");
  });

  it("blocks cheat detection updates after an exam starts", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Ada Teacher" }],
      [
        {
          id: "exam-1",
          teacherId: "teacher-1",
          title: "Active exam",
          status: "active",
          enabledCheatDetections:
            '["tab_switch","copy_paste","camera_blocked"]',
        },
      ],
    );

    const response = await app.request(
      "http://localhost/api/exams/exam-1",
      {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          ...teacherHeaders(),
        },
        body: JSON.stringify({
          enabledCheatDetections: ["tab_switch"],
        }),
      },
      workerEnv,
    );

    expect(response.status).toBe(400);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("lists the current teacher's exams", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Ada Teacher" }],
      [
        { id: "exam-1", title: "Algebra Final", status: "draft" },
        { id: "exam-2", title: "Geometry Quiz", status: "scheduled" },
      ],
    );

    const response = await app.request(
      "http://localhost/api/exams",
      {
        headers: teacherHeaders(),
      },
      workerEnv,
    );

    expect(response.status).toBe(200);
    const payload: any = await response.json();
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "exam-1",
          title: "Algebra Final",
          status: "draft",
        }),
        expect.objectContaining({
          id: "exam-2",
          title: "Geometry Quiz",
          status: "scheduled",
        }),
      ]),
    );
    expect(payload.data[0].enabledCheatDetections).toHaveLength(16);
  });

  it("batch creates exam questions with bulk inserts", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Ada Teacher" }],
      [{ id: "exam-1", teacherId: "teacher-1", title: "Algebra Final" }],
      [{ id: "existing-question" }],
    );

    const response = await app.request(
      "http://localhost/api/exams/exam-1/questions/batch",
      {
        ...jsonRequest(
          {
            questions: [
              {
                type: "mcq",
                questionText: "2 + 2 = ?",
                correctAnswerText: "4",
                points: 2,
                options: [
                  { label: "A", text: "3", isCorrect: false },
                  { label: "B", text: "4", isCorrect: true },
                ],
              },
              {
                type: "text",
                questionText: "Name a prime number",
                correctAnswerText: "2",
                points: 1,
              },
            ],
          },
          teacherHeaders(),
        ),
      },
      workerEnv,
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        created: 2,
        questions: [
          { questionId: "test-id", orderIndex: 1 },
          { questionId: "test-id", orderIndex: 2 },
        ],
      },
    });

    expect(mockDb.insert).toHaveBeenCalledTimes(2);
    const insertCalls = mockDb.insert.mock.calls as unknown as Array<
      [Record<string, unknown>]
    >;
    expect(insertCalls[0]?.[0]).toMatchObject({ questionText: "questionText" });
    expect(insertCalls[1]?.[0]).toMatchObject({ questionId: "questionId" });
  });
});
