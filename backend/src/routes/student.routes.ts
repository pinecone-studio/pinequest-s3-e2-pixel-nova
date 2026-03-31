import { Hono } from "hono";
import { eq, and, asc, or } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import {
  getDb,
  examSessions,
  exams,
  studentAnswers,
  questions,
  options,
  students,
} from "../db";
import type { AppEnv } from "../types";
import { success, notFound } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/role-guard";
import { getLevel } from "../utils/level-calc";
import { getBucketXp } from "../utils/xp-buckets";

const studentRoutes = new Hono<AppEnv>();

type XpBucket = "progress" | "term";

type RankedBucketStudent = {
  studentId: string;
  fullName: string;
  avatarUrl: string | null;
  xp: number;
  level: number;
};

type ProgressSessionTimelineRow = {
  studentId: string;
  fullName: string;
  status: string;
  score: number | null;
  submittedAt: string | null;
  startedAt: string | null;
  createdAt: string;
};

type ImprovementLeaderboardEntry = {
  studentId: string;
  fullName: string;
  xp: number;
  level: number;
  examCount: number;
  improvementCount: number;
  missedCount: number;
};

const IMPROVEMENT_PERFECT_REPEAT_XP = 10;
const IMPROVEMENT_MISSED_EXAM_PENALTY = 10;
const MISSED_PROGRESS_STATUSES = new Set([
  "joined",
  "late",
  "in_progress",
  "disqualified",
]);

const buildRankedStudentsByBucket = async (
  db: ReturnType<typeof getDb>,
  bucket: XpBucket,
) => {
  const bucketStudents = await db
    .select({
      studentId: students.id,
      fullName: students.fullName,
      avatarUrl: students.avatarUrl,
      termXp: students.termXp,
      progressXp: students.progressXp,
    })
    .from(students);

  return bucketStudents
    .map((student): RankedBucketStudent => {
      const xp = getBucketXp(student, bucket);
      return {
        studentId: student.studentId,
        fullName: student.fullName,
        avatarUrl: student.avatarUrl ?? null,
        xp,
        level: getLevel(xp),
      };
    })
    .filter((student) => student.xp > 0)
    .sort((left, right) => {
      if (right.xp !== left.xp) {
        return right.xp - left.xp;
      }
      return left.studentId.localeCompare(right.studentId);
    });
};

const countStudentExamsByType = async (
  db: ReturnType<typeof getDb>,
  studentId: string,
  examType: XpBucket,
) => {
  const gradedSessions = await db
    .select({
      sessionId: examSessions.id,
    })
    .from(examSessions)
    .innerJoin(exams, eq(examSessions.examId, exams.id))
    .where(
      and(
        eq(examSessions.studentId, studentId),
        eq(examSessions.status, "graded"),
        eq(exams.examType, examType),
      ),
    );

  return gradedSessions.length;
};

const buildImprovementLeaderboard = async (db: ReturnType<typeof getDb>) => {
  const progressSessions = await db
    .select({
      studentId: examSessions.studentId,
      fullName: students.fullName,
      status: examSessions.status,
      score: examSessions.score,
      submittedAt: examSessions.submittedAt,
      startedAt: examSessions.startedAt,
      createdAt: examSessions.createdAt,
    })
    .from(examSessions)
    .innerJoin(exams, eq(examSessions.examId, exams.id))
    .innerJoin(students, eq(examSessions.studentId, students.id))
    .where(eq(exams.examType, "progress"));

  const timelineByStudent = new Map<string, ProgressSessionTimelineRow[]>();

  for (const session of progressSessions) {
    const bucket = timelineByStudent.get(session.studentId) ?? [];
    bucket.push(session);
    timelineByStudent.set(session.studentId, bucket);
  }

  return [...timelineByStudent.entries()]
    .map(([studentId, timeline]): ImprovementLeaderboardEntry => {
      const orderedTimeline = [...timeline].sort((left, right) => {
        const leftDate = left.submittedAt ?? left.startedAt ?? left.createdAt;
        const rightDate = right.submittedAt ?? right.startedAt ?? right.createdAt;
        return leftDate.localeCompare(rightDate);
      });

      let previousScore: number | null = null;
      let xp = 0;
      let examCount = 0;
      let improvementCount = 0;
      let missedCount = 0;

      for (const session of orderedTimeline) {
        if (MISSED_PROGRESS_STATUSES.has(session.status)) {
          examCount += 1;
          missedCount += 1;
          xp -= IMPROVEMENT_MISSED_EXAM_PENALTY;
          continue;
        }

        if (session.status !== "graded" || typeof session.score !== "number") {
          continue;
        }

        examCount += 1;

        if (previousScore !== null) {
          if (previousScore === 100 && session.score === 100) {
            xp += IMPROVEMENT_PERFECT_REPEAT_XP;
            improvementCount += 1;
          } else {
            const delta = Math.round(session.score - previousScore);
            if (delta > 0) {
              xp += delta;
              improvementCount += 1;
            }
          }
        }

        previousScore = session.score;
      }

      return {
        studentId,
        fullName: orderedTimeline[0]?.fullName ?? "Сурагч",
        xp,
        level: getLevel(Math.max(xp, 0)),
        examCount,
        improvementCount,
        missedCount,
      };
    })
    .sort((left, right) => {
      if (right.xp !== left.xp) {
        return right.xp - left.xp;
      }
      if (right.improvementCount !== left.improvementCount) {
        return right.improvementCount - left.improvementCount;
      }
      if (right.examCount !== left.examCount) {
        return right.examCount - left.examCount;
      }
      return left.studentId.localeCompare(right.studentId);
    });
};

