type MockResult = unknown;

const resultQueue: MockResult[] = [];

const createTable = <T extends string>(columns: T[]) =>
  columns.reduce(
    (table, column) => ({
      ...table,
      [column]: column,
    }),
    {} as Record<T, string>,
  );

const dequeue = (fallback: unknown) =>
  Promise.resolve(resultQueue.length > 0 ? resultQueue.shift() : fallback);

const createChain = (fallback: unknown) => {
  const chain: Record<string, unknown> = {};

  for (const method of [
    "from",
    "where",
    "limit",
    "offset",
    "innerJoin",
    "leftJoin",
    "groupBy",
    "orderBy",
    "set",
    "values",
    "returning",
    "onConflictDoNothing",
  ]) {
    chain[method] = () => chain;
  }

  chain.then = (onFulfilled?: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) =>
    dequeue(fallback).then(onFulfilled, onRejected);

  return chain;
};

export const mockDb = {
  select: jest.fn(() => createChain([])),
  insert: jest.fn(() => createChain(undefined)),
  update: jest.fn(() => createChain(undefined)),
  delete: jest.fn(() => createChain(undefined)),
};

export const mockGetDb = jest.fn(() => mockDb);

const tableExports = {
  teachers: createTable(["id", "code", "fullName", "email", "avatarUrl"]),
  students: createTable([
    "id",
    "code",
    "fullName",
    "email",
    "avatarUrl",
    "xp",
    "termXp",
    "progressXp",
    "level",
    "createdAt",
    "updatedAt",
  ]),
  subjects: createTable(["id", "name", "code", "description", "createdAt", "updatedAt"]),
  exams: createTable([
    "id",
    "teacherId",
    "subjectId",
    "title",
    "description",
    "examType",
    "status",
    "scheduledAt",
    "startedAt",
    "finishedAt",
    "durationMin",
    "roomCode",
    "passScore",
    "shuffleQuestions",
    "enabledCheatDetections",
    "createdAt",
    "updatedAt",
  ]),
  questions: createTable([
    "id",
    "examId",
    "type",
    "questionText",
    "topic",
    "difficulty",
    "imageUrl",
    "audioUrl",
    "explanation",
    "correctAnswerText",
    "points",
    "orderIndex",
  ]),
  options: createTable(["id", "questionId", "label", "text", "imageUrl", "isCorrect", "orderIndex"]),
  examSessions: createTable([
    "id",
    "examId",
    "studentId",
    "status",
    "startedAt",
    "submittedAt",
    "createdAt",
    "score",
    "earnedPoints",
    "totalPoints",
    "isFlagged",
    "flagCount",
    "violationScore",
    "riskLevel",
    "lastViolationAt",
    "topViolationType",
  ]),
  studentAnswers: createTable([
    "id",
    "sessionId",
    "questionId",
    "selectedOptionId",
    "textAnswer",
    "isCorrect",
    "pointsEarned",
    "answeredAt",
  ]),
  cheatEvents: createTable([
    "id",
    "sessionId",
    "examId",
    "studentId",
    "eventType",
    "eventSource",
    "confidence",
    "details",
    "dedupeKey",
    "isNotified",
    "createdAt",
  ]),
  xpTransactions: createTable(["id", "studentId", "amount", "reason", "referenceId", "createdAt"]),
  savedExams: createTable(["id", "studentId", "examId", "createdAt"]),
  aiExamGeneratorRuns: createTable([
    "id",
    "teacherId",
    "topic",
    "subject",
    "gradeOrClass",
    "difficulty",
    "questionCount",
    "instructions",
    "generatedTitle",
    "draftPayload",
    "status",
    "createdAt",
    "updatedAt",
  ]),
  notifications: createTable([
    "id",
    "userId",
    "role",
    "type",
    "severity",
    "status",
    "title",
    "message",
    "examId",
    "sessionId",
    "studentId",
    "metadata",
    "dedupeKey",
    "createdAt",
    "readAt",
    "archivedAt",
  ]),
  materials: createTable(["id", "examId", "fileName", "fileType", "materialType", "fileUrl", "createdAt"]),
  questionBank: createTable(["id", "teacherId", "subjectId", "type", "difficulty", "questionText", "imageUrl", "audioUrl", "explanation", "correctAnswerText", "tags", "usageCount", "createdAt", "updatedAt"]),
  questionBankOptions: createTable(["id", "bankQuestionId", "label", "text", "imageUrl", "isCorrect", "orderIndex"]),
};

// Mock auth middleware — bypass DB lookup, use x-user-id/x-user-role headers directly
// Consumes one queued result for backward compatibility (tests queue an "auth" result first)
jest.mock("../../src/middleware/auth", () => ({
  __esModule: true,
  authMiddleware: jest.fn(async (c: any, next: any) => {
    const userId = c.req.header("x-user-id");
    const role = c.req.header("x-user-role");
    if (!userId || !role) {
      return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Missing x-user-id or x-user-role header" } }, 401);
    }
    // Consume the "auth" result that tests queue as first item
    if (resultQueue.length > 0) resultQueue.shift();
    c.set("user", { id: userId, role, fullName: role === "teacher" ? "Test Teacher" : "Test Student" });
    await next();
  }),
}));

jest.mock("nanoid", () => ({
  __esModule: true,
  nanoid: () => "test-id",
  customAlphabet: () => () => "ROOM01",
}));

jest.mock("../../src/db", () => ({
  __esModule: true,
  getDb: mockGetDb,
  ...tableExports,
}));

export function queueDbResults(...results: MockResult[]) {
  resultQueue.push(...results);
}

export function resetDbMock() {
  resultQueue.length = 0;
  mockGetDb.mockClear();
  mockDb.select.mockClear();
  mockDb.insert.mockClear();
  mockDb.update.mockClear();
  mockDb.delete.mockClear();
  workerEnv.AI.run.mockReset();
}

export function teacherHeaders(overrides: Record<string, string> = {}) {
  return {
    "x-user-id": "teacher-1",
    "x-user-role": "teacher",
    ...overrides,
  };
}

export function studentHeaders(overrides: Record<string, string> = {}) {
  return {
    "x-user-id": "student-1",
    "x-user-role": "student",
    ...overrides,
  };
}

export function jsonRequest(body: unknown, headers: Record<string, string> = {}) {
  return {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

export const workerEnv = {
  educore: {},
  AI: {
    run: jest.fn(),
  },
} as any;
