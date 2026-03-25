import { createMiddleware } from "hono/factory";
import { eq } from "drizzle-orm";
import { getDb, teachers, students } from "../db";
import type { AppEnv } from "../types";
import { getClerkUserId } from "../utils/clerk";

// Auth middleware — reads x-user-id and x-user-role headers, validates against DB
export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const userId = await getClerkUserId(c);
  if (!userId) {
    return c.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid Clerk session token",
        },
      },
      401,
    );
  }

  const db = getDb(c.env.educore);

  const [teacher] = await db
    .select()
    .from(teachers)
    .where(eq(teachers.id, userId))
    .limit(1);
  if (teacher) {
    c.set("user", {
      id: teacher.id,
      role: "teacher",
      fullName: teacher.fullName,
    });
    await next();
    return;
  }

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, userId))
    .limit(1);
  if (student) {
    c.set("user", {
      id: student.id,
      role: "student",
      fullName: student.fullName,
    });
    await next();
    return;
  }

  return c.json(
    {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "User not registered. Call /api/auth/sync first.",
      },
    },
    401,
  );
});
