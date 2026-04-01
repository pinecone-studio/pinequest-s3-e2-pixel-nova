jest.mock("../src/utils/id", () => ({
  newId: () => "test-id",
}));

import {
  buildSystemPrompt,
  isMathOrScience,
  type ExamGeneratorRequest,
} from "../src/utils/exam-generator";

const baseInput: ExamGeneratorRequest = {
  topic: "final exam",
  difficulty: "medium",
  questionCount: 5,
};

describe("exam generator prompt helpers", () => {
  it("detects math subjects", () => {
    expect(
      isMathOrScience({
        ...baseInput,
        subject: "Math",
      }),
    ).toBe(true);
  });

  it("returns false for non-math humanities input", () => {
    expect(
      isMathOrScience({
        ...baseInput,
        subject: "History",
        topic: "World War II",
      }),
    ).toBe(false);
  });

  it("detects science keywords from the topic", () => {
    expect(
      isMathOrScience({
        ...baseInput,
        subject: "",
        topic: "chemistry midterm",
      }),
    ).toBe(true);
  });

  it("adds latex guidance for math and science prompts", () => {
    expect(
      buildSystemPrompt({
        ...baseInput,
        subject: "Physics",
      }),
    ).toContain("Use $...$ for inline");
  });

  it("does not add latex guidance for non-math prompts", () => {
    expect(
      buildSystemPrompt({
        ...baseInput,
        subject: "History",
        topic: "World War II",
      }),
    ).not.toContain("Use $...$ for inline");
  });
});
