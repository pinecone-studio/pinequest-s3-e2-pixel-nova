import React from "react";
import { cleanup, render } from "@testing-library/react-native";

import HomeScreen from "@/app/(tabs)/home";
import { useStudentApp } from "@/lib/student-app/context";

const mockPush = jest.fn();

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    return React.createElement("Text", null, name);
  },
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/lib/student-app/context", () => ({
  useStudentApp: jest.fn(),
}));

const mockUseStudentApp = useStudentApp as jest.MockedFunction<
  typeof useStudentApp
>;

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
  student: { id: "student-1", fullName: "Test Student", role: "student" as const },
  submittedResult: null,
  submitCurrentExam: jest.fn(),
  switchUser: jest.fn(),
};

describe("HomeScreen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-03T10:00:00.000Z"));
    mockUseStudentApp.mockReturnValue(baseContext);
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("does not show the removed biology mock card on today's home schedule", () => {
    const screen = render(<HomeScreen />);

    expect(screen.queryByText("Biology Practice Mock")).toBeNull();
    expect(screen.getByText("Сонгосон өдөр шалгалт байхгүй байна")).toBeTruthy();
    screen.unmount();
  });
});
