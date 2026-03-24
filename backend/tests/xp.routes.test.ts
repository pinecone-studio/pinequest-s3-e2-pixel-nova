import {
  queueDbResults,
  resetDbMock,
  studentHeaders,
  teacherHeaders,
  workerEnv,
} from "./helpers/mock-db";
import app from "../src/index";

describe("xp routes", () => {
  beforeEach(() => {
    resetDbMock();
  });

  it("returns derived XP profile fields for students", async () => {
    queueDbResults(
      [{ id: "student-1", fullName: "Nora Student" }],
      [{ id: "student-1", fullName: "Nora Student", xp: 250 }],
    );

    const response = await app.request(
      "http://localhost/api/xp/profile",
      {
        headers: studentHeaders(),
      },
      workerEnv,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        id: "student-1",
        fullName: "Nora Student",
        xp: 250,
        level: 2,
        xpForNextLevel: 400,
        xpProgress: 50,
      },
    });
  });

  it("returns a ranked leaderboard for authenticated users", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Ada Teacher" }],
      [
        { id: "student-1", fullName: "Nora Student", avatarUrl: null, xp: 250 },
        { id: "student-2", fullName: "Odon Student", avatarUrl: null, xp: 90 },
      ],
    );

    const response = await app.request(
      "http://localhost/api/xp/leaderboard",
      {
        headers: teacherHeaders(),
      },
      workerEnv,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: [
        {
          rank: 1,
          id: "student-1",
          fullName: "Nora Student",
          avatarUrl: null,
          xp: 250,
          level: 2,
        },
        {
          rank: 2,
          id: "student-2",
          fullName: "Odon Student",
          avatarUrl: null,
          xp: 90,
          level: 1,
        },
      ],
    });
  });
});
