import { eq } from "drizzle-orm";
import { getDb, students, xpTransactions } from "../db";
import { newId } from "./id";
import { getLevel } from "./level-calc";

type DrizzleDb = ReturnType<typeof getDb>;

interface AwardXpParams {
  db: DrizzleDb;
  studentId: string;
  sessionId: string;
  score: number;
  passScore: number;
  totalPoints: number;
  earnedPoints: number;
}

export async function awardXpForGrading(params: AwardXpParams) {
  const { db, studentId, sessionId, score, passScore, totalPoints, earnedPoints } = params;

  const xpEntries: { amount: number; reason: string }[] = [];

  // Always award XP for completing an exam
  xpEntries.push({ amount: 10, reason: "exam_completed" });

  // Bonus for passing
  if (score >= passScore) {
    xpEntries.push({ amount: 20, reason: "exam_passed" });
  }

  // Bonus for perfect score
  if (earnedPoints === totalPoints && totalPoints > 0) {
    xpEntries.push({ amount: 50, reason: "perfect_score" });
  }

  const totalXpAwarded = xpEntries.reduce((sum, e) => sum + e.amount, 0);

  // Insert transactions
  for (const entry of xpEntries) {
    await db.insert(xpTransactions).values({
      id: newId(),
      studentId,
      amount: entry.amount,
      reason: entry.reason,
      referenceId: sessionId,
    });
  }

  // Update student XP and level
  const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
  if (student) {
    const newXp = student.xp + totalXpAwarded;
    const newLevel = getLevel(newXp);
    await db.update(students)
      .set({ xp: newXp, level: newLevel, updatedAt: new Date().toISOString() })
      .where(eq(students.id, studentId));
  }

  return totalXpAwarded;
}
