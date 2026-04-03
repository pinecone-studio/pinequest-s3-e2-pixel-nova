import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import type { AuthUser, StudentUpcomingExam } from '@/types/student-app';

const EXAM_NOTIFICATION_CHANNEL_ID = 'exam-reminders';
const EXAM_NOTIFICATION_SOURCE = 'exam-reminder';
const REMINDER_LEAD_MINUTES = [30, 5, 0] as const;

type ExamNotificationData = {
  source: typeof EXAM_NOTIFICATION_SOURCE;
  userId: string;
  examId: string;
  kind: 'starting-soon' | 'starting-now';
};

const parseScheduledDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildNotificationIdPrefix = (userId: string, examId: string) =>
  `${EXAM_NOTIFICATION_SOURCE}:${userId}:${examId}:`;

const isExamNotification = (
  request: Notifications.NotificationRequest,
): request is Notifications.NotificationRequest & {
  content: Notifications.NotificationContent & { data: ExamNotificationData };
} => {
  const data = request.content.data as Partial<ExamNotificationData> | undefined;
  return data?.source === EXAM_NOTIFICATION_SOURCE;
};

const buildReminderContent = (
  exam: StudentUpcomingExam,
  leadMinutes: number,
): Notifications.NotificationContentInput => ({
  title: leadMinutes > 0 ? 'Шалгалт эхлэх дөхлөө' : 'Шалгалт эхэллээ',
  body:
    leadMinutes > 0
      ? `${exam.title} ${leadMinutes} минутын дараа эхэлнэ.`
      : `${exam.title} одоо эхэлж байна.`,
  sound: 'default',
});

export const initializeExamNotifications = async () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(
      EXAM_NOTIFICATION_CHANNEL_ID,
      {
        name: 'Шалгалтын сануулга',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 150, 250],
        lightColor: '#2563EB',
      },
    );
  }
};

export const requestNotificationPermissions = async () => {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
};

export const clearExamNotificationsForUser = async (userId?: string | null) => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const matchingIds = scheduled
    .filter(
      (request) =>
        isExamNotification(request) &&
        (!userId || request.content.data.userId === userId),
    )
    .map((request) => request.identifier);

  await Promise.all(
    matchingIds.map((identifier) =>
      Notifications.cancelScheduledNotificationAsync(identifier),
    ),
  );
};

export const syncExamNotifications = async (
  student: AuthUser | null,
  upcomingExams: StudentUpcomingExam[],
) => {
  if (!student) {
    await clearExamNotificationsForUser();
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await clearExamNotificationsForUser(student.id);

  const now = Date.now();
  const notifications = upcomingExams.flatMap((exam) => {
    const scheduledAt = parseScheduledDate(exam.scheduledAt ?? exam.startedAt);
    if (!scheduledAt || scheduledAt.getTime() <= now) return [];
    if (exam.status && !['scheduled', 'active'].includes(exam.status)) return [];

    const prefix = buildNotificationIdPrefix(student.id, exam.examId);
    const reminderRequests = REMINDER_LEAD_MINUTES.flatMap((leadMinutes) => {
      const triggerDate = new Date(
        scheduledAt.getTime() - leadMinutes * 60 * 1000,
      );
      if (triggerDate.getTime() <= now) return [];

      const kind = leadMinutes > 0 ? 'starting-soon' : 'starting-now';

      return [
        {
          identifier: `${prefix}${kind}:${triggerDate.toISOString()}`,
          content: {
            ...buildReminderContent(exam, leadMinutes),
            data: {
              source: EXAM_NOTIFICATION_SOURCE,
              userId: student.id,
              examId: exam.examId,
              kind,
            } satisfies ExamNotificationData,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
            channelId:
              Platform.OS === 'android'
                ? EXAM_NOTIFICATION_CHANNEL_ID
                : undefined,
          } satisfies Notifications.DateTriggerInput,
        },
      ];
    });

    return reminderRequests;
  });

  await Promise.all(
    notifications.map((request) =>
      Notifications.scheduleNotificationAsync(request),
    ),
  );
};
