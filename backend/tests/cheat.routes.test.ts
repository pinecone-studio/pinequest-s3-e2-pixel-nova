import {
  jsonRequest,
  mockDb,
  queueDbResults,
  resetDbMock,
  studentHeaders,
  workerEnv,
} from "./helpers/mock-db";
import app from "../src/index";

describe("cheat routes", () => {
  beforeEach(() => {
    resetDbMock();
  });

  it("accepts mobile camera events and flags a session at the configured weight", async () => {
    queueDbResults(
      { id: "auth-result" },
      [{ id: "session-1", examId: "exam-1", studentId: "student-1" }],
      undefined,
      [{ eventType: "multiple_faces" }]
    );

    const response = await app.request(
      "http://localhost/api/cheat/event",
      jsonRequest(
        {
          sessionId: "session-1",
          eventType: "multiple_faces",
          metadata: JSON.stringify({ source: "mobile_camera" }),
        },
        studentHeaders()
      ),
      workerEnv
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        eventId: "test-id",
        flagged: true,
      },
    });
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("combines medium and high mobile events into the weighted threshold", async () => {
    queueDbResults(
      { id: "auth-result" },
      [{ id: "session-1", examId: "exam-1", studentId: "student-1" }],
      undefined,
      [{ eventType: "looking_down" }, { eventType: "looking_away" }]
    );

    const response = await app.request(
      "http://localhost/api/cheat/event",
      jsonRequest(
        {
          sessionId: "session-1",
          eventType: "looking_away",
        },
        studentHeaders()
      ),
      workerEnv
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        eventId: "test-id",
        flagged: true,
      },
    });
  });

  it("rejects unsupported camera event types", async () => {
    queueDbResults({ id: "auth-result" });

    const response = await app.request(
      "http://localhost/api/cheat/event",
      jsonRequest(
        {
          sessionId: "session-1",
          eventType: "eye_tracking",
        },
        studentHeaders()
      ),
      workerEnv
    );

    expect(response.status).toBe(400);
  });
});
