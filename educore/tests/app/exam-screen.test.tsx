import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react-native';

import ExamScreen from '@/app/(tabs)/exam';
import { useStudentApp } from '@/lib/student-app/context';
import type { ActiveExamSession } from '@/types/student-app';

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock("expo-router", () => ({
  Redirect: ({ href }: { href: string }) =>
    require("react").createElement("Text", null, `redirect:${href}`),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock("expo-camera", () => ({
  useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
}));

jest.mock("@/lib/student-app/context", () => ({
  useStudentApp: jest.fn(),
}));

jest.mock("@/components/student-app/MobileProctorCamera", () => ({
  __esModule: true,
  default: ({
    isEnabled,
    permissionGranted,
  }: {
    isEnabled: boolean;
    permissionGranted: boolean;
  }) =>
    isEnabled
      ? require("react").createElement(
          "Text",
          null,
          permissionGranted ? "camera-preview-active" : "camera-preview-blocked",
        )
      : null,
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

    expect(screen.getByText("Уншиж байна...")).toBeTruthy();
    screen.unmount();
  });

  it("shows an empty state when there is no active exam", () => {
    mockUseStudentApp.mockReturnValue(baseContext);

    const screen = render(<ExamScreen />);

    expect(
      screen.getByText("Өнөөдөр товлогдсон шалгалт байхгүй байна"),
    ).toBeTruthy();
    expect(screen.getByText("Шалгалтанд нэгдэх")).toBeTruthy();
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

    fireEvent.press(screen.getByText("Шалгалт эхлүүлэх"));

    await waitFor(() => {
      expect(
        screen.getByText(/Камерын зөвшөөрөл шаардлагатай/),
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

    expect(screen.getByText("camera-preview-active")).toBeTruthy();
    expect(
      screen.getByText(
        /ойролцоогоор 15 сек тутам snapshot авч шууд R2 storage руу upload хийгээд backend AI-аар шинжилнэ/,
      ),
    ).toBeTruthy();
    screen.unmount();
  });
});
