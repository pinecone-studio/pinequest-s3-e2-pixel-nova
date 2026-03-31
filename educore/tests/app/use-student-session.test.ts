import { act, renderHook } from "@testing-library/react-native";
import { useStudentSession } from "@/lib/student-app/hooks/use-student-session";
import { reportCheatEvent } from "@/lib/student-app/api";

jest.mock("@/lib/student-app/api", () => ({
  getSessionDetail: jest.fn(),
  getSessionResult: jest.fn(),
  joinSession: jest.fn(),
  reportCheatEvent: jest.fn().mockResolvedValue({}),
  startSession: jest.fn(),
  submitSession: jest.fn(),
  submitSessionAnswer: jest.fn(),
}));

const mockReportCheatEvent =
  reportCheatEvent as jest.MockedFunction<typeof reportCheatEvent>;

describe("useStudentSession", () => {
  beforeEach(() => {
    mockReportCheatEvent.mockReset();
  });

  it("ignores disabled integrity detections", async () => {
    const setState = jest.fn();
    const { result } = renderHook(() =>
      useStudentSession({
        state: {
          hydrated: false,
          student: {
            id: "student-1",
            code: "S-1001",
            fullName: "Bat",
            role: "student",
          },
          profile: null,
          activeSession: {
            sessionId: "session-1",
            roomCode: "ROOM01",
            status: "in_progress",
            exam: {
              id: "exam-1",
              title: "Algebra",
              durationMin: 45,
              enabledCheatDetections: ["tab_switch"],
            },
            questions: [],
            answers: {},
            currentQuestionIndex: 0,
            timerEndsAt: null,
            startedAt: null,
            lastAnswerAt: null,
            syncStatus: "ready",
            syncMessage: null,
            entryStatus: "on_time",
          },
          integrity: {
            lastEventType: null,
            lastEventAt: null,
            warningMessage: null,
            eventCount: 0,
            capabilities: {
              screenshotProtectionSupported: false,
              screenshotDetectionSupported: false,
              copyPasteRestricted: false,
              backgroundDetectionSupported: false,
              notes: [],
            },
          },
          submittedResult: null,
        } as never,
        setState,
        refreshDashboard: jest.fn(),
      }),
    );

    await act(async () => {
      await result.current.logIntegrityEvent("camera_blocked");
    });

    expect(setState).not.toHaveBeenCalled();
    expect(mockReportCheatEvent).not.toHaveBeenCalled();
  });
});
