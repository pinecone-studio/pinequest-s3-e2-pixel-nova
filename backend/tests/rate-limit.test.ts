import {
  getClientIdentifier,
  getRateLimitDescriptor,
} from "../src/middleware/rate-limit";
import {
  jsonRequest,
  queueDbResults,
  resetDbMock,
  studentHeaders,
  teacherHeaders,
  workerEnv,
} from "./helpers/mock-db";
import app from "../src/index";

const createLimiter = (success: boolean) => ({
  limit: jest.fn().mockResolvedValue({ success }),
});

describe("rate limiting", () => {
  beforeEach(() => {
    resetDbMock();
  });

  it("prefers the Cloudflare client IP and falls back to forwarded headers", () => {
    expect(
      getClientIdentifier(
        new Headers({
          "cf-connecting-ip": "203.0.113.4",
          "x-forwarded-for": "198.51.100.1, 198.51.100.2",
        }),
      ),
    ).toBe("203.0.113.4");

    expect(
      getClientIdentifier(
        new Headers({
          "x-forwarded-for": "198.51.100.1, 198.51.100.2",
        }),
      ),
    ).toBe("198.51.100.1");
  });

  it("builds student write keys with a session scope when one is present", () => {
    const descriptor = getRateLimitDescriptor({
      method: "POST",
      pathname: "/api/sessions/session-42/answer",
      headers: new Headers(studentHeaders()),
    });

    expect(descriptor).toMatchObject({
      binding: "RATE_LIMIT_STUDENT_WRITE",
      key: "studentWrite:student-1:session:session-42",
      tier: "studentWrite",
    });
  });

  it("builds distinct keys for different authenticated users", () => {
    const teacherDescriptor = getRateLimitDescriptor({
      method: "POST",
      pathname: "/api/materials/exam-1",
      headers: new Headers(teacherHeaders()),
    });
    const studentDescriptor = getRateLimitDescriptor({
      method: "POST",
      pathname: "/api/saved/exam-1",
      headers: new Headers(studentHeaders()),
    });

    expect(teacherDescriptor?.key).toBe("teacherMutation:teacher-1");
    expect(studentDescriptor?.key).toBe("studentWrite:student-1:global");
  });

  it("returns 429 for blocked high-cost routes", async () => {
    const highCostLimiter = createLimiter(false);
    const env = {
      ...workerEnv,
      RATE_LIMIT_HIGH_COST: highCostLimiter,
    } as any;

    const response = await app.request(
      "http://localhost/api/agent/exam-generator/generate",
      jsonRequest(
        {
          topic: "Algebra",
          difficulty: "medium",
          questionCount: 5,
        },
        teacherHeaders(),
      ),
      env,
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: {
        code: "TOO_MANY_REQUESTS",
      },
    });
    expect(highCostLimiter.limit).toHaveBeenCalledWith({
      key: "highCost:teacher-1",
    });
    expect(workerEnv.AI.run).not.toHaveBeenCalled();
  });

  it("returns 429 for blocked student write routes", async () => {
    const studentWriteLimiter = createLimiter(false);
    const env = {
      ...workerEnv,
      RATE_LIMIT_STUDENT_WRITE: studentWriteLimiter,
    } as any;

    const response = await app.request(
      "http://localhost/api/sessions/join",
      jsonRequest({ roomCode: "ROOM01" }, studentHeaders()),
      env,
    );

    expect(response.status).toBe(429);
    expect(studentWriteLimiter.limit).toHaveBeenCalledWith({
      key: "studentWrite:student-1:global",
    });
  });

  it("returns 429 for blocked teacher mutation routes", async () => {
    const teacherMutationLimiter = createLimiter(false);
    const env = {
      ...workerEnv,
      RATE_LIMIT_TEACHER_MUTATION: teacherMutationLimiter,
    } as any;

    const response = await app.request(
      "http://localhost/api/materials/exam-1",
      jsonRequest(
        {
          fileName: "notes.pdf",
          fileType: "application/pdf",
          materialType: "attachment",
          fileUrl: "https://example.com/notes.pdf",
        },
        teacherHeaders(),
      ),
      env,
    );

    expect(response.status).toBe(429);
    expect(teacherMutationLimiter.limit).toHaveBeenCalledWith({
      key: "teacherMutation:teacher-1",
    });
  });

  it("allows general read routes with a looser binding", async () => {
    const generalReadLimiter = createLimiter(true);
    const env = {
      ...workerEnv,
      RATE_LIMIT_GENERAL_READ: generalReadLimiter,
    } as any;

    queueDbResults([], []);

    const response = await app.request(
      "http://localhost/api/auth/users",
      undefined,
      env,
    );

    expect(response.status).toBe(200);
    expect(generalReadLimiter.limit).toHaveBeenCalledWith({
      key: "generalRead:local",
    });
  });
});
