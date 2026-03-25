import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, teachers, students } from "../db";
import type { AppEnv } from "../types";
import { success, error, notFound } from "../utils/response";
import { authMiddleware } from "../middleware/auth";

const auth = new Hono<AppEnv>();

// POST /login — Login with code
const loginSchema = z.object({
  code: z.string().min(1),
});

auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const { code } = c.req.valid("json");
  const db = getDb(c.env.educore);

  // Check teachers table first
  const [teacher] = await db
    .select()
    .from(teachers)
    .where(eq(teachers.code, code))
    .limit(1);

  if (teacher) {
    return success(c, {
      id: teacher.id,
      fullName: teacher.fullName,
      email: teacher.email,
      avatarUrl: teacher.avatarUrl,
      role: "teacher" as const,
    });
  }

  // Check students table
  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.code, code))
    .limit(1);

  if (student) {
    return success(c, {
      id: student.id,
      fullName: student.fullName,
      email: student.email,
      avatarUrl: student.avatarUrl,
      role: "student" as const,
      xp: student.xp,
      level: student.level,
    });
  }

  return error(c, "UNAUTHORIZED", "Invalid code", 401);
});

// GET /me — Get current user profile
auth.get("/users", async (c) => {
  const db = getDb(c.env.educore);

  const teacherRows = await db.select().from(teachers);
  const studentRows = await db.select().from(students);

  const users = [
    ...teacherRows.map((teacher) => ({
      id: teacher.id,
      code: teacher.code,
      fullName: teacher.fullName,
      email: teacher.email,
      avatarUrl: teacher.avatarUrl,
      role: "teacher" as const,
    })),
    ...studentRows.map((student) => ({
      id: student.id,
      code: student.code,
      fullName: student.fullName,
      email: student.email,
      avatarUrl: student.avatarUrl,
      xp: student.xp,
      level: student.level,
      role: "student" as const,
    })),
  ].sort((left, right) => left.fullName.localeCompare(right.fullName));

  return success(c, users);
});

auth.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = getDb(c.env.educore);

  if (user.role === "teacher") {
    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, user.id))
      .limit(1);

    if (!teacher) {
      return notFound(c, "Teacher");
    }

    return success(c, {
      ...teacher,
      role: "teacher" as const,
    });
  }

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, user.id))
    .limit(1);

  if (!student) {
    return notFound(c, "Student");
  }

  return success(c, {
    ...student,
    role: "student" as const,
  });
});

export default auth;
