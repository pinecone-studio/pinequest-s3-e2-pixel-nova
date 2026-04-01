import * as Notifications from 'expo-notifications';

import {
  clearExamNotificationsForUser,
  initializeExamNotifications,
  requestNotificationPermissions,
  syncExamNotifications,
} from '@/lib/student-app/services/notifications';
import type { AuthUser, StudentUpcomingExam } from '@/types/student-app';

const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;

const mockStudent: AuthUser = {
  id: 'student-1',
  fullName: 'Bat',
  role: 'student',
};

const mockExam = (
  overrides: Partial<StudentUpcomingExam> = {},
): StudentUpcomingExam => ({
  examId: 'exam-1',
  title: 'Алгебрын шалгалт',
  description: null,
  status: 'scheduled',
  className: '10A',
  groupName: 'A',
  scheduledAt: '2026-04-01T10:31:00.000Z',
  startedAt: null,
  finishedAt: null,
  durationMin: 60,
  roomCode: 'ROOM01',
  ...overrides,
});

describe('notification service', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-01T10:00:00.000Z'));
    jest.clearAllMocks();
    mockNotifications.getPermissionsAsync.mockResolvedValue({ granted: true } as never);
    mockNotifications.requestPermissionsAsync.mockResolvedValue({ granted: true } as never);
    mockNotifications.getAllScheduledNotificationsAsync.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes the default notification handler', async () => {
    await initializeExamNotifications();

    expect(mockNotifications.setNotificationHandler).toHaveBeenCalledTimes(1);
  });

  it('requests permissions when they are not already granted', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({ granted: false } as never);

    const granted = await requestNotificationPermissions();

    expect(granted).toBe(true);
    expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it('schedules reminder notifications for future exams', async () => {
    await syncExamNotifications(mockStudent, [mockExam()]);

    expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledTimes(3);
    const firstCall = mockNotifications.scheduleNotificationAsync.mock.calls[0][0];
    const secondCall = mockNotifications.scheduleNotificationAsync.mock.calls[1][0];
    const thirdCall = mockNotifications.scheduleNotificationAsync.mock.calls[2][0];

    expect(firstCall.content.title).toBe('Шалгалт эхлэх дөхлөө');
    expect(secondCall.content.title).toBe('Шалгалт эхлэх дөхлөө');
    expect(thirdCall.content.title).toBe('Шалгалт эхэллээ');
  });

  it('skips past exams and unsupported statuses', async () => {
    await syncExamNotifications(mockStudent, [
      mockExam({ scheduledAt: '2026-04-01T09:00:00.000Z' }),
      mockExam({ examId: 'exam-2', status: 'completed' }),
    ]);

    expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('clears existing reminder notifications for the current user before rescheduling', async () => {
    mockNotifications.getAllScheduledNotificationsAsync.mockResolvedValue([
      {
        identifier: 'notif-1',
        content: {
          data: {
            source: 'exam-reminder',
            userId: 'student-1',
            examId: 'exam-1',
            kind: 'starting-soon',
          },
        },
      },
      {
        identifier: 'notif-2',
        content: {
          data: {
            source: 'exam-reminder',
            userId: 'student-2',
            examId: 'exam-2',
            kind: 'starting-soon',
          },
        },
      },
    ] as never);

    await clearExamNotificationsForUser('student-1');

    expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      'notif-1',
    );
    expect(mockNotifications.cancelScheduledNotificationAsync).not.toHaveBeenCalledWith(
      'notif-2',
    );
  });
});