// Apply auth + student role globally
studentRoutes.use("*", authMiddleware, requireRole("student"));

// GET /exams — List student's exam sessions with exam info
studentRoutes.get("/exams", async (c) => {
  const user = c.get("user");
  const db = getDb(c.env.educore);

  const sessions = await db
    .select({
      examId: examSessions.examId,
      title: exams.title,
      sessionStatus: examSessions.status,
      score: examSessions.score,
      scheduledAt: exams.scheduledAt,
      startedAt: examSessions.startedAt,
      submittedAt: examSessions.submittedAt,
    })
    .from(examSessions)
    .innerJoin(exams, eq(examSessions.examId, exams.id))
    .where(eq(examSessions.studentId, user.id));

  return success(c, sessions);
});

// GET /upcoming-exams — scheduled or active exams visible to the current student
studentRoutes.get("/upcoming-exams", async (c) => {
  const db = getDb(c.env.educore);

  const upcomingExams = await db
    .select({
      examId: exams.id,
      title: exams.title,
      description: exams.description,
      status: exams.status,
      className: exams.className,
      groupName: exams.groupName,
      scheduledAt: exams.scheduledAt,
      startedAt: exams.startedAt,
      finishedAt: exams.finishedAt,
      durationMin: exams.durationMin,
      roomCode: exams.roomCode,
    })
    .from(exams)
    .where(and(or(eq(exams.status, "scheduled"), eq(exams.status, "active"))))
    .orderBy(asc(exams.scheduledAt), asc(exams.createdAt));

  return success(c, upcomingExams);
});

// GET /results — All past results (graded sessions)
studentRoutes.get("/results", async (c) => {
  const user = c.get("user");
  const db = getDb(c.env.educore);

  const results = await db
    .select({
      sessionId: examSessions.id,
      examId: examSessions.examId,
      title: exams.title,
      score: examSessions.score,
      totalPoints: examSessions.totalPoints,
      earnedPoints: examSessions.earnedPoints,
      startedAt: examSessions.startedAt,
      submittedAt: examSessions.submittedAt,
    })
    .from(examSessions)
    .innerJoin(exams, eq(examSessions.examId, exams.id))
    .where(
      and(
        eq(examSessions.studentId, user.id),
        eq(examSessions.status, "graded")
      )
    );

  return success(c, results);
});

// GET /term-rank — current student's rank among students with graded term exams
studentRoutes.get("/term-rank", async (c) => {
  const user = c.get("user");
  const db = getDb(c.env.educore);
  const rankedStudents = await buildRankedStudentsByBucket(db, "term");

  const currentIndex = rankedStudents.findIndex(
    (entry) => entry.studentId === user.id,
  );
  const currentStudent = currentIndex >= 0 ? rankedStudents[currentIndex] : null;
  const termExamCount = await countStudentExamsByType(db, user.id, "term");

  return success(c, {
    rank: currentIndex >= 0 ? currentIndex + 1 : null,
    totalStudents: rankedStudents.length,
    termExamCount,
    xp: currentStudent?.xp ?? 0,
    level: currentStudent?.level ?? getLevel(0),
  });
});

// GET /term-leaderboard — top students ranked by term XP
studentRoutes.get("/term-leaderboard", async (c) => {
  const db = getDb(c.env.educore);
  const rankedStudents = await buildRankedStudentsByBucket(db, "term");

  return success(
    c,
    rankedStudents.slice(0, 10).map((entry, index) => ({
      id: entry.studentId,
      fullName: entry.fullName,
      avatarUrl: entry.avatarUrl,
      level: entry.level,
      rank: index + 1,
      xp: entry.xp,
    })),
  );
});

// GET /progress-rank — current student's private progress XP rank
studentRoutes.get("/progress-rank", async (c) => {
  const user = c.get("user");
  const db = getDb(c.env.educore);
  const rankedStudents = await buildRankedStudentsByBucket(db, "progress");

  const currentIndex = rankedStudents.findIndex(
    (entry) => entry.studentId === user.id,
  );
  const currentStudent = currentIndex >= 0 ? rankedStudents[currentIndex] : null;
  const progressExamCount = await countStudentExamsByType(db, user.id, "progress");

  return success(c, {
    rank: currentIndex >= 0 ? currentIndex + 1 : null,
    totalStudents: rankedStudents.length,
    progressExamCount,
    xp: currentStudent?.xp ?? 0,
    level: currentStudent?.level ?? getLevel(0),
    isPrivate: true,
  });
});

