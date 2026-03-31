import { fireEvent, render, screen } from "@testing-library/react";
import ResultsSummaryCard from "@/app/teacher/components/ResultsSummaryCard";
import type { Exam, ExamStatsSummary } from "@/app/teacher/types";

describe("ResultsSummaryCard", () => {
  const examOptions: Exam[] = [
    {
      id: "exam-1",
      title: "Англи хэлний шалгалт",
      roomCode: "ROOM-1",
      createdAt: "2026-03-31T08:00:00.000Z",
      scheduledAt: null,
      questions: [],
    },
    {
      id: "exam-2",
      title: "Математикийн шалгалт",
      roomCode: "ROOM-2",
      createdAt: "2026-03-31T09:00:00.000Z",
      scheduledAt: null,
      questions: [],
    },
  ];

  const examStats: ExamStatsSummary = {
    average: 68,
    passRate: 75,
    submissionCount: 12,
    totalPoints: 30,
    correctTotal: 84,
    incorrectTotal: 28,
    scoreDistribution: [
      { name: "A", score: 4 },
      { name: "B", score: 6 },
    ],
    performanceBands: [
      { label: "0-49%", count: 2, color: "#f97316" },
      { label: "50-69%", count: 3, color: "#facc15" },
      { label: "70-89%", count: 5, color: "#22c55e" },
      { label: "90-100%", count: 2, color: "#2563eb" },
    ],
    questionStats: [
      {
        id: "q-1",
        text: "Which answer is correct?",
        correctCount: 4,
        total: 12,
        correctRate: 33,
        missCount: 8,
        skippedCount: 1,
        topWrongAnswer: "B",
        topWrongAnswerCount: 5,
      },
    ],
    mostMissed: [
      {
        id: "q-1",
        text: "Which answer is correct?",
        correctCount: 4,
        total: 12,
        correctRate: 33,
        missCount: 8,
        skippedCount: 1,
        topWrongAnswer: "B",
        topWrongAnswerCount: 5,
      },
    ],
    mostCorrect: [
      {
        id: "q-2",
        text: "Select the main verb",
        correctCount: 11,
        total: 12,
        correctRate: 92,
        missCount: 1,
        skippedCount: 0,
        topWrongAnswer: "C",
        topWrongAnswerCount: 1,
      },
    ],
  };

  it("renders teacher-friendly summary metrics and takeaways", () => {
    render(
      <ResultsSummaryCard
        examOptions={examOptions}
        activeExamId="exam-1"
        onSelectExam={jest.fn()}
        examStats={examStats}
      />,
    );

    expect(screen.getByText("Товч дүгнэлт")).toBeInTheDocument();
    expect(screen.getByText(/Анги нийтээрээ/i)).toBeInTheDocument();
    expect(screen.getByText("Багшийн гол анхаарах зүйл:")).toBeInTheDocument();
    expect(screen.getByText("Тэнцсэн сурагч")).toBeInTheDocument();
    expect(screen.getByText("Анхаарах асуулт")).toBeInTheDocument();
    expect(screen.getByText("9/12")).toBeInTheDocument();
    expect(
      screen.getByText(/12 сурагчийн илгээлт орсон, ангийн дундаж 68%/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Дахин тайлбарлах асуулт")).toBeInTheDocument();
    expect(screen.getByText("Хамгийн ойлгомжтой асуулт")).toBeInTheDocument();
    expect(
      screen.getByText(/"Which answer is correct\?" асуултаас эхэлж тайлбарлавал хамгийн үр дүнтэй\./i),
    ).toBeInTheDocument();
  });

  it("lets the teacher switch the selected exam", () => {
    const onSelectExam = jest.fn();

    render(
      <ResultsSummaryCard
        examOptions={examOptions}
        activeExamId="exam-1"
        onSelectExam={onSelectExam}
        examStats={examStats}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Англи хэлний шалгалт" }));
    fireEvent.click(screen.getByRole("button", { name: "Математикийн шалгалт" }));

    expect(onSelectExam).toHaveBeenCalledWith("exam-2");
  });

  it("shows an empty helper when no finished exam is selected", () => {
    render(
      <ResultsSummaryCard
        examOptions={examOptions}
        activeExamId={null}
        onSelectExam={jest.fn()}
        examStats={null}
      />,
    );

    expect(
      screen.getByText(
        "Дууссан шалгалт сонгоход энд ангийн дундаж, анхаарах асуултууд, сурагчдын тайлан харагдана.",
      ),
    ).toBeInTheDocument();
  });
});
