import { eq } from "drizzle-orm";
import { getDb, students, xpTransactions } from "../db";
import { newId } from "./id";
import { buildBucketXpUpdate, resolveXpBucket } from "./xp-buckets";

type DrizzleDb = ReturnType<typeof getDb>;

interface AwardXpParams {
  db: DrizzleDb;
  studentId: string;
  sessionId: string;
  examType?: string | null;
  score: number;
  passScore: number;
  totalPoints: number;
  earnedPoints: number;
}

interface ApplyXpEntriesParams {
  db: DrizzleDb;
  studentId: string;
  sessionId: string;
  examType?: string | null;
  entries: { amount: number; reason: string }[];
}

export async function applyXpEntries(params: ApplyXpEntriesParams) {
  const { db, studentId, sessionId, examType, entries } = params;
  const totalXpAwarded = entries.reduce((sum, entry) => sum + entry.amount, 0);

  for (const entry of entries) {
    await db.insert(xpTransactions).values({
      id: newId(),
      studentId,
      amount: entry.amount,
      reason: entry.reason,
      referenceId: sessionId,
    });
  }

  const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
  if (student) {
    const xpBucket = resolveXpBucket(examType);
    const nextState = buildBucketXpUpdate(student, xpBucket, totalXpAwarded);
    await db.update(students)
      .set({
        ...nextState,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(students.id, studentId));
  }

  return totalXpAwarded;
}

export async function awardXpForGrading(params: AwardXpParams) {
  const {
    db,
    studentId,
    sessionId,
    examType,
    score,
    passScore,
    totalPoints,
    earnedPoints,
  } = params;

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

  return applyXpEntries({
    db,
    studentId,
    sessionId,
    examType,
    entries: xpEntries,
  });
}
