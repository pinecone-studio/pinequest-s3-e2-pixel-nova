import {
  buildStudentAiInsight,
} from "@/app/student/components/student-ai-insights";

describe("student-ai-insights", () => {
  it("builds a Mongolian AI insight snapshot from student history", () => {
    const snapshot = buildStudentAiInsight({
      currentUserName: "Золбоо Бат",
      currentXp: 240,
      currentRank: 4,
      totalStudents: 18,
      levelInfo: {
        level: 2,
        name: "Суралцагч",
        minXP: 200,
      },
      studentHistory: [
        {
          examId: "e1",
          title: "Англи хэл",
          percentage: 82,
          date: "2026-03-30T10:00:00.000Z",
        },
        {
          examId: "e2",
          title: "Математик",
          percentage: 56,
          date: "2026-03-29T10:00:00.000Z",
        },
      ],
    });

    expect(snapshot.headline.length).toBeGreaterThan(10);
    expect(snapshot.summary).toContain("Золбоо");
    expect(snapshot.strengths.length).toBeGreaterThan(0);
    expect(snapshot.focusAreas.length).toBeGreaterThan(0);
    expect(snapshot.actionPlan.length).toBe(3);
    expect(snapshot.stats.examCount).toBe(2);
  });

  it("changes the generated insight when student history changes", () => {
    const firstSnapshot = buildStudentAiInsight({
      currentUserName: "Золбоо Бат",
      currentXp: 240,
      currentRank: 4,
      totalStudents: 18,
      levelInfo: {
        level: 2,
        name: "Суралцагч",
        minXP: 200,
      },
      studentHistory: [
        {
          examId: "e1",
          title: "Англи хэл",
          percentage: 82,
          date: "2026-03-30T10:00:00.000Z",
        },
      ],
    });

    const secondSnapshot = buildStudentAiInsight({
      currentUserName: "Золбоо Бат",
      currentXp: 240,
      currentRank: 4,
      totalStudents: 18,
      levelInfo: {
        level: 2,
        name: "Суралцагч",
        minXP: 200,
      },
      studentHistory: [
        {
          examId: "e1",
          title: "Англи хэл",
          percentage: 82,
          date: "2026-03-30T10:00:00.000Z",
        },
        {
          examId: "e2",
          title: "Математик",
          percentage: 56,
          date: "2026-03-31T10:00:00.000Z",
        },
      ],
    });

    expect(secondSnapshot.signature).not.toBe(firstSnapshot.signature);
    expect(secondSnapshot.stats.examCount).toBe(2);
  });
});
