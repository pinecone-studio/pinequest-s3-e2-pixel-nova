import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useStudentSession } from "@/lib/student-app/hooks/use-student-session";
import type {
  StudentAppSetState,
  StudentAppState,
} from "@/lib/student-app/core/state";
import {
  getSessionDetail,
  reportCheatEvent,
  startSessionWithOptions,
} from "@/lib/student-app/services/api";

jest.mock("@/lib/student-app/services/api", () => ({
  getSessionDetail: jest.fn(),
  getSessionResult: jest.fn(),
  joinSession: jest.fn(),
  reportCheatEvent: jest.fn().mockResolvedValue({}),
  startSession: jest.fn(),
  startSessionWithOptions: jest.fn(),
  submitSession: jest.fn(),
  submitSessionAnswer: jest.fn(),
}));

const mockGetSessionDetail =
  getSessionDetail as jest.MockedFunction<typeof getSessionDetail>;
const mockReportCheatEvent =
  reportCheatEvent as jest.MockedFunction<typeof reportCheatEvent>;
const mockStartSessionWithOptions =
  startSessionWithOptions as jest.MockedFunction<typeof startSessionWithOptions>;

describe("useStudentSession", () => {
  beforeEach(() => {
    mockGetSessionDetail.mockReset();
    mockReportCheatEvent.mockReset();
    mockStartSessionWithOptions.mockReset();
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

  it("recovers the active session when start returns INVALID_STATUS for an already-started exam", async () => {
    let currentState: StudentAppState = {
      hydrated: false,
      authMode: "user_switcher",
      availableUsers: [],
      student: {
        id: "student-1",
        code: "S-1001",
        fullName: "Bat",
        role: "student" as const,
      },
      profile: null,
      activeSession: {
        sessionId: "session-1",
        roomCode: "ROOM01",
        status: "joined" as const,
        exam: {
          id: "exam-1",
          title: "Algebra",
          durationMin: 45,
        },
        questions: [
          {
            id: "question-1",
            type: "multiple_choice" as const,
            questionText: "2 + 2 = ?",
            points: 1,
            options: [{ id: "opt-1", label: "A", text: "4" }],
          },
        ],
        answers: {},
        currentQuestionIndex: 0,
        timerEndsAt: null,
        startedAt: null,
        lastAnswerAt: null,
        syncStatus: "ready" as const,
        syncMessage: null,
        entryStatus: "on_time" as const,
      },
      upcomingExams: [],
      history: [],
      progressSummary: {
        totalSessions: 0,
        gradedSessions: 0,
        averageScore: null,
        bestScore: null,
        latestScore: null,
        latestCompletedAt: null,
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
      signingIn: false,
      dashboardLoading: false,
      dashboardError: null,
    };

    const setState: StudentAppSetState = jest.fn((value) => {
      currentState =
        typeof value === "function" ? value(currentState) : value;
    });

    mockStartSessionWithOptions.mockRejectedValue(
      new Error(
        JSON.stringify({
          error: {
            code: "INVALID_STATUS",
            message: "Session must be in 'joined' or 'late' status to start",
          },
        }),
      ),
    );
    mockGetSessionDetail.mockResolvedValue({
      session: {
        id: "session-1",
        status: "in_progress",
        startedAt: "2026-04-03T00:00:00.000Z",
        submittedAt: null,
      },
      exam: {
        id: "exam-1",
        title: "Algebra",
        durationMin: 45,
      },
      questions: [
        {
          id: "question-1",
          type: "multiple_choice",
          questionText: "2 + 2 = ?",
          points: 1,
          options: [{ id: "opt-1", label: "A", text: "4" }],
        },
      ],
    });

    const { result } = renderHook(() =>
      useStudentSession({
        state: currentState as never,
        setState,
        refreshDashboard: jest.fn(),
      }),
    );

    await act(async () => {
      await expect(result.current.startExam()).resolves.toBeUndefined();
    });

    expect(mockStartSessionWithOptions).toHaveBeenCalledWith(
      currentState.student,
      "session-1",
      undefined,
    );
    expect(mockGetSessionDetail).toHaveBeenCalledWith(
      currentState.student,
      "session-1",
    );
    expect(currentState.activeSession?.status).toBe("in_progress");
    expect(currentState.activeSession?.startedAt).toBe(
      "2026-04-03T00:00:00.000Z",
    );
    expect(currentState.activeSession?.syncStatus).toBe("ready");
  });

  it("does not downgrade an in-progress session when recovery returns stale joined detail", async () => {
    const originalStartedAt = "2026-04-03T01:00:00.000Z";
    const originalTimerEndsAt = new Date(originalStartedAt).getTime() + 45 * 60 * 1000;

    let currentState: StudentAppState = {
      hydrated: true,
      authMode: "user_switcher",
      availableUsers: [],
      student: {
        id: "student-1",
        code: "S-1001",
        fullName: "Bat",
        role: "student" as const,
      },
      profile: null,
      activeSession: {
        sessionId: "session-1",
        roomCode: "ROOM01",
        status: "in_progress" as const,
        exam: {
          id: "exam-1",
          title: "Algebra",
          durationMin: 45,
        },
        questions: [
          {
            id: "question-1",
            type: "multiple_choice" as const,
            questionText: "2 + 2 = ?",
            points: 1,
            options: [{ id: "opt-1", label: "A", text: "4" }],
          },
        ],
        answers: {},
        currentQuestionIndex: 0,
        timerEndsAt: originalTimerEndsAt,
        startedAt: originalStartedAt,
        lastAnswerAt: null,
        syncStatus: "ready" as const,
        syncMessage: null,
        entryStatus: "on_time" as const,
      },
      upcomingExams: [],
      history: [],
      progressSummary: {
        totalSessions: 0,
        gradedSessions: 0,
        averageScore: null,
        bestScore: null,
        latestScore: null,
        latestCompletedAt: null,
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
      signingIn: false,
      dashboardLoading: false,
      dashboardError: null,
    };

    const setState: StudentAppSetState = jest.fn((value) => {
      currentState =
        typeof value === "function" ? value(currentState) : value;
    });

    mockGetSessionDetail.mockResolvedValue({
      session: {
        id: "session-1",
        status: "joined",
        startedAt: null,
        submittedAt: null,
      },
      exam: {
        id: "exam-1",
        title: "Algebra",
        durationMin: 45,
      },
      questions: [
        {
          id: "question-1",
          type: "multiple_choice",
          questionText: "2 + 2 = ?",
          points: 1,
          options: [{ id: "opt-1", label: "A", text: "4" }],
        },
      ],
    });

    renderHook(() =>
      useStudentSession({
        state: currentState as never,
        setState,
        refreshDashboard: jest.fn(),
      }),
    );

    await waitFor(() => {
      expect(mockGetSessionDetail).toHaveBeenCalledWith(
        currentState.student,
        "session-1",
      );
    });

    expect(currentState.activeSession?.status).toBe("in_progress");
    expect(currentState.activeSession?.startedAt).toBe(originalStartedAt);
    expect(currentState.activeSession?.timerEndsAt).toBe(originalTimerEndsAt);
    expect(currentState.activeSession?.syncStatus).toBe("ready");
  });
});
