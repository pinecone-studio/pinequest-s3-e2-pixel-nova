import {
  jsonRequest,
  mockDb,
  queueDbResults,
  resetDbMock,
  studentHeaders,
  teacherHeaders,
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

  it("creates a presigned upload URL for audio chunks without storing metadata yet", async () => {
    queueDbResults(
      { id: "auth-result" },
      [{ id: "session-1", examId: "exam-1", studentId: "student-1", status: "in_progress" }],
    );

    const response = await app.request(
      "http://localhost/api/cheat/audio-upload-url",
      jsonRequest(
        {
          sessionId: "session-1",
          mimeType: "audio/webm",
          sequenceNumber: 0,
          chunkStartedAt: "2026-03-30T08:00:00.000Z",
          chunkEndedAt: "2026-03-30T08:00:30.000Z",
          durationMs: 30000,
          sizeBytes: 2048,
        },
        studentHeaders(),
      ),
      cheatEnv,
    );

    expect(response.status).toBe(201);
    const payload: any = await response.json();
    expect(payload.data.objectKey).toMatch(
      /^cheat-audio\/session-1\/student-1\/.+\.webm$/,
    );
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("stores audio chunk metadata only after upload finalization", async () => {
    queueDbResults(
      { id: "auth-result" },
      [{ id: "session-1", examId: "exam-1", studentId: "student-1", status: "in_progress" }],
    );

    const response = await app.request(
      "http://localhost/api/cheat/audio-chunks",
      jsonRequest(
        {
          sessionId: "session-1",
          objectKey: "cheat-audio/session-1/student-1/000000-1710000000000-test-id.webm",
          mimeType: "audio/webm",
          sequenceNumber: 0,
          chunkStartedAt: "2026-03-30T08:00:00.000Z",
          chunkEndedAt: "2026-03-30T08:00:30.000Z",
          durationMs: 30000,
          sizeBytes: 2048,
        },
        studentHeaders(),
      ),
      cheatEnv,
    );

    expect(response.status).toBe(201);
    const payload: any = await response.json();
    expect(payload.success).toBe(true);
    expect(payload.data.assetUrl).toContain("/api/cheat/audio-assets?key=");
    expect(payload.data.objectKey).toBe(
      "cheat-audio/session-1/student-1/000000-1710000000000-test-id.webm",
    );
    expect(mockDb.insert).toHaveBeenCalled();
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
      [{
        id: "session-1",
        examId: "exam-1",
        studentId: "student-1",
        flagCount: 0,
        violationScore: 0,
        riskLevel: "low",
        status: "in_progress",
      }],
      [{
        enabledCheatDetections:
          '["tab_switch","tab_hidden","window_blur","copy_paste","right_click","screen_capture","devtools_open","multiple_monitors","suspicious_resize","rapid_answers","idle_too_long","face_missing","multiple_faces","looking_away","looking_down","camera_blocked"]',
        teacherId: "teacher-1",
      }],
      [],
      undefined,
      [{
        createdAt: "2026-03-31T00:00:00.000Z",
        eventSource: "mobile_camera",
        eventType: "multiple_faces",
      }],
      undefined,
      [],
      [{ fullName: "Nora Student" }],
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
        deduped: false,
        eventId: "test-id",
        flagged: true,
        riskLevel: "high",
        violationScore: 8,
      },
    });
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("combines looking_down and looking_away into the flag threshold", async () => {
    queueDbResults(
      { id: "auth-result" },
      [{
        id: "session-1",
        examId: "exam-1",
        studentId: "student-1",
        flagCount: 1,
        violationScore: 2,
        riskLevel: "low",
        status: "in_progress",
      }],
      [{
        enabledCheatDetections:
          '["tab_switch","tab_hidden","window_blur","copy_paste","right_click","screen_capture","devtools_open","multiple_monitors","suspicious_resize","rapid_answers","idle_too_long","face_missing","multiple_faces","looking_away","looking_down","camera_blocked"]',
        teacherId: "teacher-1",
      }],
      [],
      undefined,
      [
        {
          createdAt: "2026-03-31T00:00:00.000Z",
          eventSource: "browser_camera",
          eventType: "looking_down",
        },
        {
          createdAt: "2026-03-31T00:01:00.000Z",
          eventSource: "browser",
          eventType: "looking_away",
        },
      ],
      undefined,
      [{ fullName: "Nora Student" }],
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
        deduped: false,
        eventId: "test-id",
        flagged: true,
        riskLevel: "high",
        violationScore: 6,
      },
    });
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("rejects cheat events for sessions that are not in progress", async () => {
    queueDbResults(
      { id: "auth-result" },
      [{
        id: "session-1",
        examId: "exam-1",
        studentId: "student-1",
        riskLevel: "low",
        status: "joined",
      }],
    );

    const response = await app.request(
      "http://localhost/api/cheat/event",
      jsonRequest(
        {
          sessionId: "session-1",
          eventType: "tab_switch",
          source: "browser",
        },
        studentHeaders(),
      ),
      workerEnv,
    );

    expect(response.status).toBe(409);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("dedupes repeated events inside the cooldown window", async () => {
    queueDbResults(
      { id: "auth-result" },
      [{
        id: "session-1",
        examId: "exam-1",
        studentId: "student-1",
        violationScore: 4,
        riskLevel: "medium",
        isFlagged: false,
        status: "in_progress",
      }],
      [{
        enabledCheatDetections:
          '["tab_switch","tab_hidden","window_blur","copy_paste","right_click","screen_capture","devtools_open","multiple_monitors","suspicious_resize","rapid_answers","idle_too_long","face_missing","multiple_faces","looking_away","looking_down","camera_blocked"]',
        teacherId: "teacher-1",
      }],
      [{
        createdAt: new Date().toISOString(),
        dedupeKey: "tab_switch::browser::visibilityState:hidden",
      }],
    );

    const response = await app.request(
      "http://localhost/api/cheat/event",
      jsonRequest(
        {
          sessionId: "session-1",
          eventType: "tab_switch",
          source: "browser",
          details: {
            visibilityState: "hidden",
          },
        },
        studentHeaders(),
      ),
      workerEnv,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        deduped: true,
        flagged: false,
        riskLevel: "medium",
        violationScore: 4,
      },
    });
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("accepts microphone permission failures before the session starts", async () => {
    queueDbResults(
      { id: "auth-result" },
      [{
        id: "session-1",
        examId: "exam-1",
        studentId: "student-1",
        flagCount: 0,
        violationScore: 0,
        riskLevel: "low",
        status: "joined",
      }],
      [{
        enabledCheatDetections: '["tab_switch","camera_blocked"]',
        teacherId: "teacher-1",
      }],
      [],
      undefined,
      [{
        createdAt: "2026-03-31T00:00:00.000Z",
        eventSource: "browser_audio",
        eventType: "microphone_permission_denied",
      }],
      undefined,
      [],
      [{ fullName: "Nora Student" }],
    );

    const response = await app.request(
      "http://localhost/api/cheat/event",
      jsonRequest(
        {
          sessionId: "session-1",
          eventType: "microphone_permission_denied",
          source: "browser_audio",
        },
        studentHeaders(),
      ),
      workerEnv,
    );

    expect(response.status).toBe(201);
  });

  it("ignores disabled exam cheat detections without persisting risk changes", async () => {
    queueDbResults(
      { id: "auth-result" },
      [{
        id: "session-1",
        examId: "exam-1",
        studentId: "student-1",
        violationScore: 4,
        riskLevel: "medium",
        isFlagged: false,
        status: "in_progress",
      }],
      [{
        enabledCheatDetections: '["tab_switch","camera_blocked"]',
        teacherId: "teacher-1",
      }],
    );

    const response = await app.request(
      "http://localhost/api/cheat/event",
      jsonRequest(
        {
          sessionId: "session-1",
          eventType: "copy_paste",
          source: "browser",
        },
        studentHeaders(),
      ),
      workerEnv,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        deduped: false,
        ignored: true,
        flagged: false,
        riskLevel: "medium",
        violationScore: 4,
      },
    });
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(mockDb.update).not.toHaveBeenCalled();
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

  it("allows teachers to warn a student in an active session", async () => {
    queueDbResults(
      { id: "auth-result" },
      [{ id: "session-1", examId: "exam-1", studentId: "student-1", status: "in_progress" }],
      [{ id: "exam-1", teacherId: "teacher-1" }],
      [],
    );

    const response = await app.request(
      "http://localhost/api/cheat/warn/session-1",
      jsonRequest(
        {
          message: "Please focus on your own screen.",
        },
        teacherHeaders(),
      ),
      workerEnv,
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        eventId: "test-id",
      }),
    });
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("publishes a student notification when a teacher disqualifies a session", async () => {
    queueDbResults(
      { id: "auth-result" },
      [{ id: "session-1", examId: "exam-1", studentId: "student-1", status: "in_progress" }],
      [{ id: "exam-1", teacherId: "teacher-1" }],
      [],
      [{ id: "session-1", status: "disqualified", examId: "exam-1", studentId: "student-1" }],
    );

    const response = await app.request(
      "http://localhost/api/cheat/disqualify/session-1",
      jsonRequest(
        {
          reason: "Teacher disqualified the student after a repeated cheat event.",
        },
        teacherHeaders(),
      ),
      workerEnv,
    );

    expect(response.status).toBe(200);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.update).toHaveBeenCalled();
  });
});
