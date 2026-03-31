import { Hono } from "hono";
import {
  getDb,
  students,
  exams,
  examSessions,
  cheatEvents,
  questions,
  studentAnswers,
  options,
} from "../db";
import { and, desc, eq, sql } from "drizzle-orm";
import type { AppEnv } from "../types";
import { success, notFound } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/role-guard";

const teacherRoutes = new Hono<AppEnv>();
const LIVE_UPDATE_MS = 5000;

const getOwnedExam = async (
  teacherId: string,
  examId: string,
  d1: D1Database,
) => {
  const db = getDb(d1);
  const [exam] = await db
    .select()
    .from(exams)
    .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)))
    .limit(1);

  return exam;
};

const getExamAttendanceStats = async (
  examId: string,
  expectedStudentsCount: number | null | undefined,
  d1: D1Database,
) => {
  const db = getDb(d1);
  const joinedStatuses = ["joined", "late", "in_progress", "submitted", "graded"];
  const submittedStatuses = ["submitted", "graded"];

  const [joinedRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(examSessions)
    .where(
      and(
        eq(examSessions.examId, examId),
        sql`${examSessions.status} IN (${sql.join(
          joinedStatuses.map((status) => sql`${status}`),
          sql`, `,
        )})`,
      ),
    );

  const [submittedRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(examSessions)
    .where(
      and(
        eq(examSessions.examId, examId),
        sql`${examSessions.status} IN (${sql.join(
          submittedStatuses.map((status) => sql`${status}`),
          sql`, `,
        )})`,
      ),
    );

  const expected = Number(expectedStudentsCount ?? 0);
  const joined = Number(joinedRow?.count ?? 0);
  const submitted = Number(submittedRow?.count ?? 0);

  return {
    expected,
    joined,
    submitted,
    attendance_rate: expected > 0 ? Math.round((joined / expected) * 100) : 0,
    submission_rate: expected > 0 ? Math.round((submitted / expected) * 100) : 0,
  };
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  tab_switch: "Таб сольсон",
  tab_hidden: "Бүтэн дэлгэцээс гарсан",
  window_blur: "Цонхноос гарсан",
  copy_paste: "Хуулах эсвэл буулгах оролдлого",
  right_click: "Баруун товшилт",
  screen_capture: "Дэлгэцийн зураг авалт",
  devtools_open: "Developer tools нээх оролдлого",
  multiple_monitors: "Олон дэлгэц ашигласан",
  suspicious_resize: "Сэжигтэй хэмжээс өөрчлөлт",
  rapid_answers: "Хэт хурдан хариулсан",
  idle_too_long: "Хэт удаан идэвхгүй байсан",
  face_missing: "Нүүр илрээгүй",
  multiple_faces: "Олон нүүр илэрсэн",
  looking_away: "Хажуу тийш харсан",
  looking_down: "Доош харсан",
  camera_blocked: "Камер хаагдсан",
  disqualification: "Шалгалтаас хасагдсан",
};

type SessionCheatSummary = {
  countByType: Record<string, number>;
  eventCount: number;
  latestEvent: {
    createdAt: string;
    eventSource: string | null;
    eventType: string;
    label: string;
    severity: string;
  } | null;
};

const getSessionCheatSummaries = async (
  sessionIds: string[],
  d1: D1Database,
) => {
  const db = getDb(d1);
  const events =
    sessionIds.length > 0
      ? await db
          .select({
            createdAt: cheatEvents.createdAt,
            eventSource: cheatEvents.eventSource,
            eventType: cheatEvents.eventType,
            severity: cheatEvents.severity,
            sessionId: cheatEvents.sessionId,
          })
          .from(cheatEvents)
          .where(
            sql`${cheatEvents.sessionId} IN (${sql.join(
              sessionIds.map((id) => sql`${id}`),
              sql`, `,
            )})`,
          )
          .orderBy(sql`${cheatEvents.createdAt} DESC`)
      : [];

  const bySession = new Map<string, SessionCheatSummary>();
  for (const event of events) {
    const summary = bySession.get(event.sessionId) ?? {
      countByType: {},
      eventCount: 0,
      latestEvent: null,
    };
    summary.eventCount += 1;
    summary.countByType[event.eventType] =
      (summary.countByType[event.eventType] ?? 0) + 1;
    if (!summary.latestEvent) {
      summary.latestEvent = {
        createdAt: event.createdAt,
        eventSource: event.eventSource,
        eventType: event.eventType,
        label: EVENT_TYPE_LABELS[event.eventType] ?? event.eventType,
        severity: event.severity,
      };
    }
    bySession.set(event.sessionId, summary);
  }

  return bySession;
};

const getExamRosterDetail = async (
  exam: Awaited<ReturnType<typeof getOwnedExam>>,
  d1: D1Database,
) => {
  if (!exam) return null;

  const db = getDb(d1);
  const examId = exam.id;

  const [questionCountRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(questions)
    .where(eq(questions.examId, examId));

  const totalQuestions = Number(questionCountRow?.count ?? 0);

  const sessions = await db
    .select({
      sessionId: examSessions.id,
      studentId: examSessions.studentId,
      studentName: students.fullName,
      studentCode: students.code,
      status: examSessions.status,
      submittedAt: examSessions.submittedAt,
      startedAt: examSessions.startedAt,
      isFlagged: examSessions.isFlagged,
      flagCount: examSessions.flagCount,
      lastViolationAt: examSessions.lastViolationAt,
      riskLevel: examSessions.riskLevel,
      score: examSessions.score,
      topViolationType: examSessions.topViolationType,
      violationScore: examSessions.violationScore,
      joinLocationStatus: examSessions.joinLocationStatus,
      joinDistanceMeters: examSessions.joinDistanceMeters,
      joinLocationCheckedAt: examSessions.joinLocationCheckedAt,
    })
    .from(examSessions)
    .innerJoin(students, eq(examSessions.studentId, students.id))
    .where(eq(examSessions.examId, examId))
    .orderBy(students.fullName);

  const sessionIds = sessions.map((session) => session.sessionId);
  const answerCounts =
    sessionIds.length > 0
      ? await db
          .select({
            sessionId: studentAnswers.sessionId,
            count: sql<number>`count(*)`,
          })
          .from(studentAnswers)
          .where(
            sql`${studentAnswers.sessionId} IN (${sql.join(
              sessionIds.map((id) => sql`${id}`),
              sql`, `,
            )})`,
          )
          .groupBy(studentAnswers.sessionId)
      : [];

  const countBySession = new Map(
    answerCounts.map((row) => [row.sessionId, Number(row.count ?? 0)]),
  );
  const cheatSummaryBySession = await getSessionCheatSummaries(sessionIds, d1);

  return {
    examId: exam.id,
    title: exam.title,
    roomCode: exam.roomCode,
    durationMin: exam.durationMin,
    expectedStudentsCount: exam.expectedStudentsCount,
    scheduledAt: exam.scheduledAt,
    startedAt: exam.startedAt,
    finishedAt: exam.finishedAt,
    participants: sessions.map((session) => {
      const answeredCount = countBySession.get(session.sessionId) ?? 0;
      const cheatSummary = cheatSummaryBySession.get(session.sessionId);
      const progressPercent =
        totalQuestions > 0
          ? Math.min(100, Math.round((answeredCount / totalQuestions) * 100))
          : 0;

      return {
        sessionId: session.sessionId,
        studentId: session.studentId,
        studentName: session.studentName,
        studentCode: session.studentCode,
        status: session.status,
        answeredCount,
        totalQuestions,
        progressPercent,
        submittedAt: session.submittedAt,
        startedAt: session.startedAt,
        isFlagged: Boolean(session.isFlagged),
        flagCount: Number(session.flagCount ?? 0),
        violationScore: Number(session.violationScore ?? 0),
        riskLevel: session.riskLevel ?? "low",
        lastViolationAt: session.lastViolationAt,
        topViolationType: session.topViolationType,
        eventCount: cheatSummary?.eventCount ?? 0,
        latestEvent: cheatSummary?.latestEvent ?? null,
        countByType: cheatSummary?.countByType ?? {},
        score: session.score,
        joinLocationStatus: session.joinLocationStatus,
        joinDistanceMeters: session.joinDistanceMeters,
        joinLocationCheckedAt: session.joinLocationCheckedAt,
      };
    }),
  };
};

const getTeacherExamLiveSnapshot = async (
  teacherId: string,
  examId: string,
  d1: D1Database,
) => {
  const exam = await getOwnedExam(teacherId, examId, d1);
  if (!exam) return null;

  const [roster, stats] = await Promise.all([
    getExamRosterDetail(exam, d1),
    getExamAttendanceStats(examId, exam.expectedStudentsCount, d1),
  ]);

  return {
    roster,
    stats,
    examStatus: exam.status,
    generatedAt: new Date().toISOString(),
  };
};

// Apply auth + teacher role globally
teacherRoutes.use("*", authMiddleware, requireRole("teacher"));

// GET /students/:id/profile — teacher view of a student's profile
teacherRoutes.get("/students/:id/profile", async (c) => {
  const studentId = c.req.param("id");
  const db = getDb(c.env.educore);

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId))
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

// GET /exams/:examId/submissions — list graded sessions for an exam
teacherRoutes.get("/exams/:examId/submissions", async (c) => {
  const teacherId = c.get("user").id;
  const examId = c.req.param("examId");
  const db = getDb(c.env.educore);

  const [exam] = await db
    .select()
    .from(exams)
    .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)))
    .limit(1);

  if (!exam) {
    return notFound(c, "Exam");
  }

  const submissions = await db
    .select({
      id: examSessions.id,
      examId: examSessions.examId,
      studentId: examSessions.studentId,
      studentName: students.fullName,
      score: examSessions.score,
      totalPoints: examSessions.totalPoints,
      percentage: examSessions.score,
      submittedAt: examSessions.submittedAt,
      isFlagged: examSessions.isFlagged,
      flagCount: examSessions.flagCount,
      lastViolationAt: examSessions.lastViolationAt,
      riskLevel: examSessions.riskLevel,
      topViolationType: examSessions.topViolationType,
      violationScore: examSessions.violationScore,
    })
    .from(examSessions)
    .innerJoin(students, eq(examSessions.studentId, students.id))
    .where(
      and(eq(examSessions.examId, examId), eq(examSessions.status, "graded")),
    )
    .orderBy(examSessions.submittedAt);

  const cheatSummaryBySession = await getSessionCheatSummaries(
    submissions.map((submission) => submission.id),
    c.env.educore,
  );

  return success(
    c,
    submissions.map((submission) => {
      const cheatSummary = cheatSummaryBySession.get(submission.id);
      return {
        ...submission,
        eventCount: cheatSummary?.eventCount ?? 0,
        latestEvent: cheatSummary?.latestEvent ?? null,
        countByType: cheatSummary?.countByType ?? {},
      };
    }),
  );
});

