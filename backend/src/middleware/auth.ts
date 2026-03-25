import { createMiddleware } from "hono/factory";
import { eq } from "drizzle-orm";
import { getDb, teachers, students } from "../db";
import type { AppEnv } from "../types";
import { getClerkUserId } from "../utils/clerk";

const unauthorized = (message: string) => ({
  success: false as const,
  error: {
    code: "UNAUTHORIZED",
    message,
  },
});

// Supports Clerk auth in real app usage and x-user-* headers in tests/local mocks.
export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const db = getDb(c.env.educore);
  const clerkUserId = await getClerkUserId(c);
  const headerUserId = c.req.header("x-user-id");
  const headerUserRole = c.req.header("x-user-role") as "teacher" | "student" | undefined;

  if (!clerkUserId && (!headerUserId || !headerUserRole)) {
    return c.json(unauthorized("Missing x-user-id or x-user-role header"), 401);
  }

  if (clerkUserId) {
    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, clerkUserId))
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
      .where(eq(students.id, clerkUserId))
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

    return c.json(unauthorized("User not registered. Call /api/auth/sync first."), 401);
  }

  if (headerUserRole === "teacher") {
    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, headerUserId!))
      .limit(1);

    if (!teacher) {
      return c.json(unauthorized("User not registered. Call /api/auth/sync first."), 401);
    }

    c.set("user", {
      id: teacher.id,
      role: "teacher",
      fullName: teacher.fullName,
    });
    await next();
    return;
  }

  if (headerUserRole === "student") {
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, headerUserId!))
      .limit(1);

    if (!student) {
      return c.json(unauthorized("User not registered. Call /api/auth/sync first."), 401);
    }

    c.set("user", {
      id: student.id,
      role: "student",
      fullName: student.fullName,
    });
    await next();
    return;
  }

  return c.json(unauthorized("Missing x-user-id or x-user-role header"), 401);
});
