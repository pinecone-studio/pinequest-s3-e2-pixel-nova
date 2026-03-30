import {
  jsonRequest,
  mockDb,
  queueDbResults,
  resetDbMock,
  studentHeaders,
  workerEnv,
} from "./helpers/mock-db";
import app from "../src/index";

const mockR2 = {
  get: jest.fn(),
};

const cheatEnv = {
  ...workerEnv,
  EXAM_FILES: mockR2,
  R2_ACCOUNT_ID: "account-123",
  R2_ACCESS_KEY_ID: "access-key",
  R2_SECRET_ACCESS_KEY: "secret-key",
  R2_BUCKET_NAME: "educore-exam-files",
} as any;

describe("cheat routes", () => {
  beforeEach(() => {
    resetDbMock();
    mockR2.get.mockReset();
  });

  it("creates a presigned upload URL for camera snapshots", async () => {
    queueDbResults(
      { id: "auth-result" },
      [{ id: "session-1", examId: "exam-1", studentId: "student-1" }],
    );

    const response = await app.request(
      "http://localhost/api/cheat/snapshot-upload-url",
      jsonRequest(
        {
          sessionId: "session-1",
          mimeType: "image/jpeg",
          capturedAt: "2026-03-30T08:00:00.000Z",
        },
        studentHeaders(),
      ),
      cheatEnv,
    );

    expect(response.status).toBe(201);
    const payload: any = await response.json();
    expect(payload.success).toBe(true);
    expect(payload.data.objectKey).toMatch(
      /^cheat-snapshots\/session-1\/student-1\/.+\.jpg$/,
    );
    expect(payload.data.uploadUrl).toContain(
      "https://account-123.r2.cloudflarestorage.com/educore-exam-files/",
    );
    expect(payload.data.uploadUrl).toContain("X-Amz-Signature=");
    expect(payload.data.uploadHeaders).toEqual({
      "Content-Type": "image/jpeg",
    });
    expect(payload.data.assetUrl).toContain("/api/cheat/snapshot-assets?key=");
  });

  it("analyzes a periodic snapshot from stored R2 data with Workers AI", async () => {
    queueDbResults(
      { id: "auth-result" },
      [{ id: "session-1", examId: "exam-1", studentId: "student-1" }],
    );

    mockR2.get.mockResolvedValue({
      arrayBuffer: () => Promise.resolve(Uint8Array.from([109, 111, 99, 107]).buffer),
      httpMetadata: {
        contentType: "image/jpeg",
      },
    });

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
          objectKey: "cheat-snapshots/session-1/student-1/object-key.jpg",
          imageUrl:
            "http://localhost/api/cheat/snapshot-assets?key=cheat-snapshots%2Fsession-1%2Fstudent-1%2Fobject-key.jpg",
          capturedAt: "2026-03-30T08:00:00.000Z",
        },
        studentHeaders(),
      ),
      cheatEnv,
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
    expect(mockR2.get).toHaveBeenCalledWith(
      "cheat-snapshots/session-1/student-1/object-key.jpg",
    );
    expect(workerEnv.AI.run).toHaveBeenCalledWith(
      "@cf/meta/llama-3.2-11b-vision-instruct",
      expect.objectContaining({
        image: "data:image/jpeg;base64,bW9jaw==",
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
