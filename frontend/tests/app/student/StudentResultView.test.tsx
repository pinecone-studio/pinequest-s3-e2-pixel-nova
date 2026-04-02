import { fireEvent, render, screen } from "@testing-library/react";
import StudentResultView from "@/app/student/components/StudentResultView";
import type { Submission } from "@/app/student/types";

const defaultResultProps = {
  resultPending: false,
  resultCountdown: "00:00",
  resultReleaseAt: null,
};

const mockSubmission = {
  id: "sub-1",
  examId: "e1",
  studentId: "s1",
  answers: [
    { questionId: "q1", selectedAnswer: "A", correct: true },
    { questionId: "q2", selectedAnswer: "C", correct: false },
  ],
  score: 85,
  totalPoints: 100,
  percentage: 85,
  submittedAt: "2024-06-01T10:00:00Z",
} as unknown as Submission;

const mockAnswerReport = [
  {
    question: { id: "q1", text: "What is 1 + 1?", correctAnswer: "2" },
    answer: "2",
    correct: true,
  },
  {
    question: { id: "q2", text: "Solve $x^2 = 1$", correctAnswer: "$x = 1$" },
    answer: "3",
    correct: false,
  },
];

describe("StudentResultView", () => {
  it("shows a pending state when lastSubmission is null", () => {
    render(
      <StudentResultView
        lastSubmission={null}
        answerReport={[]}
        {...defaultResultProps}
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.queryByText("85%")).not.toBeInTheDocument();
  });

  it("shows back button when no submission and calls onBack", () => {
    const onBack = jest.fn();
    render(
      <StudentResultView
        lastSubmission={null}
        answerReport={[]}
        {...defaultResultProps}
        onBack={onBack}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders result summary with percentage and score", () => {
    render(
      <StudentResultView
        lastSubmission={mockSubmission}
        answerReport={mockAnswerReport}
        {...defaultResultProps}
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByText("85%")).toBeInTheDocument();
    expect(screen.getByText("85/100")).toBeInTheDocument();
    expect(screen.getByText("1/1")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText(/Алдсан асуултуудаа давтаад/)).toBeInTheDocument();
  });

  it("renders answer report with correct and incorrect labels", () => {
    render(
      <StudentResultView
        lastSubmission={mockSubmission}
        answerReport={mockAnswerReport}
        {...defaultResultProps}
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByText(/What is 1 \+ 1/)).toBeInTheDocument();
    expect(screen.getByText(/x\^2 = 1/)).toBeInTheDocument();
    expect(screen.getAllByText("Зөв").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Буруу").length).toBeGreaterThan(0);
  });

  it("shows correct answer for incorrect questions", () => {
    render(
      <StudentResultView
        lastSubmission={mockSubmission}
        answerReport={mockAnswerReport}
        {...defaultResultProps}
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByText(/Зөв хариулт:/)).toBeInTheDocument();
    expect(screen.getByText("x = 1")).toBeInTheDocument();
  });

  it("does not show duplicate correct answer hints", () => {
    render(
      <StudentResultView
        lastSubmission={mockSubmission}
        answerReport={mockAnswerReport}
        {...defaultResultProps}
        onBack={jest.fn()}
      />,
    );

    const hints = screen.getAllByText(/Зөв хариулт:/);
    expect(hints).toHaveLength(1);
  });

  it("calls onBack when button clicked on result view", () => {
    const onBack = jest.fn();
    render(
      <StudentResultView
        lastSubmission={mockSubmission}
        answerReport={mockAnswerReport}
        {...defaultResultProps}
        onBack={onBack}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders traditional Mongolian report content through MongolianText", () => {
    const traditionalText = "\u182e\u1823\u1829\u182d\u1823\u182f";

    render(
      <StudentResultView
        lastSubmission={mockSubmission}
        answerReport={[
          {
            question: {
              id: "q3",
              text: traditionalText,
              correctAnswer: traditionalText,
            },
            answer: "",
            correct: false,
          },
        ]}
        {...defaultResultProps}
        onBack={jest.fn()}
      />,
    );

    expect(screen.getAllByTestId("traditional-mongolian-text")).toHaveLength(2);
  });

  it("renders with empty answer report", () => {
    render(
      <StudentResultView
        lastSubmission={mockSubmission}
        answerReport={[]}
        {...defaultResultProps}
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByText("85%")).toBeInTheDocument();
    expect(screen.getByText("85/100")).toBeInTheDocument();
  });
});
