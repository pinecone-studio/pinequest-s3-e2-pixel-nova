import { apiFetch, unwrapApi } from "@/lib/api-client";
import type { NotificationItem } from "@/lib/notifications";

type NotificationsPayload = {
  items: NotificationItem[];
  unreadCount: number;
};

export const fetchNotifications = async (
  role: "teacher" | "student",
  userId?: string | null,
): Promise<NotificationsPayload> => {
  const data = await apiFetch<
    { data?: NotificationsPayload } | NotificationsPayload
  >("/api/notifications", {}, role, userId ?? undefined);

  return unwrapApi(data);
};

export const markNotificationRead = async (
  notificationId: string,
  role: "teacher" | "student",
  userId?: string | null,
) => {
  const data = await apiFetch<
    { data?: { id: string; unreadCount: number } } | { id: string; unreadCount: number }
  >(
    `/api/notifications/${notificationId}/read`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
    role,
    userId ?? undefined,
  );

  return unwrapApi(data);
};

export const markAllNotificationsRead = async (
  role: "teacher" | "student",
  userId?: string | null,
) => {
  const data = await apiFetch<
    { data?: { unreadCount: number } } | { unreadCount: number }
  >(
    "/api/notifications/read-all",
    {
      method: "POST",
      body: JSON.stringify({}),
    },
    role,
    userId ?? undefined,
  );

  return unwrapApi(data);
};
