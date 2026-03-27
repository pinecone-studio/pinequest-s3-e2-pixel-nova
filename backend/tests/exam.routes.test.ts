import {
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
      },
    });
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
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: [
        { id: "exam-1", title: "Algebra Final", status: "draft" },
        { id: "exam-2", title: "Geometry Quiz", status: "scheduled" },
      ],
    });
  });
});
