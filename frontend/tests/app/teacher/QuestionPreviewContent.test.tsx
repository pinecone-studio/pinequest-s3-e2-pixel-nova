import { render, screen } from "@testing-library/react";
import QuestionPreviewContent from "@/app/teacher/components/exam-create/QuestionPreviewContent";
import type { Question } from "@/app/teacher/types";

const traditionalText = "\u182e\u1823\u1829\u182d\u1823\u182f";

const baseQuestion: Question = {
  id: "q-1",
  text: "Question",
  type: "mcq",
  options: ["A", "B", "C", "D"],
  correctAnswer: "A",
  points: 1,
};

describe("QuestionPreviewContent", () => {
  it("renders traditional Mongolian text through MongolianText", () => {
    render(
      <QuestionPreviewContent
        activeQuestion={{ ...baseQuestion, text: traditionalText }}
        activeOptions={[traditionalText, "B", "C", "D"]}
        previewIndex={0}
      />,
    );

    expect(screen.getAllByTestId("traditional-mongolian-text")).toHaveLength(2);
  });
});
