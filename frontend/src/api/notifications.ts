import { apiRequest } from "./client";
import type { NotificationItem } from "@/lib/notifications";

type NotificationsPayload = {
  items: NotificationItem[];
  unreadCount: number;
};

export const fetchNotifications = async (
  role: "teacher" | "student",
  userId?: string | null,
): Promise<NotificationsPayload> => {
  return apiRequest<NotificationsPayload>("/api/notifications", {
    roleOverride: role,
    userIdOverride: userId ?? undefined,
  });
};

export const markNotificationRead = async (
  notificationId: string,
  role: "teacher" | "student",
  userId?: string | null,
) => {
  return apiRequest<{ id: string; unreadCount: number }>(
    `/api/notifications/${notificationId}/read`,
    {
      method: "POST",
      body: JSON.stringify({}),
      roleOverride: role,
      userIdOverride: userId ?? undefined,
    },
  );
};

export const markAllNotificationsRead = async (
  role: "teacher" | "student",
  userId?: string | null,
) => {
  return apiRequest<{ unreadCount: number }>(
    "/api/notifications/read-all",
    {
      method: "POST",
      body: JSON.stringify({}),
      roleOverride: role,
      userIdOverride: userId ?? undefined,
    },
  );
};