teacherRoutes.get("/exams/:examId/roster", async (c) => {
  const teacherId = c.get("user").id;
  const examId = c.req.param("examId");
  const exam = await getOwnedExam(teacherId, examId, c.env.educore);

  if (!exam) {
    return notFound(c, "Exam");
  }

  const roster = await getExamRosterDetail(exam, c.env.educore);
  return success(c, roster);
});

teacherRoutes.get("/exams/:examId/live", async (c) => {
  const teacherId = c.get("user").id;
  const examId = c.req.param("examId");
  const exam = await getOwnedExam(teacherId, examId, c.env.educore);

  if (!exam) {
    return notFound(c, "Exam");
  }

  const encoder = new TextEncoder();
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start: (controller) => {
      const closeStream = () => {
        if (closed) return;
        closed = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        controller.close();
      };

      const sendEvent = (event: string, payload: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`),
        );
      };

      const tick = async () => {
        if (closed) return;

        try {
          const snapshot = await getTeacherExamLiveSnapshot(
            teacherId,
            examId,
            c.env.educore,
          );

          if (!snapshot) {
            sendEvent("error", { message: "Exam no longer exists." });
            closeStream();
            return;
          }

          sendEvent("snapshot", snapshot);

          if (snapshot.examStatus !== "active") {
            closeStream();
            return;
          }

          timeoutId = setTimeout(() => {
            void tick();
          }, LIVE_UPDATE_MS);
        } catch {
          sendEvent("error", { message: "Failed to stream exam updates." });
          closeStream();
        }
      };

      c.req.raw.signal.addEventListener("abort", closeStream);
      controller.enqueue(encoder.encode(": connected\n\n"));
      void tick();
    },
    cancel: () => {
      closed = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
});

teacherRoutes.get("/exams/summary", async (c) => {
  const teacherId = c.get("user").id;
  const db = getDb(c.env.educore);

  const summary = await db
    .select({
      id: exams.id,
      title: exams.title,
      description: exams.description,
      examType: exams.examType,
      className: exams.className,
      groupName: exams.groupName,
      scheduledAt: exams.scheduledAt,
      startedAt: exams.startedAt,
      finishedAt: exams.finishedAt,
      roomCode: exams.roomCode,
      durationMin: exams.durationMin,
      locationPolicy: exams.locationPolicy,
      locationLabel: exams.locationLabel,
      locationLatitude: exams.locationLatitude,
      locationLongitude: exams.locationLongitude,
      allowedRadiusMeters: exams.allowedRadiusMeters,
      status: exams.status,
      expectedStudentsCount: exams.expectedStudentsCount,
      createdAt: exams.createdAt,
      questionCount:
        sql<number>`(select count(*) from questions where questions.exam_id = ${exams.id})`,
      submissionCount:
        sql<number>`(select count(*) from exam_sessions where exam_sessions.exam_id = ${exams.id} and exam_sessions.status = 'graded')`,
    })
    .from(exams)
    .where(eq(exams.teacherId, teacherId))
    .orderBy(desc(exams.createdAt));

  return success(c, summary);
});

// GET /sessions/:sessionId/result — detailed result for teacher
teacherRoutes.get("/sessions/:sessionId/result", async (c) => {
  const teacherId = c.get("user").id;
  const sessionId = c.req.param("sessionId");
  const db = getDb(c.env.educore);

  const [session] = await db
    .select()
    .from(examSessions)
    .where(eq(examSessions.id, sessionId))
    .limit(1);

  if (!session) {
    return notFound(c, "Session");
  }

  const [exam] = await db
    .select()
    .from(exams)
    .where(and(eq(exams.id, session.examId), eq(exams.teacherId, teacherId)))
    .limit(1);

  if (!exam) {
    return notFound(c, "Exam");
  }

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, session.studentId))
    .limit(1);

  const answers = await db
    .select({
      questionId: studentAnswers.questionId,
      selectedOptionId: studentAnswers.selectedOptionId,
      textAnswer: studentAnswers.textAnswer,
      isCorrect: studentAnswers.isCorrect,
      pointsEarned: studentAnswers.pointsEarned,
      questionText: questions.questionText,
      questionType: questions.type,
      points: questions.points,
      correctAnswerText: questions.correctAnswerText,
    })
    .from(studentAnswers)
    .innerJoin(questions, eq(studentAnswers.questionId, questions.id))
    .where(eq(studentAnswers.sessionId, sessionId))
    .orderBy(questions.orderIndex);

  const questionIds = answers.map((a) => a.questionId);
  const allOptions =
    questionIds.length > 0
      ? await db
          .select()
          .from(options)
          .where(
            sql`${options.questionId} IN (${sql.join(
              questionIds.map((id) => sql`${id}`),
              sql`, `,
            )})`,
          )
          .orderBy(options.orderIndex)
      : [];

  const optionsByQuestion = new Map<string, typeof allOptions>();
  for (const opt of allOptions) {
    const list = optionsByQuestion.get(opt.questionId) ?? [];
    list.push(opt);
    optionsByQuestion.set(opt.questionId, list);
  }

  const detailedAnswers = answers.map((a) => ({
    questionId: a.questionId,
    questionText: a.questionText,
    questionType: a.questionType,
    points: a.points,
    correctAnswerText: a.correctAnswerText,
    selectedOptionId: a.selectedOptionId,
    textAnswer: a.textAnswer,
    isCorrect: a.isCorrect,
    pointsEarned: a.pointsEarned,
    options: (optionsByQuestion.get(a.questionId) ?? []).map((opt) => ({
      id: opt.id,
      label: opt.label,
      text: opt.text,
      imageUrl: opt.imageUrl,
      isCorrect: opt.isCorrect,
    })),
  }));

  return success(c, {
    sessionId: session.id,
    examId: exam.id,
    title: exam.title,
    score: session.score,
    totalPoints: session.totalPoints,
    earnedPoints: session.earnedPoints,
    submittedAt: session.submittedAt,
    student: student
      ? {
          id: student.id,
          fullName: student.fullName,
          email: student.email,
          avatarUrl: student.avatarUrl,
        }
      : null,
    answers: detailedAnswers,
  });
});

export default teacherRoutes;
