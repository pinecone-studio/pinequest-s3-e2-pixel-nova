import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, notifications } from "../db";
import { authMiddleware } from "../middleware/auth";
import type { AppEnv } from "../types";
import { notFound, success } from "../utils/response";
import {
  getUnreadCount,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  syncNotificationsForUser,
} from "../services/notifications";

const notificationsRoutes = new Hono<AppEnv>();

notificationsRoutes.use("*", authMiddleware);

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const STREAM_POLL_MS = 3000;

const mapNotification = (item: {
  id: string;
  userId: string;
  role: string;
  type: string;
  severity: string;
  status: string;
  title: string;
  message: string;
  examId: string | null;
  sessionId: string | null;
  studentId: string | null;
  metadata: string | null;
  createdAt: string;
  readAt: string | null;
}) => ({
  id: item.id,
  userId: item.userId,
  role: item.role,
  type: item.type,
  severity: item.severity,
  status: item.status,
  title: item.title,
  message: item.message,
  examId: item.examId,
  sessionId: item.sessionId,
  studentId: item.studentId,
  metadata: item.metadata ? JSON.parse(item.metadata) : {},
  createdAt: item.createdAt,
  readAt: item.readAt,
});

notificationsRoutes.get(
  "/",
  zValidator("query", listQuerySchema),
  async (c) => {
    const user = c.get("user");
    const { limit = 40 } = c.req.valid("query");
    const db = getDb(c.env.educore);

    await syncNotificationsForUser(db, user.id, user.role);
    const items = await listNotificationsForUser(db, user.id, limit);
    const unreadCount = await getUnreadCount(db, user.id);

    return success(c, {
      items: items.map(mapNotification),
      unreadCount,
    });
  },
);

notificationsRoutes.get("/live", async (c) => {
  const user = c.get("user");
  const db = getDb(c.env.educore);

  await syncNotificationsForUser(db, user.id, user.role);
  const initialItems = await listNotificationsForUser(db, user.id, 100);
  const seenIds = new Set(initialItems.map((item) => item.id));
  const encoder = new TextEncoder();
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start: (controller) => {
      const closeStream = () => {
        if (closed) return;
        closed = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        controller.close();
      };

      const sendEvent = (event: string, payload: unknown) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`),
        );
      };

      const tick = async () => {
        if (closed) return;

        try {
          await syncNotificationsForUser(db, user.id, user.role);
          const items = await listNotificationsForUser(db, user.id, 100);
          const newItems = items.filter((item) => !seenIds.has(item.id)).reverse();

          for (const item of newItems) {
            seenIds.add(item.id);
            sendEvent("notification", mapNotification(item));
          }

          if (closed) return;
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
          timeoutId = setTimeout(() => {
            void tick();
          }, STREAM_POLL_MS);
        } catch {
          if (closed) return;
          sendEvent("error", { message: "Failed to stream notifications." });
          closeStream();
        }
      };

      c.req.raw.signal.addEventListener("abort", closeStream);
      controller.enqueue(encoder.encode(": connected\n\n"));
      void tick();
    },
    cancel: () => {
      closed = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
});

notificationsRoutes.post("/:id/read", async (c) => {
  const user = c.get("user");
  const notificationId = c.req.param("id");
  const db = getDb(c.env.educore);

  const [existing] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(eq(notifications.id, notificationId))
    .limit(1);

  if (!existing) return notFound(c, "Notification");

  await markNotificationRead(db, user.id, notificationId);
  const unreadCount = await getUnreadCount(db, user.id);
  return success(c, { id: notificationId, unreadCount });
});

notificationsRoutes.post("/read-all", async (c) => {
  const user = c.get("user");
  const db = getDb(c.env.educore);
  await markAllNotificationsRead(db, user.id);
  return success(c, { unreadCount: 0 });
});

export default notificationsRoutes;
