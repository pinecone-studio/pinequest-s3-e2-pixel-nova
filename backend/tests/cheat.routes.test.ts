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

  it("accepts the new mobile camera event types", async () => {
    queueDbResults(
      { id: "auth-result" },
      [{ id: "session-1", examId: "exam-1", studentId: "student-1" }],
      undefined,
      [{ eventType: "multiple_faces" }],
    );

    const response = await app.request(
      "http://localhost/api/cheat/event",
      jsonRequest(
        {
          sessionId: "session-1",
          eventType: "multiple_faces",
          metadata: JSON.stringify({
            source: "mobile_camera",
            platform: "ios",
            faceCount: 2,
          }),
        },
        studentHeaders(),
      ),
      workerEnv,
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

  it("combines looking_down and looking_away into the flag threshold", async () => {
    queueDbResults(
      { id: "auth-result" },
      [{ id: "session-1", examId: "exam-1", studentId: "student-1" }],
      undefined,
      [{ eventType: "looking_down" }, { eventType: "looking_away" }],
    );

    const response = await app.request(
      "http://localhost/api/cheat/event",
      jsonRequest(
        {
          sessionId: "session-1",
          eventType: "looking_away",
        },
        studentHeaders(),
      ),
      workerEnv,
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
        studentHeaders(),
      ),
      workerEnv,
    );

    expect(response.status).toBe(400);
  });
});
