import React from 'react';
import { render } from '@testing-library/react-native';

import ExamScreen from '@/app/(tabs)/exam';
import { useStudentApp } from '@/lib/student-app/context';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) =>
    require('react').createElement('Text', null, `redirect:${href}`),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('@/lib/student-app/context', () => ({
  useStudentApp: jest.fn(),
}));

const mockUseStudentApp = useStudentApp as jest.MockedFunction<
  typeof useStudentApp
>;

const baseContext = {
  authMode: 'dev_switcher' as const,
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
  student: { id: 's1', fullName: 'Student', role: 'student' as const },
  submittedResult: null,
  submitCurrentExam: jest.fn(),
  switchUser: jest.fn(),
};

describe('ExamScreen', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('keeps the tab mounted while session state hydrates', () => {
    mockUseStudentApp.mockReturnValue({
      ...baseContext,
      hydrated: false,
    });

    const screen = render(<ExamScreen />);

    expect(screen.getByText('Loading active exam')).toBeTruthy();
  });

  it('shows an empty state when there is no active exam', () => {
    mockUseStudentApp.mockReturnValue(baseContext);

    const screen = render(<ExamScreen />);

    expect(screen.getByText('No active exam')).toBeTruthy();
    expect(screen.getByText('Join exam')).toBeTruthy();
  });
});
