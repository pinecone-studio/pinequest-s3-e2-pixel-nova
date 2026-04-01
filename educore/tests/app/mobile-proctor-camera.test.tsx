import React from 'react';
import { render } from '@testing-library/react-native';

import MobileProctorCamera from '@/components/student-app/MobileProctorCamera';

const baseProps = {
  captureEnabled: false,
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

  it('shows camera preflight details when capture is idle', () => {
    const screen = render(<MobileProctorCamera {...baseProps} />);

    expect(screen.getByText(/Camera preflight is active/)).toBeTruthy();
    expect(screen.getByText(/The mobile client keeps the front camera ready/)).toBeTruthy();
    expect(screen.getByText(/Ready|Starting/)).toBeTruthy();
  });
});
