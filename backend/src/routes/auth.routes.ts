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
  let teacher:
    | {
        id: string;
        fullName: string;
        email: string | null;
        avatarUrl: string | null;
      }
    | undefined;
  try {
    [teacher] = await db
      .select({
        id: teachers.id,
        fullName: teachers.fullName,
        email: teachers.email,
        avatarUrl: teachers.avatarUrl,
      })
      .from(teachers)
      .where(eq(teachers.code, code))
      .limit(1);
  } catch {
    const [fallbackTeacher] = await db
      .select({
        id: teachers.id,
        fullName: teachers.fullName,
      })
      .from(teachers)
      .where(eq(teachers.code, code))
      .limit(1);
    teacher = fallbackTeacher
      ? {
          ...fallbackTeacher,
          email: null,
          avatarUrl: null,
        }
      : undefined;
  }

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
  let student:
    | {
        id: string;
        fullName: string;
        email: string | null;
        avatarUrl: string | null;
        xp: number;
        level: number;
      }
    | undefined;
  try {
    [student] = await db
      .select({
        id: students.id,
        fullName: students.fullName,
        email: students.email,
        avatarUrl: students.avatarUrl,
        xp: students.xp,
        level: students.level,
      })
      .from(students)
      .where(eq(students.code, code))
      .limit(1);
  } catch {
    const [fallbackStudent] = await db
      .select({
        id: students.id,
        fullName: students.fullName,
        xp: students.xp,
        level: students.level,
      })
      .from(students)
      .where(eq(students.code, code))
      .limit(1);
    student = fallbackStudent
      ? {
          ...fallbackStudent,
          email: null,
          avatarUrl: null,
        }
      : undefined;
  }

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

  let teacherRows: Array<{
    id: string;
    code: string;
    fullName: string;
    email: string | null;
    avatarUrl: string | null;
  }> = [];
  try {
    teacherRows = await db
      .select({
        id: teachers.id,
        code: teachers.code,
        fullName: teachers.fullName,
        email: teachers.email,
        avatarUrl: teachers.avatarUrl,
      })
      .from(teachers);
  } catch {
    const fallbackRows = await db
      .select({
        id: teachers.id,
        code: teachers.code,
        fullName: teachers.fullName,
      })
      .from(teachers);
    teacherRows = fallbackRows.map((teacher) => ({
      ...teacher,
      email: null,
      avatarUrl: null,
    }));
  }

  let studentRows: Array<{
    id: string;
    code: string;
    fullName: string;
    email: string | null;
    avatarUrl: string | null;
    xp: number;
    level: number;
  }> = [];
  try {
    studentRows = await db
      .select({
        id: students.id,
        code: students.code,
        fullName: students.fullName,
        email: students.email,
        avatarUrl: students.avatarUrl,
        xp: students.xp,
        level: students.level,
      })
      .from(students);
  } catch {
    const fallbackRows = await db
      .select({
        id: students.id,
        code: students.code,
        fullName: students.fullName,
        xp: students.xp,
        level: students.level,
      })
      .from(students);
    studentRows = fallbackRows.map((student) => ({
      ...student,
      email: null,
      avatarUrl: null,
    }));
  }

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
    let teacher:
      | {
          id: string;
          code: string;
          fullName: string;
          email: string | null;
          avatarUrl: string | null;
        }
      | undefined;
    try {
      [teacher] = await db
        .select({
          id: teachers.id,
          code: teachers.code,
          fullName: teachers.fullName,
          email: teachers.email,
          avatarUrl: teachers.avatarUrl,
        })
        .from(teachers)
        .where(eq(teachers.id, user.id))
        .limit(1);
    } catch {
      const [fallbackTeacher] = await db
        .select({
          id: teachers.id,
          code: teachers.code,
          fullName: teachers.fullName,
        })
        .from(teachers)
        .where(eq(teachers.id, user.id))
        .limit(1);
      teacher = fallbackTeacher
        ? {
            ...fallbackTeacher,
            email: null,
            avatarUrl: null,
          }
        : undefined;
    }

    if (!teacher) {
      return notFound(c, "Teacher");
    }

    return success(c, {
      ...teacher,
      role: "teacher" as const,
    });
  }

  let student:
    | {
        id: string;
        code: string;
        fullName: string;
        email: string | null;
        avatarUrl: string | null;
        xp: number;
        level: number;
      }
    | undefined;
  try {
    [student] = await db
      .select({
        id: students.id,
        code: students.code,
        fullName: students.fullName,
        email: students.email,
        avatarUrl: students.avatarUrl,
        xp: students.xp,
        level: students.level,
      })
      .from(students)
      .where(eq(students.id, user.id))
      .limit(1);
  } catch {
    const [fallbackStudent] = await db
      .select({
        id: students.id,
        code: students.code,
        fullName: students.fullName,
        xp: students.xp,
        level: students.level,
      })
      .from(students)
      .where(eq(students.id, user.id))
      .limit(1);
    student = fallbackStudent
      ? {
          ...fallbackStudent,
          email: null,
          avatarUrl: null,
        }
      : undefined;
  }

  if (!student) {
    return notFound(c, "Student");
  }

  return success(c, {
    ...student,
    role: "student" as const,
  });
});

export default auth;
