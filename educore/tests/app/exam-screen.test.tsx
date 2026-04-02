import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react-native";

import ExamScreen from "@/app/(tabs)/exam";
import { useStudentApp } from "@/lib/student-app/context";
import type { ActiveExamSession } from "@/types/student-app";

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock("expo-router",()=>({
  Redirect:({href}:{href:string})=>require("react").createElement("Text",null,`redirect:${href}`),
  useLocalSearchParams:()=>({}),
  useRouter:()=>({push:jest.fn(),replace:jest.fn()}),
}));    

jest.mock("expo-camera", () => ({
  useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
}));

jest.mock("@/lib/student-app/context", () => ({
  useStudentApp: jest.fn(),
}));

jest.mock("@/lib/student-app/hooks/use-exam-audio-recorder", () => ({
  useExamAudioRecorder: jest.fn(() => ({
    error: null,
    isSupported: true,
    lastUploadedAt: null,
    prepare: jest.fn(async () => true),
    start: jest.fn(async () => true),
    status: "ready",
    stop: jest.fn(async () => undefined),
  })),
}));

jest.mock("@/components/student-app/MobileProctorCamera", () => ({
  __esModule: true,
  default: function MockMobileProctorCamera({
    captureEnabled,
    isEnabled,
    onCameraReadyChange,
    permissionGranted,
  }: {
    captureEnabled?: boolean;
    isEnabled: boolean;
    onCameraReadyChange?: (ready: boolean) => void;
    permissionGranted: boolean;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");

    React.useEffect(() => {
      if (isEnabled && permissionGranted) {
        onCameraReadyChange?.(true);
      }
    }, [isEnabled, onCameraReadyChange, permissionGranted]);

    return isEnabled
      ? React.createElement(
          "Text",
          null,
          captureEnabled ? "camera-capturing" : "camera-preflight",
        )
      : null;
  },
}));

const mockUseStudentApp = useStudentApp as jest.MockedFunction<
  typeof useStudentApp
>;
const mockUseCameraPermissions = jest.requireMock("expo-camera")
  .useCameraPermissions as jest.Mock;

const buildActiveSession = (
  status: ActiveExamSession["status"] = "joined",
): ActiveExamSession => ({
  sessionId: "session-1",
  roomCode: "ROOM01",
  status,
  exam: {
    id: "exam-1",
    title: "Demo exam",
    description: null,
    durationMin: 45,
    questionCount: 1,
  },
  questions: [
    {
      id: "question-1",
      type: "multiple_choice" as const,
      questionText: "2 + 2 = ?",
      imageUrl: null,
      audioUrl: null,
      points: 1,
      difficulty: "easy",
      topic: null,
      options: [
        { id: "opt-1", label: "A", text: "4" },
        { id: "opt-2", label: "B", text: "5" },
      ],
    },
  ],
  answers: {},
  currentQuestionIndex: 0,
  timerEndsAt: Date.now() + 60_000,
  startedAt: new Date().toISOString(),
  lastAnswerAt: null,
  syncStatus: "ready",
  syncMessage: null,
  entryStatus: "on_time",
});

const baseContext = {
  authMode: "user_switcher" as const,
  activeSession: null,
  answerQuestion: jest.fn(),
  availableUsers: [],
  clearResult: jest.fn(),
  dashboardError: null,
  dashboardLoading: false,
  history: [],
  hydrated: true,
  integrity: {
    lastEventType: null,
    lastEventAt: null,
    warningMessage: null,
    eventCount: 0,
    capabilities: {
      screenshotProtectionSupported: false,
      screenshotDetectionSupported: false,
      copyPasteRestricted: true,
      backgroundDetectionSupported: true,
      notes: [],
    },
  },
  joinExam: jest.fn(),
  logIntegrityEvent: jest.fn(),
  logout: jest.fn(),
  profile: null,
  progressSummary: {
    totalSessions: 0,
    gradedSessions: 0,
    averageScore: null,
    bestScore: null,
    latestScore: null,
    latestCompletedAt: null,
  },
  upcomingExams: [],
  recoverActiveSession: jest.fn(),
  refreshDashboard: jest.fn(),
  refreshProfile: jest.fn(),
  saveProfile: jest.fn(),
  setCurrentQuestionIndex: jest.fn(),
  setIntegrityWarning: jest.fn(),
  signInWithCode: jest.fn(),
  signingIn: false,
  startExam: jest.fn(),
  student: { id: "s1", fullName: "Student", role: "student" as const },
  submittedResult: null,
  submitCurrentExam: jest.fn(),
  switchUser: jest.fn(),
};

describe("ExamScreen", () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it("keeps the tab mounted while session state hydrates", () => {
    mockUseStudentApp.mockReturnValue({
      ...baseContext,
      hydrated: false,
    });

    const screen = render(<ExamScreen />);

    expect(screen.getByText("Ачааллаж байна...")).toBeTruthy();
    screen.unmount();
  });

  it("shows an empty state when there is no active exam", () => {
    mockUseStudentApp.mockReturnValue(baseContext);

    const screen = render(<ExamScreen />);

    expect(screen.getByText("Товлогдсон шалгалт алга")).toBeTruthy();
    expect(screen.getByPlaceholderText("Шалгалт хайх...")).toBeTruthy();
    screen.unmount();
  });

  it("blocks exam start when camera permission is denied", async () => {
    const startExam = jest.fn();
    const requestPermission = jest.fn(async () => ({ granted: false }));

    mockUseCameraPermissions.mockReturnValue([
      { granted: false },
      requestPermission,
    ]);
    mockUseStudentApp.mockReturnValue({
      ...baseContext,
      activeSession: buildActiveSession("joined"),
      startExam,
    });

    const screen = render(<ExamScreen />);

    fireEvent.press(screen.getByText("Шалгалтанд орох"));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Шалгалтыг эхлүүлэхийн өмнө камерын зөвшөөрөл шаардлагатай.",
        ),
      ).toBeTruthy();
    });
    expect(startExam).not.toHaveBeenCalled();
    screen.unmount();
  });

  it("renders the camera preview card when the exam is in progress", () => {
    mockUseCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);
    mockUseStudentApp.mockReturnValue({
      ...baseContext,
      activeSession: buildActiveSession("in_progress"),
    });

    const screen = render(<ExamScreen />);

    expect(screen.getByText(/camera-capturing/)).toBeTruthy();
    expect(screen.getByText("Demo exam")).toBeTruthy();
    expect(screen.getByText("Үлдсэн хугацаа")).toBeTruthy();
    screen.unmount();
  });

  it("renders traditional Mongolian question text through the mobile Mongolian renderer", () => {
    const traditionalText = "\u182e\u1823\u1829\u182d\u1823\u182f";

    mockUseCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);
    mockUseStudentApp.mockReturnValue({
      ...baseContext,
      activeSession: {
        ...buildActiveSession("in_progress"),
        questions: [
          {
            ...buildActiveSession("in_progress").questions[0],
            questionText: traditionalText,
          },
        ],
      },
    });

    const screen = render(<ExamScreen />);

    expect(screen.getByTestId("traditional-mongolian-webview")).toBeTruthy();
    screen.unmount();
  });

  it("does not render mock active exam CTAs when there is no real exam data", () => {
    mockUseStudentApp.mockReturnValue(baseContext);

    const screen = render(<ExamScreen />);

    expect(screen.queryByText("Open exam")).toBeNull();
    screen.unmount();
  });

  it("does not render mock history scores when there is no real history data", () => {
    mockUseStudentApp.mockReturnValue(baseContext);

    const screen = render(<ExamScreen />);

    fireEvent.press(screen.getByText("Шалгалтын түүх"));

    expect(screen.queryByText("91")).toBeNull();
    screen.unmount();
  });
});
