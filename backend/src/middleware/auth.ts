import { createMiddleware } from "hono/factory";
import { eq } from "drizzle-orm";
import { getDb, teachers, students } from "../db";
import type { AppEnv } from "../types";

const unauthorized = (message: string) => ({
  success: false as const,
  error: {
    code: "UNAUTHORIZED",
    message,
  },
});

const decodeHeaderValue = (value?: string) => {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const userId = c.req.header("x-user-id");
  const userRole = c.req.header("x-user-role") as "teacher" | "student" | undefined;
  const userName = decodeHeaderValue(
    c.req.header("x-user-name-encoded") ?? c.req.header("x-user-name") ?? undefined,
  );

  if (!userId || !userRole) {
    return c.json(unauthorized("Missing x-user-id or x-user-role header"), 401);
  }

  const db = getDb(c.env.educore);

  if (userRole === "teacher") {
    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, userId))
      .limit(1);

    if (!teacher) {
      const now = new Date().toISOString();
      await db.insert(teachers).values({
        id: userId,
        code: userId,
        fullName: userName ?? userId,
        createdAt: now,
        updatedAt: now,
      });
    }

    c.set("user", {
      id: teacher?.id ?? userId,
      role: "teacher",
      fullName: teacher?.fullName ?? userName ?? userId,
    });
    await next();
    return;
  }

  if (userRole === "student") {
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, userId))
      .limit(1);

    if (!student) {
      const now = new Date().toISOString();
      await db.insert(students).values({
        id: userId,
        code: userId,
        fullName: userName ?? userId,
        xp: 0,
        level: 1,
        createdAt: now,
        updatedAt: now,
      });
    }

    c.set("user", {
      id: student?.id ?? userId,
      role: "student",
      fullName: student?.fullName ?? userName ?? userId,
    });
    await next();
    return;
  }

  return c.json(unauthorized("Invalid x-user-role header"), 401);
});
