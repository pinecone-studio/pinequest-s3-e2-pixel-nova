import { act, renderHook } from "@testing-library/react";
import { useStudentExamWarnings } from "@/app/student/hooks/useStudentExamWarnings";
import { apiFetch } from "@/lib/api-client";

jest.mock("@/lib/api-client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

describe("useStudentExamWarnings", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockApiFetch.mockReset();
    mockApiFetch.mockResolvedValue({ data: { riskLevel: "low" } } as never);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("ignores disabled detections without logging or reporting", () => {
    const { result } = renderHook(() =>
      useStudentExamWarnings("session-1", ["tab_switch"]),
    );

    act(() => {
      result.current.logViolation("COPY_ATTEMPT");
    });

    expect(result.current.violations.eventCount).toBe(0);
    expect(result.current.violations.copyAttempt).toBe(0);
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it("logs and reports enabled detections", () => {
    const { result } = renderHook(() =>
      useStudentExamWarnings("session-1", ["copy_paste"]),
    );

    act(() => {
      result.current.logViolation("COPY_ATTEMPT");
    });

    expect(result.current.violations.eventCount).toBe(1);
    expect(result.current.violations.copyAttempt).toBe(1);
    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/cheat/event",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });
});
