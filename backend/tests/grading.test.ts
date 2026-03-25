import {
  queueDbResults,
  resetDbMock,
  teacherHeaders,
  workerEnv,
} from "./helpers/mock-db";
import app from "../src/index";

describe("grading", () => {
  beforeEach(() => resetDbMock());

  it("POST /api/sessions/:id/grade auto-grades MC and short_answer questions and awards XP", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Test Teacher" }], // auth
      // find session
      [{ id: "session-1", examId: "exam-1", studentId: "student-1", status: "submitted" }],
      // find exam (verify teacher owns it)
      [{ id: "exam-1", teacherId: "teacher-1", passScore: 50 }],
      // fetch questions for exam
      [
        { id: "q1", type: "multiple_choice", points: 2, correctAnswerText: null },
        { id: "q2", type: "short_answer", points: 3, correctAnswerText: "Paris" },
      ],
      // fetch correct options for MC questions
      [{ id: "opt-correct", questionId: "q1", isCorrect: true }],
      // fetch student answers
      [
        { id: "a1", questionId: "q1", selectedOptionId: "opt-correct", textAnswer: null },
        { id: "a2", questionId: "q2", selectedOptionId: null, textAnswer: "paris" },
      ],
      // update answer a1
      undefined,
      // update answer a2
      undefined,
      // update session with score
      undefined,
      // insert xp_transaction (exam_completed)
      undefined,
      // insert xp_transaction (exam_passed)
      undefined,
      // insert xp_transaction (perfect_score)
      undefined,
      // fetch student for XP update
      [{ id: "student-1", xp: 0, level: 1 }],
      // update student XP
      undefined,
      // return graded session
      [{ id: "session-1", status: "graded", score: 100, earnedPoints: 5, totalPoints: 5 }],
    );

    const res = await app.request(
      "http://localhost/api/sessions/session-1/grade",
      { method: "POST", headers: teacherHeaders() },
      workerEnv,
    );

    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("graded");
    expect(json.data.score).toBe(100);
    expect(json.data.earnedPoints).toBe(5);
    expect(json.data.totalPoints).toBe(5);
  });

  it("rejects grading if session is not submitted", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Test Teacher" }], // auth
      [{ id: "session-1", examId: "exam-1", studentId: "student-1", status: "in_progress" }], // session
      [{ id: "exam-1", teacherId: "teacher-1" }], // exam
    );

    const res = await app.request(
      "http://localhost/api/sessions/session-1/grade",
      { method: "POST", headers: teacherHeaders() },
      workerEnv,
    );

    expect(res.status).toBe(400);
    const json: any = await res.json();
    expect(json.error.code).toBe("INVALID_STATUS");
  });

  it("rejects grading by non-owner teacher", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Test Teacher" }], // auth
      [{ id: "session-1", examId: "exam-1", studentId: "student-1", status: "submitted" }], // session
      [], // exam not found (different teacher)
    );

    const res = await app.request(
      "http://localhost/api/sessions/session-1/grade",
      { method: "POST", headers: teacherHeaders() },
      workerEnv,
    );

    expect(res.status).toBe(404);
  });

  it("handles exam with only MC questions (no short_answer)", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Test Teacher" }], // auth
      [{ id: "session-1", examId: "exam-1", studentId: "student-1", status: "submitted" }], // session
      [{ id: "exam-1", teacherId: "teacher-1", passScore: 50 }], // exam
      // questions — only MC
      [{ id: "q1", type: "multiple_choice", points: 5, correctAnswerText: null }],
      // correct options
      [{ id: "opt-correct", questionId: "q1", isCorrect: true }],
      // student answers — wrong answer
      [{ id: "a1", questionId: "q1", selectedOptionId: "opt-wrong", textAnswer: null }],
      // update answer a1
      undefined,
      // update session
      undefined,
      // insert xp_transaction (exam_completed — always)
      undefined,
      // fetch student (score=0 < passScore=50, no exam_passed; earned 0 !== total 5, no perfect_score)
      [{ id: "student-1", xp: 0, level: 1 }],
      // update student XP
      undefined,
      // return graded session
      [{ id: "session-1", status: "graded", score: 0, earnedPoints: 0, totalPoints: 5 }],
    );

    const res = await app.request(
      "http://localhost/api/sessions/session-1/grade",
      { method: "POST", headers: teacherHeaders() },
      workerEnv,
    );

    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.data.status).toBe("graded");
    expect(json.data.score).toBe(0);
  });
});
