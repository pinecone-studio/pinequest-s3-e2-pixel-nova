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
    expect(screen.getByRole("button", { name: /A\.\s*2/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Илгээх" })).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: /A\.\s*2/ }));
    expect(onSelectMcq).toHaveBeenCalledWith("q-1", "2");
  });

  it("renders a desktop camera panel when provided", () => {
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
        cameraPanel={<div>desktop-camera-panel</div>}
      />,
    );

    expect(screen.getByText("desktop-camera-panel")).toBeInTheDocument();
  });

  it("moves to the next question when continue is clicked", () => {
    const onNext = jest.fn();

    render(
      <StudentExamView
        activeExam={{
          ...exam,
          questions: [
            exam.questions[0],
            {
              id: "q-2",
              text: "Question 2",
              type: "text",
              correctAnswer: "",
              points: 1,
            },
          ],
        }}
        warning={null}
        timeLeft={120}
        currentQuestionIndex={0}
        setCurrentQuestionIndex={jest.fn()}
        violations={violations}
        answers={{}}
        onUpdateAnswer={jest.fn()}
        onSelectMcq={jest.fn()}
        onPrev={jest.fn()}
        onNext={onNext}
        onSubmit={jest.fn()}
        onExit={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Үргэлжлүүлэх" }));
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Question 2")).not.toBeInTheDocument();
  });

  it("shows a back button and submit action on the last question", () => {
    const onPrev = jest.fn();
    const onSubmit = jest.fn();

    render(
      <StudentExamView
        activeExam={{
          ...exam,
          questions: [
            exam.questions[0],
            {
              id: "q-2",
              text: "Question 2",
              type: "text",
              correctAnswer: "",
              points: 1,
            },
          ],
        }}
        warning={null}
        timeLeft={120}
        currentQuestionIndex={1}
        setCurrentQuestionIndex={jest.fn()}
        violations={violations}
        answers={{}}
        onUpdateAnswer={jest.fn()}
        onSelectMcq={jest.fn()}
        onPrev={onPrev}
        onNext={jest.fn()}
        onSubmit={onSubmit}
        onExit={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Өмнөх асуулт" }));
    expect(onPrev).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Илгээх" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("renders a larger warning card copy for violations", () => {
    render(
      <StudentExamView
        activeExam={exam}
        warning="Таб сольсон үйлдэл илэрлээ"
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

    expect(screen.getByText("Анхааруулга илэрлээ")).toBeInTheDocument();
    expect(
      screen.getByText("Таб сольсон үйлдэл илэрлээ"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Дахин давтагдвал шалгалт автоматаар дуусна."),
    ).toBeInTheDocument();
  });

  it("renders latex question and option content through MathText", () => {
    render(
      <StudentExamView
        activeExam={{
          ...exam,
          questions: [
            {
              ...exam.questions[0],
              text: "Solve $x^2 = 4$",
              options: ["$\\sqrt{9}$", "5", "6", "7"],
            },
          ],
        }}
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

    expect(screen.getAllByTestId("inline-math")).toHaveLength(2);
    expect(screen.getByText("x^2 = 4")).toBeInTheDocument();
    expect(screen.getByText("\\sqrt{9}")).toBeInTheDocument();
  });

  it("renders traditional Mongolian question and option content through MongolianText", () => {
    const traditionalText = "\u182e\u1823\u1829\u182d\u1823\u182f";

    render(
      <StudentExamView
        activeExam={{
          ...exam,
          questions: [
            {
              ...exam.questions[0],
              text: traditionalText,
              options: [traditionalText, "5", "6", "7"],
            },
          ],
        }}
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

    expect(screen.getAllByTestId("traditional-mongolian-text")).toHaveLength(2);
  });
});
