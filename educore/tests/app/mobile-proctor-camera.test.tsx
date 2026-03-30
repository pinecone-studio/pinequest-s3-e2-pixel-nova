import React from 'react';
import { act, render, waitFor } from '@testing-library/react-native';

import MobileProctorCamera from '@/components/student-app/MobileProctorCamera';
import { CAMERA_SNAPSHOT_INTERVAL_MS } from '@/lib/student-app/proctoring';
import { analyzeCheatSnapshot } from '@/lib/student-app/services/api';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    appOwnership: 'expo',
    expoVersion: '54.0.0',
  },
}));

jest.mock('@/lib/student-app/services/api', () => ({
  analyzeCheatSnapshot: jest.fn(),
}));

const expoCameraMock = require('expo-camera') as {
  __resetMockCamera: () => void;
  __setMockCameraMode: (
    mode: 'ready' | 'error' | 'idle',
    message?: string,
  ) => void;
};

const mockAnalyzeCheatSnapshot = analyzeCheatSnapshot as jest.MockedFunction<
  typeof analyzeCheatSnapshot
>;

const baseProps = {
  isEnabled: true,
  permissionGranted: true,
  sessionId: 'session-1',
  student: {
    id: 'student-1',
    fullName: 'Test Student',
    role: 'student' as const,
  },
  onViolation: jest.fn(),
};

describe('MobileProctorCamera', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockAnalyzeCheatSnapshot.mockResolvedValue({
      source: 'mobile_camera_ai',
      summary: 'One face is visible and the student looks forward.',
      faceCount: 1,
      lookingDirection: 'forward',
      confidence: 0.94,
      suspiciousEvents: [],
    });
  });

  afterEach(() => {
    expoCameraMock.__resetMockCamera();
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('renders a permission warning when camera access is missing', () => {
    const screen = render(
      <MobileProctorCamera
        {...baseProps}
        permissionGranted={false}
      />,
    );

    expect(screen.getByText('Шалгалтын камер')).toBeTruthy();
    expect(
      screen.getByText(/Камерын зөвшөөрөлгүй тул шалгалтыг энэ build дээр эхлүүлэх боломжгүй/),
    ).toBeTruthy();
  });

  it('captures and analyzes a snapshot immediately and then every 15 seconds', async () => {
    expoCameraMock.__setMockCameraMode('ready');

    const screen = render(<MobileProctorCamera {...baseProps} />);

    await waitFor(() => {
      expect(mockAnalyzeCheatSnapshot).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Camera preview бэлэн. 15 сек тутам snapshot шинжилж байна/),
      ).toBeTruthy();
    });

    act(() => {
      jest.advanceTimersByTime(CAMERA_SNAPSHOT_INTERVAL_MS);
    });

    await waitFor(() => {
      expect(mockAnalyzeCheatSnapshot).toHaveBeenCalledTimes(2);
    });
    expect(
      screen.getByText(/Сүүлийн AI тэмдэглэл: One face is visible/),
    ).toBeTruthy();
  });

  it('logs suspicious events with cooldown protection', async () => {
    const onViolation = jest.fn();

    mockAnalyzeCheatSnapshot.mockResolvedValue({
      source: 'mobile_camera_ai',
      summary: 'The student is looking to the right.',
      faceCount: 1,
      lookingDirection: 'right',
      confidence: 0.89,
      suspiciousEvents: [
        {
          eventType: 'looking_away',
          confidence: 0.89,
          reason: 'The student is clearly looking to the right.',
        },
      ],
    });

    render(
      <MobileProctorCamera
        {...baseProps}
        onViolation={onViolation}
      />,
    );

    await waitFor(() => {
      expect(onViolation).toHaveBeenCalledTimes(1);
    });
    expect(onViolation).toHaveBeenCalledWith(
      'looking_away',
      expect.stringContaining('"source":"mobile_camera_ai"'),
    );

    act(() => {
      jest.advanceTimersByTime(CAMERA_SNAPSHOT_INTERVAL_MS);
    });

    await waitFor(() => {
      expect(mockAnalyzeCheatSnapshot).toHaveBeenCalledTimes(2);
    });
    expect(onViolation).toHaveBeenCalledTimes(1);
  });

  it('shows a recovery message when the preview fails to mount', async () => {
    expoCameraMock.__setMockCameraMode('error', 'camera failed');

    const screen = render(<MobileProctorCamera {...baseProps} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Camera preview ачаалахад алдаа гарлаа/),
      ).toBeTruthy();
    });
    expect(screen.getByText(/reason: camera failed/)).toBeTruthy();
  });
});
