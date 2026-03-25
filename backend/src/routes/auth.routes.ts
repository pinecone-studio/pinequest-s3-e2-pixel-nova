import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, teachers, students } from "../db";
import type { AppEnv } from "../types";
import { success, error, notFound } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { getClerkClient, getClerkUserId } from "../utils/clerk";
import { createStudentCode, createTeacherCode } from "../utils/user-code";

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

// POST /sync — Create/update Clerk user in DB
const syncSchema = z.object({
  role: z.enum(["teacher", "student"]),
});

auth.post("/sync", zValidator("json", syncSchema), async (c) => {
  const userId = await getClerkUserId(c);
  if (!userId) {
    return error(c, "UNAUTHORIZED", "Missing or invalid Clerk token", 401);
  }

  const { role } = c.req.valid("json");
  const db = getDb(c.env.educore);
  const clerk = getClerkClient(c);
  const clerkUser = await clerk.users.getUser(userId);

  const fullName =
    clerkUser.fullName ||
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    clerkUser.primaryEmailAddress?.emailAddress ||
    "Хэрэглэгч";

  const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
  const avatarUrl = clerkUser.imageUrl ?? null;

  if (role === "teacher") {
    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, userId))
      .limit(1);

    if (!teacher) {
      await db.insert(teachers).values({
        id: userId,
        code: createTeacherCode(),
        fullName,
        email,
        avatarUrl,
      });
    } else {
      await db
        .update(teachers)
        .set({
          fullName,
          email,
          avatarUrl,
        })
        .where(eq(teachers.id, userId));
    }

    return success(c, {
      id: userId,
      role: "teacher" as const,
      fullName,
      email,
      avatarUrl,
    });
  }

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, userId))
    .limit(1);

  if (!student) {
    await db.insert(students).values({
      id: userId,
      code: createStudentCode(),
      fullName,
      email,
      avatarUrl,
    });
  } else {
    await db
      .update(students)
      .set({
        fullName,
        email,
        avatarUrl,
      })
      .where(eq(students.id, userId));
  }

  return success(c, {
    id: userId,
    role: "student" as const,
    fullName,
    email,
    avatarUrl,
  });
});

// GET /me — Get current user profile
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
