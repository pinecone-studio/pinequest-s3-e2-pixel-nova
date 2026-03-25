import {
  jsonRequest,
  queueDbResults,
  resetDbMock,
  studentHeaders,
  workerEnv,
} from "./helpers/mock-db";
import app from "../src/index";

describe("auth routes", () => {
  beforeEach(() => {
    resetDbMock();
  });

  it("logs in a teacher when the code matches", async () => {
    queueDbResults([
      {
        id: "teacher-1",
        fullName: "Ada Teacher",
        email: "ada@example.com",
        avatarUrl: "https://cdn.example.com/ada.png",
      },
    ]);

    const response = await app.request(
      "http://localhost/api/auth/login",
      jsonRequest({ code: "T-1001" }),
      workerEnv,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        id: "teacher-1",
        fullName: "Ada Teacher",
        email: "ada@example.com",
        avatarUrl: "https://cdn.example.com/ada.png",
        role: "teacher",
      },
    });
  });

  it("returns unauthorized when no login code matches", async () => {
    queueDbResults([], []);

    const response = await app.request(
      "http://localhost/api/auth/login",
      jsonRequest({ code: "unknown" }),
      workerEnv,
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid code",
      },
    });
  });

  it("returns all teachers and students for /users", async () => {
    queueDbResults(
      [
        {
          id: "teacher-1",
          code: "T-1001",
          fullName: "Ada Teacher",
          email: "ada@example.com",
          avatarUrl: "https://cdn.example.com/ada.png",
        },
      ],
      [
        {
          id: "student-1",
          code: "S-2001",
          fullName: "Nora Student",
          email: "nora@example.com",
          avatarUrl: null,
          xp: 250,
          level: 2,
        },
      ],
    );

    const response = await app.request(
      "http://localhost/api/auth/users",
      undefined,
      workerEnv,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: [
        {
          id: "teacher-1",
          code: "T-1001",
          fullName: "Ada Teacher",
          email: "ada@example.com",
          avatarUrl: "https://cdn.example.com/ada.png",
          role: "teacher",
        },
        {
          id: "student-1",
          code: "S-2001",
          fullName: "Nora Student",
          email: "nora@example.com",
          avatarUrl: null,
          xp: 250,
          level: 2,
          role: "student",
        },
      ],
    });
  });

  it("returns the current student profile for /me", async () => {
    queueDbResults(
      [{ id: "student-1", fullName: "Nora Student" }],
      [{
        id: "student-1",
        fullName: "Nora Student",
        email: "nora@example.com",
        avatarUrl: null,
        xp: 250,
        level: 2,
      }],
    );

    const response = await app.request(
      "http://localhost/api/auth/me",
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
        email: "nora@example.com",
        avatarUrl: null,
        xp: 250,
        level: 2,
        role: "student",
      },
    });
  });
});
