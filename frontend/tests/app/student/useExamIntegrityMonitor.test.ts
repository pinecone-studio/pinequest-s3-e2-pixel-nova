import { act, renderHook } from "@testing-library/react";
import { useExamIntegrityMonitor } from "@/app/student/hooks/useExamIntegrityMonitor";

describe("useExamIntegrityMonitor", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("logs a tab switch when the exam tab becomes hidden", () => {
    const logViolation = jest.fn();
    const showWarning = jest.fn();

    renderHook(() =>
      useExamIntegrityMonitor({
        view: "exam",
        logViolation,
        showWarning,
      }),
    );

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });

    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(logViolation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "TAB_SWITCH",
        source: "browser",
      }),
    );
    expect(showWarning).toHaveBeenCalledWith("Таб сольсон үйлдэл илэрлээ");
  });

  it("throttles repeated fullscreen exits inside the client cooldown", () => {
    const logViolation = jest.fn();
    const showWarning = jest.fn();

    renderHook(() =>
      useExamIntegrityMonitor({
        view: "exam",
        logViolation,
        showWarning,
      }),
    );

    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
      document.dispatchEvent(new Event("fullscreenchange"));
    });

    expect(logViolation).toHaveBeenCalledTimes(1);
    expect(logViolation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "FULLSCREEN_EXIT",
      }),
    );
  });

  it("reports idle time when there is no activity for the timeout window", () => {
    const logViolation = jest.fn();
    const showWarning = jest.fn();

    renderHook(() =>
      useExamIntegrityMonitor({
        view: "exam",
        logViolation,
        showWarning,
      }),
    );

    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    expect(logViolation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "NO_MOUSE_MOVEMENT",
        details: expect.objectContaining({
          idleMs: expect.any(Number),
        }),
      }),
    );
  });
});
