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
      [{ count: 10 }],
      [{ count: 1 }],
      [{ count: 213 }],
      [{ count: 25 }],
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
      [
        {
          studentId: "student-1",
          fullName: "Anu",
          xp: 2100,
          level: 11,
        },
        {
          studentId: "student-2",
          fullName: "Temuulen",
          xp: 1800,
          level: 10,
        },
      ],
      [
        {
          submittedAt: "2026-03-21T10:00:00.000Z",
          createdAt: "2026-03-21T10:00:00.000Z",
          score: 8,
          totalPoints: 10,
          xp: 2100,
        },
        {
          submittedAt: "2026-03-25T10:00:00.000Z",
          createdAt: "2026-03-25T10:00:00.000Z",
          score: 6,
          totalPoints: 10,
          xp: 1800,
        },
      ],
      [
        {
          questionText: "Present perfect",
          examTitle: "Algebra Final",
          correctCount: 3,
          totalAnswers: 10,
        },
      ],
      [{ count: 2 }],
    );

    workerEnv.AI.run.mockResolvedValue({
      response:
        '{"title":"Гол анхаарах зүйл","summary":"Present perfect дээр давтлага шаардлагатай байна."}',
    });

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
        totalClasses: 10,
        totalExams: 4,
        totalStudents: 32,
        activeExams: 1,
        totalSubmissions: 213,
        lastSevenDaysSubmissions: 25,
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
        xpLeaderboard: [
          {
            rank: 1,
            studentId: "student-1",
            displayName: "Сурагч 1",
            xp: 2100,
            level: 11,
          },
          {
            rank: 2,
            studentId: "student-2",
            displayName: "Сурагч 2",
            xp: 1800,
            level: 10,
          },
        ],
        scoreTrend: [
          {
            label: expect.any(String),
            averageScore: 70,
            averageXp: 1950,
          },
        ],
        aiInsight: {
          title: "Гол анхаарах зүйл",
          summary: "Present perfect дээр давтлага шаардлагатай байна.",
          source: "ai",
        },
      },
    });
  });

  it("returns teacher overview with current percentage-based monthly data", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Ada Teacher" }],
      [{ className: "11A" }, { className: "11B" }],
      [{ cnt: 32 }],
      [{ cnt: 9 }],
      [{ cnt: 48 }],
      [
        {
          month: "2026-03",
          avgScore: 88.63,
          cnt: 3,
          passCount: 2,
        },
        {
          month: "2026-04",
          avgScore: 92,
          cnt: 1,
          passCount: 1,
        },
      ],
    );

    const response = await app.request(
      "http://localhost/api/analytics/teacher-overview",
      {
        headers: teacherHeaders(),
      },
      workerEnv,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        totalClasses: 2,
        totalStudents: 32,
        weeklySubmissions: 9,
        totalSubmissions: 48,
        monthlyData: [
          {
            month: "2026-03",
            avgScore: 88.6,
            passRate: 67,
            count: 3,
          },
          {
            month: "2026-04",
            avgScore: 92,
            passRate: 100,
            count: 1,
          },
        ],
      },
    });
  });
});