// GET /improvement-leaderboard — separate growth XP leaderboard from progress exams
studentRoutes.get("/improvement-leaderboard", async (c) => {
  const db = getDb(c.env.educore);
  const rankedStudents = await buildImprovementLeaderboard(db);

  return success(
    c,
    rankedStudents.slice(0, 10).map((entry, index) => ({
      id: entry.studentId,
      fullName: entry.fullName,
      level: entry.level,
      rank: index + 1,
      xp: entry.xp,
      examCount: entry.examCount,
      improvementCount: entry.improvementCount,
      missedCount: entry.missedCount,
    })),
  );
});

// GET /results/:sessionId — Detailed result
studentRoutes.get("/results/:sessionId", async (c) => {
  const user = c.get("user");
  const sessionId = c.req.param("sessionId");
  const db = getDb(c.env.educore);

  // Verify session belongs to student and is graded
  const [session] = await db
    .select()
    .from(examSessions)
    .where(
      and(
        eq(examSessions.id, sessionId),
        eq(examSessions.studentId, user.id),
        eq(examSessions.status, "graded")
      )
    )
    .limit(1);

  if (!session) {
    return notFound(c, "Session");
  }

  // Get exam info
  const [exam] = await db
    .select()
    .from(exams)
    .where(eq(exams.id, session.examId))
    .limit(1);

  if (!exam) {
    return notFound(c, "Exam");
  }

  // Get all student answers with question and option details
  const answers = await db
    .select({
      questionId: studentAnswers.questionId,
      questionText: questions.questionText,
      selectedOptionId: studentAnswers.selectedOptionId,
      textAnswer: studentAnswers.textAnswer,
      isCorrect: studentAnswers.isCorrect,
      pointsEarned: studentAnswers.pointsEarned,
      points: questions.points,
    })
    .from(studentAnswers)
    .innerJoin(questions, eq(studentAnswers.questionId, questions.id))
    .where(eq(studentAnswers.sessionId, sessionId));

  // For each answer, resolve selected answer text and correct answer text
  const breakdown = await Promise.all(
    answers.map(async (answer) => {
      let selectedAnswerText: string | null = null;
      let correctAnswerText: string | null = null;

      if (answer.selectedOptionId) {
        const [selectedOption] = await db
          .select({ text: options.text })
          .from(options)
          .where(eq(options.id, answer.selectedOptionId))
          .limit(1);
        selectedAnswerText = selectedOption?.text ?? null;
      } else {
        selectedAnswerText = answer.textAnswer;
      }

      // Get correct option for this question
      const [correctOption] = await db
        .select({ text: options.text })
        .from(options)
        .where(
          and(
            eq(options.questionId, answer.questionId),
            eq(options.isCorrect, true)
          )
        )
        .limit(1);
      correctAnswerText = correctOption?.text ?? null;

      return {
        questionText: answer.questionText,
        selectedAnswer: selectedAnswerText,
        correctAnswer: correctAnswerText,
        isCorrect: answer.isCorrect,
        points: answer.points,
        pointsEarned: answer.pointsEarned,
      };
    })
  );

  return success(c, {
    sessionId: session.id,
    examId: exam.id,
    title: exam.title,
    description: exam.description,
    score: session.score,
    totalPoints: session.totalPoints,
    earnedPoints: session.earnedPoints,
    startedAt: session.startedAt,
    submittedAt: session.submittedAt,
    answers: breakdown,
  });
});

const profileSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  school: z.string().optional().or(z.literal("")),
  grade: z.string().optional().or(z.literal("")),
  groupName: z.string().optional().or(z.literal("")),
  bio: z.string().optional().or(z.literal("")),
});

// GET /profile — current student's profile
studentRoutes.get("/profile", async (c) => {
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

  return success(c, {
    id: student.id,
    code: student.code,
    fullName: student.fullName,
    email: student.email,
    avatarUrl: student.avatarUrl,
    phone: student.phone,
    school: student.school,
    grade: student.grade,
    groupName: student.groupName,
    bio: student.bio,
    xp: student.xp,
    level: student.level,
  });
});

// PUT /profile — update current student's profile
studentRoutes.put("/profile", zValidator("json", profileSchema), async (c) => {
  const user = c.get("user");
  const db = getDb(c.env.educore);
  const payload = c.req.valid("json");

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, user.id))
    .limit(1);

  if (!student) {
    return notFound(c, "Student");
  }

  await db
    .update(students)
    .set({
      fullName: payload.fullName,
      email: payload.email || null,
      avatarUrl: payload.avatarUrl || null,
      phone: payload.phone || null,
      school: payload.school || null,
      grade: payload.grade || null,
      groupName: payload.groupName || null,
      bio: payload.bio || null,
    })
    .where(eq(students.id, user.id));

  return success(c, {
    ...payload,
  });
});

export default studentRoutes;
