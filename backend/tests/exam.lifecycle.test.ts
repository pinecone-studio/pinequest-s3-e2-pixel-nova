import {
  jsonRequest,
  queueDbResults,
  resetDbMock,
  teacherHeaders,
  workerEnv,
} from "./helpers/mock-db";
import app from "../src/index";

describe("exam lifecycle routes", () => {
  beforeEach(() => {
    resetDbMock();
  });

  it("rejects scheduling exams that do not have questions yet", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Ada Teacher" }],
      [{ id: "exam-1", teacherId: "teacher-1", status: "draft", roomCode: null }],
      [],
    );

    const response = await app.request(
      "http://localhost/api/exams/exam-1/schedule",
      jsonRequest({ scheduledAt: "2026-03-31T08:00:00.000Z" }, teacherHeaders()),
      workerEnv,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: "Cannot schedule an exam with no questions",
      },
    });
  });

  it("schedules a draft exam once questions exist", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Ada Teacher" }],
      [{ id: "exam-1", teacherId: "teacher-1", status: "draft", roomCode: "ROOM01" }],
      [{ id: "q1" }, { id: "q2" }],
      undefined,
      [{
        id: "exam-1",
        teacherId: "teacher-1",
        status: "scheduled",
        scheduledAt: "2026-03-31T08:00:00.000Z",
        roomCode: "ROOM01",
      }],
    );

    const response = await app.request(
      "http://localhost/api/exams/exam-1/schedule",
      jsonRequest({ scheduledAt: "2026-03-31T16:00:00+08:00" }, teacherHeaders()),
      workerEnv,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        id: "exam-1",
        teacherId: "teacher-1",
        status: "scheduled",
        scheduledAt: "2026-03-31T08:00:00.000Z",
        roomCode: "ROOM01",
      },
    });
  });

  it("prevents manually starting an exam before its scheduled time", async () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    queueDbResults(
      [{ id: "teacher-1", fullName: "Ada Teacher" }],
      [{ id: "exam-1", teacherId: "teacher-1", status: "scheduled", scheduledAt: future }],
    );

    const response = await app.request(
      "http://localhost/api/exams/exam-1/start",
      { method: "POST", headers: teacherHeaders() },
      workerEnv,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: "Cannot manually start exam before scheduled time",
      },
    });
  });

  it("finishes an active exam and stores finishedAt", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Ada Teacher" }],
      [{ id: "exam-1", teacherId: "teacher-1", status: "active" }],
      undefined,
      [{ id: "exam-1", teacherId: "teacher-1", status: "finished", finishedAt: "2026-03-30T09:00:00.000Z" }],
    );

    const response = await app.request(
      "http://localhost/api/exams/exam-1/finish",
      { method: "POST", headers: teacherHeaders() },
      workerEnv,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        id: "exam-1",
        teacherId: "teacher-1",
        status: "finished",
        finishedAt: "2026-03-30T09:00:00.000Z",
      },
    });
  });

  it("archives a finished exam", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Ada Teacher" }],
      [{ id: "exam-1", teacherId: "teacher-1", status: "finished" }],
      undefined,
      [{ id: "exam-1", teacherId: "teacher-1", status: "archived" }],
    );

    const response = await app.request(
      "http://localhost/api/exams/exam-1/archive",
      { method: "POST", headers: teacherHeaders() },
      workerEnv,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        id: "exam-1",
        teacherId: "teacher-1",
        status: "archived",
      },
    });
  });
});
