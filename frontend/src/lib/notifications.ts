export type NotificationSeverity = "critical" | "warning" | "info" | "success";

export type NotificationStatus = "unread" | "read" | "archived";

export type NotificationType =
  | "student_joined"
  | "student_submitted"
  | "student_flagged"
  | "exam_ending_soon"
  | "exam_finished"
  | "exam_unlocked"
  | "late_entry_notice"
  | "submission_saved"
  | "time_remaining_warning"
  | "result_published";

export type NotificationItem = {
  id: string;
  userId: string;
  role: "teacher" | "student";
  type: NotificationType;
  severity: NotificationSeverity;
  status: NotificationStatus;
  title: string;
  message: string;
  examId?: string | null;
  sessionId?: string | null;
  studentId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  readAt?: string | null;
};

export const isUnreadNotification = (notification: NotificationItem) =>
  notification.status === "unread";
