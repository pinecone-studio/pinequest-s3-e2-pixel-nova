import { act, renderHook } from "@testing-library/react";
import { useStudentExamWarnings } from "@/app/student/hooks/useStudentExamWarnings";
import { apiRequest } from "@/api/client";

jest.mock("@/api/client", () => ({
  apiRequest: jest.fn(),
}));

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe("useStudentExamWarnings", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockApiRequest.mockReset();
    mockApiRequest.mockResolvedValue({ riskLevel: "low" } as never);
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
    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  it("logs and reports enabled detections", async () => {
    const { result } = renderHook(() =>
      useStudentExamWarnings("session-1", ["copy_paste"]),
    );

    await act(async () => {
      result.current.logViolation("COPY_ATTEMPT");
      await Promise.resolve();
    });

    expect(result.current.violations.eventCount).toBe(1);
    expect(result.current.violations.copyAttempt).toBe(1);
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/cheat/event",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("applies returned risk level without act warnings", async () => {
    const { result } = renderHook(() =>
      useStudentExamWarnings("session-1", ["copy_paste"]),
    );

    await act(async () => {
      result.current.logViolation("COPY_ATTEMPT");
      await Promise.resolve();
    });

    expect(result.current.violations.riskLevel).toBe("low");
  });
});
