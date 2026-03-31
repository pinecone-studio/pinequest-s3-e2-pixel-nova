import React from 'react';
import { render } from '@testing-library/react-native';

import MobileProctorCamera from '@/components/student-app/MobileProctorCamera';

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
  it('renders a permission warning when camera access is missing', () => {
    const screen = render(
      <MobileProctorCamera {...baseProps} permissionGranted={false} />,
    );

    expect(screen.getByText('Exam camera')).toBeTruthy();
    expect(
      screen.getByText(/Camera permission is required before the exam can start/),
    ).toBeTruthy();
  });

  it('shows that snapshot capture is disabled in this build', () => {
    const screen = render(<MobileProctorCamera {...baseProps} />);

    expect(screen.getByText(/Snapshot capture is disabled in this build/)).toBeTruthy();
    expect(
      screen.getByText(/No snapshots are captured, stored, or uploaded here/),
    ).toBeTruthy();
    expect(screen.getByText(/Native build required/)).toBeTruthy();
  });
});
