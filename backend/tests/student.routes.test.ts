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
        { studentId: "student-1", fullName: "Nora Student", level: 3, score: 90 },
        { studentId: "student-1", fullName: "Nora Student", level: 3, score: 70 },
        { studentId: "student-2", fullName: "Ariunaa Student", level: 4, score: 95 },
        { studentId: "student-2", fullName: "Ariunaa Student", level: 4, score: 85 },
        { studentId: "student-3", fullName: "Bold Student", level: 2, score: 60 },
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

  it("returns the progress leaderboard ranked by average score", async () => {
    queueDbResults(
      [{ id: "student-1", fullName: "Nora Student" }],
      [
        { studentId: "student-1", fullName: "Nora Student", level: 3, score: 95 },
        { studentId: "student-1", fullName: "Nora Student", level: 3, score: 90 },
        { studentId: "student-2", fullName: "Ariunaa Student", level: 4, score: 100 },
        { studentId: "student-2", fullName: "Ariunaa Student", level: 4, score: 88 },
        { studentId: "student-3", fullName: "Bold Student", level: 2, score: 75 },
      ],
    );

    const response = await app.request(
      "http://localhost/api/student/progress-leaderboard",
      {
        headers: studentHeaders(),
      },
      workerEnv,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: [
        {
          id: "student-2",
          fullName: "Ariunaa Student",
          level: 4,
          rank: 1,
          averageScore: 94,
          examCount: 2,
        },
        {
          id: "student-1",
          fullName: "Nora Student",
          level: 3,
          rank: 2,
          averageScore: 92.5,
          examCount: 2,
        },
        {
          id: "student-3",
          fullName: "Bold Student",
          level: 2,
          rank: 3,
          averageScore: 75,
          examCount: 1,
        },
      ],
    });
  });
});
