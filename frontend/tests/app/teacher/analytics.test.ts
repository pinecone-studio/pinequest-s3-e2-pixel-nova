import {
  buildCheatStudents,
  buildExamStats,
  buildXpLeaderboard,
  normalizeSubmission,
} from "@/app/teacher/analytics";
import type { Exam, Submission } from "@/app/teacher/types";
import type { StudentProgress, User } from "@/lib/examGuard";

describe("teacher analytics", () => {
  const exam: Exam = {
    id: "exam-1",
    title: "Математик",
    scheduledAt: "2026-03-25T09:00:00.000Z",
    roomCode: "ROOM42",
    duration: 45,
    createdAt: "2026-03-20T09:00:00.000Z",
    questions: [
      {
        id: "q1",
        text: "2 + 2 = ?",
        type: "mcq",
        options: ["3", "4", "5", "6"],
        correctAnswer: "4",
        points: 1,
      },
      {
        id: "q2",
        text: "3 + 3 = ?",
        type: "mcq",
        options: ["5", "6", "7", "8"],
        correctAnswer: "6",
        points: 1,
      },
    ],
  };

  it("normalizes student submission names and violations", () => {
    const normalized = normalizeSubmission({
      id: "submission-1",
      examId: "exam-1",
      studentId: "student-1",
      studentНэр: "Anu",
      score: 1,
      totalPoints: 2,
      percentage: 50,
      answers: [
        { questionId: "q1", selectedAnswer: "4", correct: true },
        { questionId: "q2", selectedAnswer: "5", correct: false },
      ],
      violations: {
        tabSwitch: 2,
      },
      submittedAt: "2026-03-25T10:00:00.000Z",
    });

    expect(normalized).toMatchObject({
      studentName: "Anu",
      violations: {
        tabSwitch: 2,
        copyAttempt: 0,
      },
    });
  });

  it("builds xp leaderboard from student progress and users", () => {
    const users: User[] = [
      {
        id: "student-1",
        username: "Anu",
        password: "",
        role: "student",
        createdAt: "",
      },
      {
        id: "student-2",
        username: "Temuulen",
        password: "",
        role: "student",
        createdAt: "",
      },
    ];

    const progress: StudentProgress = {
      "student-1": {
        xp: 580,
        level: 3,
        history: [
          {
            examId: "exam-1",
            percentage: 90,
            xp: 100,
            date: "2026-03-25T10:00:00.000Z",
          },
        ],
      },
      "student-2": {
        xp: 120,
        level: 1,
        history: [],
      },
    };

    const leaderboard = buildXpLeaderboard({
      progress,
      submissions: [],
      users,
    });

    expect(leaderboard[0]).toMatchObject({
      studentId: "student-1",
      name: "Anu",
      level: 3,
    });
    expect(leaderboard[1]).toMatchObject({
      studentId: "student-2",
      nextLevelXp: 80,
    });
  });

  it("builds exam stats and cheat summaries for teacher results", () => {
    const submissions: Submission[] = [
      {
        id: "submission-1",
        examId: "exam-1",
        studentId: "student-1",
        studentName: "Anu",
        score: 2,
        totalPoints: 2,
        percentage: 100,
        answers: [
          { questionId: "q1", selectedAnswer: "4", correct: true },
          { questionId: "q2", selectedAnswer: "6", correct: true },
        ],
        violations: {
          tabSwitch: 0,
          windowBlur: 0,
          copyAttempt: 0,
          pasteAttempt: 0,
          fullscreenExit: 0,
          keyboardShortcut: 0,
        },
        submittedAt: "2026-03-25T10:00:00.000Z",
      },
      {
        id: "submission-2",
        examId: "exam-1",
        studentId: "student-2",
        studentName: "Temuulen",
        score: 1,
        totalPoints: 2,
        percentage: 50,
        answers: [
          { questionId: "q1", selectedAnswer: "4", correct: true },
          { questionId: "q2", selectedAnswer: "7", correct: false },
        ],
        violations: {
          tabSwitch: 2,
          windowBlur: 1,
          copyAttempt: 1,
          pasteAttempt: 0,
          fullscreenExit: 0,
          keyboardShortcut: 0,
        },
        submittedAt: "2026-03-25T10:05:00.000Z",
      },
    ];

    const stats = buildExamStats({
      activeExam: exam,
      activeSubmissions: submissions,
    });
    const flagged = buildCheatStudents({
      submissions,
      exams: [exam],
    });

    expect(stats).not.toBeNull();
    expect(stats?.average).toBe(75);
    expect(stats?.passRate).toBe(50);
    expect(stats?.mostMissed[0].id).toBe("q2");
    expect(flagged[0]).toMatchObject({
      name: "Temuulen",
      cheat: "Дунд",
      examTitle: "Математик",
    });
  });
});
