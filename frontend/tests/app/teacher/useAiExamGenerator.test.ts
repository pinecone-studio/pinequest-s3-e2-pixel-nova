import { act, renderHook } from "@testing-library/react";
import { useAiExamGenerator } from "@/app/teacher/hooks/useAiExamGenerator";

jest.mock("@/app/teacher/hooks/teacher-api", () => ({
  generateAiExamDraft: jest.fn(),
  saveAcceptedAiDraft: jest.fn(),
}));

const {
  generateAiExamDraft,
  saveAcceptedAiDraft,
} = jest.requireMock("@/app/teacher/hooks/teacher-api") as {
  generateAiExamDraft: jest.Mock;
  saveAcceptedAiDraft: jest.Mock;
};

describe("useAiExamGenerator", () => {
  beforeEach(() => {
    generateAiExamDraft.mockReset();
    saveAcceptedAiDraft.mockReset();
  });

  it("generates a draft and stores it in state", async () => {
    generateAiExamDraft.mockResolvedValue({
      title: "Generated Biology Test",
      description: null,
      questions: [
        {
          id: "q1",
          text: "Cell is the unit of life?",
          type: "mcq",
          options: ["True", "False"],
          correctAnswer: "True",
          points: 1,
        },
      ],
    });

    const showToast = jest.fn();
    const { result } = renderHook(() =>
      useAiExamGenerator({ teacherId: "teacher-1", showToast }),
    );

    act(() => {
      result.current.updateInput("topic", "Biology");
    });

    await act(async () => {
      await result.current.generateDraft();
    });

    expect(result.current.draft?.title).toBe("Generated Biology Test");
    expect(showToast).toHaveBeenCalled();
  });

  it("surfaces generation errors cleanly", async () => {
    generateAiExamDraft.mockRejectedValue(new Error("AI down"));

    const { result } = renderHook(() =>
      useAiExamGenerator({ teacherId: "teacher-1", showToast: jest.fn() }),
    );

    act(() => {
      result.current.updateInput("topic", "Geometry");
    });

    await act(async () => {
      await result.current.generateDraft();
    });

    expect(result.current.error).toBe("AI down");
  });

  it("saves only accepted drafts", async () => {
    saveAcceptedAiDraft.mockResolvedValue({
      id: "run-1",
      status: "accepted",
    });

    const { result } = renderHook(() =>
      useAiExamGenerator({ teacherId: "teacher-1", showToast: jest.fn() }),
    );

    act(() => {
      result.current.setDraft({
        title: "Generated Draft",
        description: null,
        questions: [
          {
            id: "q1",
            text: "2 + 2 = ?",
            type: "mcq",
            options: ["3", "4", "5", "6"],
            correctAnswer: "4",
            points: 1,
          },
        ],
      });
      result.current.updateInput("topic", "Math");
    });

    await act(async () => {
      await result.current.acceptDraft();
    });

    expect(saveAcceptedAiDraft).toHaveBeenCalledTimes(1);
  });
});
