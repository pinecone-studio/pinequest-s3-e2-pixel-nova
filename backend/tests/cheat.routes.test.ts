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

  it("analyzes a periodic snapshot with Workers AI", async () => {
    queueDbResults(
      { id: "auth-result" },
      [{ id: "session-1", examId: "exam-1", studentId: "student-1" }],
    );

    workerEnv.AI.run.mockResolvedValue({
      response: {
        summary: "One face is visible and the student is looking to the right.",
        faceCount: 1,
        lookingDirection: "right",
        confidence: 0.91,
        suspiciousEvents: [
          {
            eventType: "looking_away",
            reason: "The student is clearly looking away from the phone.",
            confidence: 0.91,
          },
        ],
      },
    });

    const response = await app.request(
      "http://localhost/api/cheat/analyze-snapshot",
      jsonRequest(
        {
          sessionId: "session-1",
          imageDataUrl: "data:image/jpeg;base64,bW9jay1pbWFnZQ==",
          capturedAt: "2026-03-30T08:00:00.000Z",
        },
        studentHeaders(),
      ),
      workerEnv,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        source: "mobile_camera_ai",
        summary: "One face is visible and the student is looking to the right.",
        faceCount: 1,
        lookingDirection: "right",
        confidence: 0.91,
        suspiciousEvents: [
          {
            eventType: "looking_away",
            reason: "The student is clearly looking away from the phone.",
            confidence: 0.91,
          },
        ],
      },
    });
    expect(workerEnv.AI.run).toHaveBeenCalledWith(
      "@cf/meta/llama-3.2-11b-vision-instruct",
      expect.objectContaining({
        image: "data:image/jpeg;base64,bW9jay1pbWFnZQ==",
      }),
    );
  });

  it("accepts the new mobile camera event types", async () => {
    queueDbResults(
      { id: "auth-result" },
      [{ id: "session-1", examId: "exam-1", studentId: "student-1", flagCount: 0, violationScore: 0 }],
      undefined,
      undefined,
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
      [{ id: "session-1", examId: "exam-1", studentId: "student-1", flagCount: 1, violationScore: 2 }],
      undefined,
      undefined,
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
    expect(mockDb.update).toHaveBeenCalled();
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
