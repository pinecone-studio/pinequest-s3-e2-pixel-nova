import {
  jsonRequest,
  queueDbResults,
  resetDbMock,
  studentHeaders,
  teacherHeaders,
  workerEnv,
} from "./helpers/mock-db";
import app from "../src/index";

describe("notifications routes", () => {
  beforeEach(() => {
    resetDbMock();
  });

  it("lists notifications with unread count for teachers", async () => {
    queueDbResults(
      { id: "auth-result" },
      [],
      [],
      [],
      [
        {
          id: "notif-1",
          userId: "teacher-1",
          role: "teacher",
          type: "student_joined",
          severity: "info",
          status: "unread",
          title: "Сурагч орж ирлээ",
          message: "А. Бат шалгалтад нэвтэрлээ.",
          examId: "exam-1",
          sessionId: "session-1",
          studentId: "student-1",
          metadata: "{\"studentName\":\"А. Бат\"}",
          dedupeKey: "student_joined:session-1",
          createdAt: "2026-03-30T10:00:00.000Z",
          readAt: null,
          archivedAt: null,
        },
      ],
      [{ id: "notif-1" }],
    );

    const response = await app.request(
      "http://localhost/api/notifications",
      { headers: teacherHeaders() },
      workerEnv,
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      success: boolean;
      data: {
        items: unknown[];
        unreadCount: number;
      };
    };
    expect(payload.success).toBe(true);
    expect(Array.isArray(payload.data.items)).toBe(true);
    expect(typeof payload.data.unreadCount).toBe("number");
  });

  it("marks all notifications as read", async () => {
    queueDbResults({ id: "auth-result" }, undefined);

    const response = await app.request(
      "http://localhost/api/notifications/read-all",
      jsonRequest({}, studentHeaders()),
      workerEnv,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        unreadCount: 0,
      },
    });
  });
});
