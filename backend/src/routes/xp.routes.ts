import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { getDb, students, xpTransactions } from "../db";
import type { AppEnv } from "../types";
import { success, notFound } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/role-guard";
import { getLevel, xpForNextLevel, xpProgress } from "../utils/level-calc";

const xpRoutes = new Hono<AppEnv>();

// Apply auth globally (both roles can access leaderboard)
xpRoutes.use("*", authMiddleware);

// GET /profile — Get XP profile (student only)
xpRoutes.get("/profile", requireRole("student"), async (c) => {
  const user = c.get("user");
  const db = getDb(c.env.educore);

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, user.id))
    .limit(1);

  if (!student) {
    return notFound(c, "Student");
  }

  const level = getLevel(student.xp);
  const nextLevelXp = xpForNextLevel(student.xp);
  const progress = xpProgress(student.xp);

  return success(c, {
    id: student.id,
    fullName: student.fullName,
    xp: student.xp,
    level,
    xpForNextLevel: nextLevelXp,
    xpProgress: progress,
  });
});

// GET /history — XP transaction history (student only)
xpRoutes.get("/history", requireRole("student"), async (c) => {
  const user = c.get("user");
  const db = getDb(c.env.educore);

  const transactions = await db
    .select()
    .from(xpTransactions)
    .where(eq(xpTransactions.studentId, user.id))
    .orderBy(desc(xpTransactions.createdAt));

  return success(c, transactions);
});

// GET /leaderboard — Top students by XP (any authenticated user)
xpRoutes.get("/leaderboard", async (c) => {
  const db = getDb(c.env.educore);

  const topStudents = await db
    .select({
      id: students.id,
      fullName: students.fullName,
      avatarUrl: students.avatarUrl,
      xp: students.xp,
    })
    .from(students)
    .orderBy(desc(students.xp))
    .limit(10);

  const leaderboard = topStudents.map((student, index) => ({
    rank: index + 1,
    id: student.id,
    fullName: student.fullName,
    avatarUrl: student.avatarUrl,
    xp: student.xp,
    level: getLevel(student.xp),
  }));

  return success(c, leaderboard);
});

export default xpRoutes;
