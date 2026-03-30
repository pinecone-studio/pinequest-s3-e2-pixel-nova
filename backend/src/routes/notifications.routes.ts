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
      items: items.map((item) => ({
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
      })),
      unreadCount,
    });
  },
);

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
