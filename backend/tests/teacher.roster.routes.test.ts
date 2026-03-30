import {
  queueDbResults,
  resetDbMock,
  teacherHeaders,
  workerEnv,
} from "./helpers/mock-db";
import app from "../src/index";

describe("teacher roster route", () => {
  beforeEach(() => {
    resetDbMock();
  });

  it("returns roster progress, attendance, and cheat indicators for a scheduled exam", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Ada Teacher" }],
      [{
        id: "exam-1",
        teacherId: "teacher-1",
        title: "English Quiz",
        roomCode: "ROOM01",
        durationMin: 45,
        expectedStudentsCount: 30,
        scheduledAt: "2026-03-30T08:00:00.000Z",
        startedAt: "2026-03-30T08:05:00.000Z",
        finishedAt: null,
      }],
      [{ count: 4 }],
      [
        {
          sessionId: "session-1",
          studentId: "student-1",
          studentName: "Ariunaa",
          studentCode: "S-001",
          status: "submitted",
          submittedAt: "2026-03-30T08:32:00.000Z",
          startedAt: "2026-03-30T08:05:00.000Z",
          isFlagged: 0,
          flagCount: 0,
          score: 90,
        },
        {
          sessionId: "session-2",
          studentId: "student-2",
          studentName: "Bat",
          studentCode: "S-002",
          status: "late",
          submittedAt: null,
          startedAt: "2026-03-30T08:11:00.000Z",
          isFlagged: 1,
          flagCount: 2,
          score: 55,
        },
      ],
      [
        { sessionId: "session-1", count: 4 },
        { sessionId: "session-2", count: 2 },
      ],
    );

    const response = await app.request(
      "http://localhost/api/teacher/exams/exam-1/roster",
      { headers: teacherHeaders() },
      workerEnv,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        examId: "exam-1",
        title: "English Quiz",
        roomCode: "ROOM01",
        durationMin: 45,
        expectedStudentsCount: 30,
        scheduledAt: "2026-03-30T08:00:00.000Z",
        startedAt: "2026-03-30T08:05:00.000Z",
        finishedAt: null,
        participants: [
          {
            sessionId: "session-1",
            studentId: "student-1",
            studentName: "Ariunaa",
            studentCode: "S-001",
            status: "submitted",
            answeredCount: 4,
            totalQuestions: 4,
            progressPercent: 100,
            submittedAt: "2026-03-30T08:32:00.000Z",
            startedAt: "2026-03-30T08:05:00.000Z",
            isFlagged: false,
            flagCount: 0,
            score: 90,
          },
          {
            sessionId: "session-2",
            studentId: "student-2",
            studentName: "Bat",
            studentCode: "S-002",
            status: "late",
            answeredCount: 2,
            totalQuestions: 4,
            progressPercent: 50,
            submittedAt: null,
            startedAt: "2026-03-30T08:11:00.000Z",
            isFlagged: true,
            flagCount: 2,
            score: 55,
          },
        ],
      },
    });
  });

  it("returns 404 when roster is requested for an exam owned by another teacher", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Ada Teacher" }],
      [],
    );

    const response = await app.request(
      "http://localhost/api/teacher/exams/exam-404/roster",
      { headers: teacherHeaders() },
      workerEnv,
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Exam not found",
      },
    });
  });
});
