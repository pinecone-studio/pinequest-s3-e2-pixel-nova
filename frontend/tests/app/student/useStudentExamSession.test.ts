import { act, renderHook } from "@testing-library/react";
import { apiRequest } from "@/api/client";
import { useStudentExamSession } from "@/app/student/hooks/useStudentExamSession";

jest.mock("@/api/client", () => ({
  apiRequest: jest.fn(),
}));

jest.mock("@/api/notifications", () => ({
  openNotificationsLiveStream: jest.fn(() => jest.fn()),
}));

const showWarning = jest.fn();
const setViolations = jest.fn();
const logViolation = jest.fn();

jest.mock("@/app/student/hooks/useStudentExamWarnings", () => ({
  useStudentExamWarnings: jest.fn(() => ({
    violations: {
      tabSwitch: 0,
      windowBlur: 0,
      copyAttempt: 0,
      pasteAttempt: 0,
      fullscreenExit: 0,
      keyboardShortcut: 0,
      idleTooLong: 0,
      rightClick: 0,
      suspiciousResize: 0,
      eventCount: 0,
      riskLevel: "low",
      log: [],
    },
    setViolations,
    warning: null,
    showWarning,
    logViolation,
  })),
}));

jest.mock("@/app/student/hooks/useStudentExamResultState", () => ({
  useStudentExamResultState: jest.fn(() => ({
    lastSubmission: null,
    setLastSubmission: jest.fn(),
    resultPending: false,
    setResultPending: jest.fn(),
    resultReleaseAt: null,
    setResultReleaseAt: jest.fn(),
    resultCountdown: "00:00:00",
    answerReport: [],
    setAnswerReport: jest.fn(),
  })),
}));

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("useStudentExamSession", () => {
  beforeEach(() => {
    mockApiRequest.mockReset();
    showWarning.mockReset();
    setViolations.mockReset();
    logViolation.mockReset();
    window.localStorage.clear();
    window.sessionStorage.clear();

    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: true,
    });

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: jest.fn(async (constraints: MediaStreamConstraints) => {
          if (constraints.video) {
            throw new Error("Camera permission denied");
          }
          if (constraints.audio) {
            throw new Error("Microphone permission denied");
          }
          return {
            getTracks: () => [],
          };
        }),
      },
    });
  });

  it("starts the exam even when camera and microphone permissions are denied", async () => {
    const setJoinError = jest.fn();

    mockApiRequest.mockImplementation(async (url, init) => {
      if (url === "/api/sessions/session-1") {
        return {
          exam: {
            id: "exam-1",
            title: "Math",
            durationMin: 45,
            requiresAudioRecording: true,
            enabledCheatDetections: ["camera_blocked"],
            status: "joined",
          },
          answers: [],
          questions: [
            {
              id: "question-1",
              type: "mcq",
              questionText: "2 + 2 = ?",
              points: 1,
              options: [
                { id: "option-1", label: "A", text: "4" },
                { id: "option-2", label: "B", text: "5" },
              ],
            },
          ],
        };
      }

      if (url === "/api/sessions/session-1/start") {
        expect(init).toMatchObject({
          method: "POST",
          body: JSON.stringify({ audioReady: undefined }),
        });

        return {
          status: "in_progress",
          startedAt: "2026-04-03T10:00:00.000Z",
        };
      }

      if (url === "/api/cheat/event") {
        return { success: true };
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    const { result } = renderHook(() =>
      useStudentExamSession({
        currentUser: {
          id: "student-1",
          username: "zolboo",
          role: "student",
          password: "",
          createdAt: "2026-04-03T09:00:00.000Z",
        },
        roomCodeInput: "room1",
        sessionId: "session-1",
        setJoinError,
      }),
    );

    await act(async () => {
      result.current.startExam();
      await flushPromises();
    });

    expect(result.current.view).toBe("exam");
    expect(result.current.activeExam?.id).toBe("exam-1");
    expect(setJoinError).toHaveBeenCalledWith(null);
    expect(showWarning).toHaveBeenCalledWith(
      "камер ба микрофон зөвшөөрөгдөөгүй ч шалгалт эхэллээ. Багшид мэдэгдэнэ.",
    );
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/cheat/event",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"eventType":"camera_blocked"'),
      }),
    );
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/cheat/event",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"eventType":"microphone_permission_denied"'),
      }),
    );
  });
});
