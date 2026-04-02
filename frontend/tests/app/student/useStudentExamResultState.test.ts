import { act, renderHook } from "@testing-library/react";
import { useStudentExamResultState } from "@/app/student/hooks/useStudentExamResultState";

const mockApiRequest = jest.fn();

jest.mock("@/api/client", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

jest.mock("@/app/student/hooks/student-exam-session-helpers", () => ({
  mapResultToReport: jest.fn(() => []),
}));

describe("useStudentExamResultState", () => {
  const exam = {
    id: "exam-1",
    title: "Math Exam",
    status: "finished",
    scheduledAt: "2026-04-03T10:00:00.000Z",
    roomCode: "ROOM1",
    createdAt: "2026-04-03T09:00:00.000Z",
    duration: 45,
    questions: [],
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockApiRequest.mockReset();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("retries immediately when the release countdown reaches zero", async () => {
    mockApiRequest
      .mockRejectedValueOnce(new Error("pending"))
      .mockResolvedValueOnce({
        answers: [],
        score: 8,
        totalPoints: 10,
      });

    const { result } = renderHook(() =>
      useStudentExamResultState("session-1", exam as never),
    );

    act(() => {
      result.current.setLastSubmission({
        id: "session-1",
        examId: "exam-1",
        studentId: "student-1",
        studentName: "Бат",
        score: 0,
        totalPoints: 0,
        percentage: 0,
        submittedAt: "2026-04-03T10:00:00.000Z",
      } as never);
      result.current.setResultPending(true);
      result.current.setResultReleaseAt(
        new Date(Date.now() + 1000).toISOString(),
      );
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockApiRequest).toHaveBeenCalledTimes(2);
    expect(result.current.resultPending).toBe(false);
    expect(result.current.lastSubmission?.score).toBe(8);
  });
});
