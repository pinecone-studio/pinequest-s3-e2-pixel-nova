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

    expect(screen.getByText('Шалгалтын камер')).toBeTruthy();
    expect(
      screen.getByText(/Шалгалт эхлэхээс өмнө камерын зөвшөөрөл шаардлагатай/),
    ).toBeTruthy();
  });

  it('shows camera preflight details when capture is idle', () => {
    const screen = render(<MobileProctorCamera {...baseProps} />);

    expect(screen.getByText(/Камерын урьдчилсан шалгалт идэвхтэй байна/)).toBeTruthy();
    expect(screen.getByText(/Мобайл апп урд камерыг бэлэн байлгаж/)).toBeTruthy();
    expect(screen.getByText(/Бэлэн|Асаж байна/)).toBeTruthy();
  });
});
