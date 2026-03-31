import { render, waitFor } from "@testing-library/react";
import DesktopExamCameraCard from "@/app/student/components/DesktopExamCameraCard";
import { reportCheatEvent } from "@/api/cheat";
import {
  useProctoringCamera,
  type ProctoringEvent,
} from "@/app/student/hooks/useProctoringCamera";

jest.mock("@/api/cheat", () => ({
  reportCheatEvent: jest.fn().mockResolvedValue({}),
}));

jest.mock("@/app/student/hooks/useProctoringCamera", () => ({
  useProctoringCamera: jest.fn(),
}));

const mockReportCheatEvent =
  reportCheatEvent as jest.MockedFunction<typeof reportCheatEvent>;
const mockUseProctoringCamera =
  useProctoringCamera as jest.MockedFunction<typeof useProctoringCamera>;

describe("DesktopExamCameraCard", () => {
  beforeEach(() => {
    mockReportCheatEvent.mockReset();
    mockUseProctoringCamera.mockImplementation((options) => {
      const onEvent = options?.onEvent as ((event: ProctoringEvent) => void) | undefined;
      queueMicrotask(() => {
        onEvent?.({
          type: "NO_FACE",
          confidence: 0.91,
          duration: 3200,
          timestamp: "2026-03-31T10:00:00.000Z",
          details: {
            brightness: null,
            faceCount: 0,
            yaw: null,
          },
        });
      });

      return {
        canvasRef: { current: null },
        error: null,
        events: [],
        latestObservation: {
          blockedReason: null,
          brightness: null,
          faceCount: 1,
          yaw: null,
        },
        start: jest.fn(),
        status: "running",
        stop: jest.fn(),
        videoRef: { current: null },
      } as never;
    });
  });

  it("suppresses disabled camera detections", async () => {
    const showWarning = jest.fn();

    render(
      <DesktopExamCameraCard
        enabledCheatDetections={["tab_switch"]}
        sessionId="session-1"
        showWarning={showWarning}
        user={{
          id: "student-1",
          username: "Student",
          password: "",
          role: "student",
          createdAt: "",
        }}
        view="exam"
      />,
    );

    await waitFor(() => {
      expect(showWarning).not.toHaveBeenCalled();
      expect(mockReportCheatEvent).not.toHaveBeenCalled();
    });
  });
});
