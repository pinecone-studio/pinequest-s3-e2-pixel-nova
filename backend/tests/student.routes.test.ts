import {
  queueDbResults,
  resetDbMock,
  studentHeaders,
  workerEnv,
} from "./helpers/mock-db";
import app from "../src/index";

describe("student routes", () => {
  beforeEach(() => {
    resetDbMock();
  });

  it("returns the current student's term rank summary", async () => {
    queueDbResults(
      [{ id: "student-1", fullName: "Nora Student" }],
      [
        { studentId: "student-1", score: 90 },
        { studentId: "student-1", score: 70 },
        { studentId: "student-2", score: 95 },
        { studentId: "student-2", score: 85 },
        { studentId: "student-3", score: 60 },
      ],
    );

    const response = await app.request(
      "http://localhost/api/student/term-rank",
      {
        headers: studentHeaders(),
      },
      workerEnv,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        rank: 2,
        totalStudents: 3,
        termExamCount: 2,
      },
    });
  });
});
