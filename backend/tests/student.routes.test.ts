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

  it("returns the current student's term XP rank summary", async () => {
    queueDbResults(
      [{ id: "student-1", fullName: "Nora Student" }],
      [
        { studentId: "student-1", fullName: "Nora Student", avatarUrl: null, termXp: 120, progressXp: 40 },
        { studentId: "student-2", fullName: "Ariunaa Student", avatarUrl: null, termXp: 180, progressXp: 60 },
        { studentId: "student-3", fullName: "Bold Student", avatarUrl: null, termXp: 90, progressXp: 20 },
      ],
      [{ sessionId: "session-1" }, { sessionId: "session-2" }],
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
        xp: 120,
        level: 2,
      },
    });
  });

  it("returns the public term XP leaderboard", async () => {
    queueDbResults(
      [{ id: "student-1", fullName: "Nora Student" }],
      [
        { studentId: "student-1", fullName: "Nora Student", avatarUrl: null, termXp: 120, progressXp: 40 },
        { studentId: "student-2", fullName: "Ariunaa Student", avatarUrl: null, termXp: 180, progressXp: 60 },
        { studentId: "student-3", fullName: "Bold Student", avatarUrl: null, termXp: 90, progressXp: 20 },
      ],
    );

    const response = await app.request(
      "http://localhost/api/student/term-leaderboard",
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
          avatarUrl: null,
          level: 2,
          rank: 1,
          xp: 180,
        },
        {
          id: "student-1",
          fullName: "Nora Student",
          avatarUrl: null,
          level: 2,
          rank: 2,
          xp: 120,
        },
        {
          id: "student-3",
          fullName: "Bold Student",
          avatarUrl: null,
          level: 1,
          rank: 3,
          xp: 90,
        },
      ],
    });
  });

  it("returns the current student's private progress XP rank", async () => {
    queueDbResults(
      [{ id: "student-1", fullName: "Nora Student" }],
      [
        { studentId: "student-1", fullName: "Nora Student", avatarUrl: null, termXp: 120, progressXp: 80 },
        { studentId: "student-2", fullName: "Ariunaa Student", avatarUrl: null, termXp: 180, progressXp: 140 },
        { studentId: "student-3", fullName: "Bold Student", avatarUrl: null, termXp: 90, progressXp: 100 },
      ],
      [{ sessionId: "progress-1" }, { sessionId: "progress-2" }, { sessionId: "progress-3" }],
    );

    const response = await app.request(
      "http://localhost/api/student/progress-rank",
      {
        headers: studentHeaders(),
      },
      workerEnv,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        rank: 3,
        totalStudents: 3,
        progressExamCount: 3,
        xp: 80,
        level: 1,
        isPrivate: true,
      },
    });
  });

  it("returns the separate improvement leaderboard with growth XP", async () => {
    queueDbResults(
      [{ id: "student-1", fullName: "Nora Student" }],
      [
        {
          studentId: "student-1",
          fullName: "Nora Student",
          status: "graded",
          score: 60,
          submittedAt: "2026-03-01T10:00:00.000Z",
          startedAt: "2026-03-01T09:50:00.000Z",
          createdAt: "2026-03-01T09:45:00.000Z",
        },
        {
          studentId: "student-1",
          fullName: "Nora Student",
          status: "graded",
          score: 75,
          submittedAt: "2026-03-08T10:00:00.000Z",
          startedAt: "2026-03-08T09:50:00.000Z",
          createdAt: "2026-03-08T09:45:00.000Z",
        },
        {
          studentId: "student-2",
          fullName: "Ariunaa Student",
          status: "graded",
          score: 100,
          submittedAt: "2026-03-01T10:00:00.000Z",
          startedAt: "2026-03-01T09:50:00.000Z",
          createdAt: "2026-03-01T09:45:00.000Z",
        },
        {
          studentId: "student-2",
          fullName: "Ariunaa Student",
          status: "graded",
          score: 100,
          submittedAt: "2026-03-08T10:00:00.000Z",
          startedAt: "2026-03-08T09:50:00.000Z",
          createdAt: "2026-03-08T09:45:00.000Z",
        },
        {
          studentId: "student-3",
          fullName: "Bold Student",
          status: "joined",
          score: null,
          submittedAt: null,
          startedAt: null,
          createdAt: "2026-03-01T09:45:00.000Z",
        },
      ],
    );

    const response = await app.request(
      "http://localhost/api/student/improvement-leaderboard",
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
          id: "student-1",
          fullName: "Nora Student",
          level: 1,
          rank: 1,
          xp: 15,
          examCount: 2,
          improvementCount: 1,
          missedCount: 0,
        },
        {
          id: "student-2",
          fullName: "Ariunaa Student",
          level: 1,
          rank: 2,
          xp: 10,
          examCount: 2,
          improvementCount: 1,
          missedCount: 0,
        },
        {
          id: "student-3",
          fullName: "Bold Student",
          level: 1,
          rank: 3,
          xp: -10,
          examCount: 1,
          improvementCount: 0,
          missedCount: 1,
        },
      ],
    });
  });
});
