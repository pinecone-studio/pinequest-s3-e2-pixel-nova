import { fireEvent, render, screen } from "@testing-library/react";
import StudentExamView from "@/app/student/components/StudentExamView";
import type { Exam, Violations } from "@/app/student/types";

const violations: Violations = {
  tabSwitch: 0,
  windowBlur: 0,
  copyAttempt: 0,
  pasteAttempt: 0,
  fullscreenExit: 0,
  keyboardShortcut: 0,
  log: [],
};

const exam: Exam = {
  id: "exam-1",
  title: "Math Quiz",
  scheduledAt: null,
  roomCode: "ROOM1",
  createdAt: "2026-03-26T00:00:00.000Z",
  duration: 45,
  questions: [
    {
      id: "q-1",
      text: "Дүрсийг хараад зөв хариултаа сонгоно уу.",
      type: "mcq",
      options: ["2", "4", "8", "16"],
      correctAnswer: "4",
      points: 1,
      imageUrl: "data:image/png;base64,abc123",
    },
  ],
};

describe("StudentExamView", () => {
  it("renders the question image before answer options", () => {
    render(
      <StudentExamView
        activeExam={exam}
        warning={null}
        timeLeft={120}
        currentQuestionIndex={0}
        setCurrentQuestionIndex={jest.fn()}
        violations={violations}
        answers={{}}
        onUpdateAnswer={jest.fn()}
        onSelectMcq={jest.fn()}
        onPrev={jest.fn()}
        onNext={jest.fn()}
        onSubmit={jest.fn()}
        onExit={jest.fn()}
      />,
    );

    const image = screen.getByAltText("Асуултын зураг");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "data:image/png;base64,abc123");
    expect(screen.getByText("A. 2")).toBeInTheDocument();
  });

  it("selects an mcq option", () => {
    const onSelectMcq = jest.fn();
    render(
      <StudentExamView
        activeExam={exam}
        warning={null}
        timeLeft={120}
        currentQuestionIndex={0}
        setCurrentQuestionIndex={jest.fn()}
        violations={violations}
        answers={{}}
        onUpdateAnswer={jest.fn()}
        onSelectMcq={onSelectMcq}
        onPrev={jest.fn()}
        onNext={jest.fn()}
        onSubmit={jest.fn()}
        onExit={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "A. 2" }));
    expect(onSelectMcq).toHaveBeenCalledWith("q-1", "2");
  });
});
