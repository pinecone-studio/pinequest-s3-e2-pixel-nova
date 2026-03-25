import {
  jsonRequest,
  queueDbResults,
  resetDbMock,
  studentHeaders,
  workerEnv,
} from "./helpers/mock-db";
import app from "../src/index";

describe("saved routes", () => {
  beforeEach(() => {
    resetDbMock();
  });

  it("prevents duplicate saves for the same exam", async () => {
    queueDbResults(
      [{ id: "student-1", fullName: "Nora Student" }],
      [{ id: "exam-1" }],
      [{ id: "saved-1" }],
    );

    const response = await app.request(
      "http://localhost/api/saved/exam-1",
      {
        ...jsonRequest({}, studentHeaders()),
      },
      workerEnv,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "ALREADY_SAVED",
        message: "Exam is already saved",
      },
    });
  });

  it("returns the student's saved exams list", async () => {
    queueDbResults(
      [{ id: "student-1", fullName: "Nora Student" }],
      [
        {
          id: "saved-1",
          examId: "exam-1",
          title: "Algebra Final",
          description: "Quarter-end exam",
          status: "scheduled",
          savedAt: "2026-03-24T00:00:00.000Z",
        },
      ],
    );

    const response = await app.request(
      "http://localhost/api/saved",
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
          id: "saved-1",
          examId: "exam-1",
          title: "Algebra Final",
          description: "Quarter-end exam",
          status: "scheduled",
          savedAt: "2026-03-24T00:00:00.000Z",
        },
      ],
    });
  });
});
