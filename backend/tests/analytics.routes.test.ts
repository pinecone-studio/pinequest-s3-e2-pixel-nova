import {
  queueDbResults,
  resetDbMock,
  studentHeaders,
  teacherHeaders,
  workerEnv,
} from "./helpers/mock-db";
import app from "../src/index";

describe("analytics routes", () => {
  beforeEach(() => {
    resetDbMock();
  });

  it("blocks students from teacher analytics", async () => {
    queueDbResults([{ id: "student-1", fullName: "Nora Student" }]);

    const response = await app.request(
      "http://localhost/api/analytics/dashboard",
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

  it("returns the dashboard summary with rounded averages", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Ada Teacher" }],
      [{ count: 4 }],
      [{ count: 32 }],
      [{ count: 1 }],
      [
        {
          id: "exam-1",
          title: "Algebra Final",
          status: "finished",
          createdAt: "2026-03-20T10:00:00.000Z",
          studentCount: 28,
          averageScore: 78.456,
        },
      ],
    );

    const response = await app.request(
      "http://localhost/api/analytics/dashboard",
      {
        headers: teacherHeaders(),
      },
      workerEnv,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        totalExams: 4,
        totalStudents: 32,
        activeExams: 1,
        recentExams: [
          {
            id: "exam-1",
            title: "Algebra Final",
            status: "finished",
            createdAt: "2026-03-20T10:00:00.000Z",
            studentCount: 28,
            averageScore: 78.46,
          },
        ],
      },
    });
  });
});
