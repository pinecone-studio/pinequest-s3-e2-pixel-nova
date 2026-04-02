import { API_BASE_URL, apiRequest, getApiUserContext } from "./client";
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

const parseSseEvent = (rawChunk: string) => {
  const normalized = rawChunk.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  let event = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  }

  return {
    event,
    data: dataLines.join("\n"),
  };
};

const readStreamError = async (response: Response) => {
  try {
    const payload = (await response.json()) as
      | { error?: { message?: string }; message?: string }
      | undefined;
    return payload?.error?.message || payload?.message || `Request failed: ${response.status}`;
  } catch {
    const text = await response.text();
    return text || `Request failed: ${response.status}`;
  }
};

export const openNotificationsLiveStream = (
  role: "teacher" | "student",
  handlers: {
    onMessage: (payload: NotificationItem) => void;
    onError?: (error: Error) => void;
  },
  userId?: string | null,
) => {
  const controller = new AbortController();
  const { userId: sessionUserId, userRole, userName } = getApiUserContext(role);
  const headers = new Headers();
  headers.set("Accept", "text/event-stream");
  headers.set("x-user-id", userId ?? sessionUserId);
  headers.set("x-user-role", userRole);
  headers.set("x-user-name-encoded", encodeURIComponent(userName));

  void (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/live`, {
        headers,
        signal: controller.signal,
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await readStreamError(response));
      }

      if (!response.body) {
        throw new Error("Notifications live stream body was empty.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!controller.signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

        let boundaryIndex = buffer.indexOf("\n\n");
        while (boundaryIndex !== -1) {
          const rawEvent = buffer.slice(0, boundaryIndex);
          buffer = buffer.slice(boundaryIndex + 2);

          if (rawEvent.trim()) {
            const parsed = parseSseEvent(rawEvent);
            if (parsed.event === "notification" && parsed.data) {
              handlers.onMessage(JSON.parse(parsed.data) as NotificationItem);
            } else if (parsed.event === "error" && parsed.data) {
              const payload = JSON.parse(parsed.data) as { message?: string };
              throw new Error(payload.message || "Notifications live stream failed.");
            }
          }

          boundaryIndex = buffer.indexOf("\n\n");
        }
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      handlers.onError?.(
        error instanceof Error
          ? error
          : new Error("Notifications live stream failed."),
      );
    }
  })();

  return () => controller.abort();
};
