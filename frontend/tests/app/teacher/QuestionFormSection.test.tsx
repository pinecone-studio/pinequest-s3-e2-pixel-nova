import { fireEvent, render, screen } from "@testing-library/react";
import QuestionFormSection from "@/app/teacher/components/exam-create/QuestionFormSection";

describe("QuestionFormSection", () => {
  it("calls addQuestion when the add button is clicked", () => {
    const addQuestion = jest.fn();

    render(
      <QuestionFormSection
        questionText="What is 2 + 2?"
        setQuestionText={jest.fn()}
        questionType="open"
        setQuestionType={jest.fn()}
        mcqOptions={["", "", "", ""]}
        setMcqOptions={jest.fn()}
        questionAnswer="4"
        setQuestionAnswer={jest.fn()}
        questionImageUrl={undefined}
        setQuestionImageUrl={jest.fn()}
        questionPoints={1}
        setQuestionPoints={jest.fn()}
        questionCorrectIndex={0}
        setQuestionCorrectIndex={jest.fn()}
        addQuestion={addQuestion}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "+ Асуулт нэмэх" }));

    expect(addQuestion).toHaveBeenCalledTimes(1);
  });
});
