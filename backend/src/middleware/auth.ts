import { createMiddleware } from "hono/factory";
import { eq } from "drizzle-orm";
import { getDb, teachers, students } from "../db";
import type { AppEnv } from "../types";

// Auth middleware — reads x-user-id and x-user-role headers, validates against DB
export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const userId = c.req.header("x-user-id");
  const userRole = c.req.header("x-user-role") as
    | "teacher"
    | "student"
    | undefined;

  if (!userId || !userRole) {
    return c.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Missing x-user-id or x-user-role header",
        },
      },
      401,
    );
  }

  const db = getDb(c.env.educore);

  if (userRole === "teacher") {
    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, userId))
      .limit(1);
    if (!teacher) {
      return c.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Teacher not found" },
        },
        401,
      );
    }
    c.set("user", {
      id: teacher.id,
      role: "teacher",
      fullName: teacher.fullName,
    });
  } else if (userRole === "student") {
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, userId))
      .limit(1);
    if (!student) {
      return c.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Student not found" },
        },
        401,
      );
    }
    c.set("user", {
      id: student.id,
      role: "student",
      fullName: student.fullName,
    });
  } else {
    return c.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid role. Must be 'teacher' or 'student'",
        },
      },
      401,
    );
  }

  await next();
});
