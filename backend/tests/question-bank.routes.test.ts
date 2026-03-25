import {
  jsonRequest,
  queueDbResults,
  resetDbMock,
  teacherHeaders,
  workerEnv,
} from "./helpers/mock-db";
import app from "../src/index";

describe("question bank routes", () => {
  beforeEach(() => resetDbMock());

  it("POST /api/question-bank creates a bank question with options", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Test Teacher" }], // auth
      undefined, // insert question
      undefined, // insert options
      [{ id: "test-id", teacherId: "teacher-1", type: "multiple_choice", questionText: "2+2=?", difficulty: "easy" }], // select created
      [{ id: "opt-1", bankQuestionId: "test-id", label: "A", text: "4", isCorrect: true, orderIndex: 0 }], // select options
    );

    const res = await app.request(
      "http://localhost/api/question-bank",
      jsonRequest({
        type: "multiple_choice",
        questionText: "2+2=?",
        difficulty: "easy",
        options: [{ label: "A", text: "4", isCorrect: true }],
      }, teacherHeaders()),
      workerEnv,
    );

    expect(res.status).toBe(201);
    const json: any = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.questionText).toBe("2+2=?");
  });

  it("GET /api/question-bank lists teacher's bank questions", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Test Teacher" }], // auth
      [{ total: 1 }], // count query
      [{ id: "q1", teacherId: "teacher-1", questionText: "2+2=?", type: "multiple_choice" }], // paginated select
    );

    const res = await app.request(
      "http://localhost/api/question-bank",
      { headers: teacherHeaders() },
      workerEnv,
    );

    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.pagination).toBeDefined();
    expect(json.pagination.total).toBe(1);
  });

  it("GET /api/question-bank/:id returns question with options", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Test Teacher" }], // auth
      [{ id: "q1", teacherId: "teacher-1", questionText: "2+2=?", type: "multiple_choice" }], // find question
      [{ id: "opt-1", bankQuestionId: "q1", label: "A", text: "4", isCorrect: true }], // options
    );

    const res = await app.request(
      "http://localhost/api/question-bank/q1",
      { headers: teacherHeaders() },
      workerEnv,
    );

    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.data.questionText).toBe("2+2=?");
    expect(json.data.options).toHaveLength(1);
  });

  it("DELETE /api/question-bank/:id deletes a bank question", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Test Teacher" }], // auth
      [{ id: "q1", teacherId: "teacher-1" }], // find
      undefined, // delete
    );

    const res = await app.request(
      "http://localhost/api/question-bank/q1",
      { method: "DELETE", headers: teacherHeaders() },
      workerEnv,
    );

    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.data.deleted).toBe(true);
  });

  it("POST /api/question-bank/:id/copy-to-exam copies question to exam", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Test Teacher" }], // auth
      [{ id: "q1", teacherId: "teacher-1", type: "multiple_choice", questionText: "2+2=?", difficulty: "easy", correctAnswerText: null, imageUrl: null, audioUrl: null, explanation: null, usageCount: 0 }], // find bank question
      [{ id: "exam-1", teacherId: "teacher-1" }], // find exam
      [{ id: "opt-1", bankQuestionId: "q1", label: "A", text: "4", imageUrl: null, isCorrect: true, orderIndex: 0 }], // bank options
      [], // existing questions for orderIndex
      undefined, // insert question
      undefined, // insert options
      undefined, // update usage count
    );

    const res = await app.request(
      "http://localhost/api/question-bank/q1/copy-to-exam",
      jsonRequest({ examId: "exam-1" }, teacherHeaders()),
      workerEnv,
    );

    expect(res.status).toBe(201);
    const json: any = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.copiedFrom).toBe("q1");
    expect(json.data.examId).toBe("exam-1");
  });

  it("returns 404 when copying from non-existent bank question", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Test Teacher" }], // auth
      [], // bank question not found
    );

    const res = await app.request(
      "http://localhost/api/question-bank/nonexistent/copy-to-exam",
      jsonRequest({ examId: "exam-1" }, teacherHeaders()),
      workerEnv,
    );

    expect(res.status).toBe(404);
  });
});
