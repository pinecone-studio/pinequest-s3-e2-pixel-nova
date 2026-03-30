import { queueDbResults, resetDbMock, studentHeaders, teacherHeaders, workerEnv } from "./helpers/mock-db";
import app from "../src/index";

describe("session results and manual grading", () => {
  beforeEach(() => resetDbMock());

  it("returns graded student results with options after the exam has finished", async () => {
    queueDbResults(
      [{ id: "student-1", fullName: "Student One" }],
      [{ id: "session-1", examId: "exam-1", studentId: "student-1", status: "graded", score: 80, earnedPoints: 4, totalPoints: 5, submittedAt: "2026-03-30T10:00:00.000Z" }],
      [{ id: "exam-1", status: "finished" }],
      [
        {
          answerId: "answer-1",
          questionId: "q1",
          selectedOptionId: "opt-1",
          textAnswer: null,
          isCorrect: true,
          pointsEarned: 2,
          answeredAt: "2026-03-30T09:40:00.000Z",
          questionText: "2 + 2 = ?",
          questionType: "multiple_choice",
          points: 2,
          correctAnswerText: null,
        },
      ],
      [
        { id: "opt-1", questionId: "q1", label: "A", text: "4", imageUrl: null, isCorrect: true },
        { id: "opt-2", questionId: "q1", label: "B", text: "5", imageUrl: null, isCorrect: false },
      ],
    );

    const response = await app.request(
      "http://localhost/api/sessions/session-1/result",
      { headers: studentHeaders() },
      workerEnv,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        sessionId: "session-1",
        status: "graded",
        score: 80,
        earnedPoints: 4,
        totalPoints: 5,
        submittedAt: "2026-03-30T10:00:00.000Z",
        answers: [
          {
            questionId: "q1",
            questionText: "2 + 2 = ?",
            questionType: "multiple_choice",
            points: 2,
            correctAnswerText: null,
            selectedOptionId: "opt-1",
            textAnswer: null,
            isCorrect: true,
            pointsEarned: 2,
            options: [
              { id: "opt-1", label: "A", text: "4", imageUrl: null, isCorrect: true },
              { id: "opt-2", label: "B", text: "5", imageUrl: null, isCorrect: false },
            ],
          },
        ],
      },
    });
  });

  it("allows a teacher to manually regrade a submitted session", async () => {
    queueDbResults(
      [{ id: "teacher-1", fullName: "Teacher One" }],
      [{ id: "session-1", examId: "exam-1", studentId: "student-1", status: "submitted" }],
      [{ id: "exam-1", teacherId: "teacher-1" }],
      undefined,
      [{ pointsEarned: 2 }, { pointsEarned: 3 }],
      [{ points: 3 }, { points: 3 }],
      undefined,
      [{ id: "session-1", status: "graded", score: 83, earnedPoints: 5, totalPoints: 6 }],
    );

    const response = await app.request(
      "http://localhost/api/sessions/session-1/grade-manual",
      {
        method: "POST",
        headers: { ...teacherHeaders(), "content-type": "application/json" },
        body: JSON.stringify({
          grades: [
            { answerId: "answer-1", pointsEarned: 2, isCorrect: true },
          ],
        }),
      },
      workerEnv,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { id: "session-1", status: "graded", score: 83, earnedPoints: 5, totalPoints: 6 },
    });
  });
});
