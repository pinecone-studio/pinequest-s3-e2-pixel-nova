import { and, desc, eq, isNull, lt, or } from "drizzle-orm";
import { examSessions, exams, notifications, students, type getDb } from "../db";
import { parseExamDate } from "../utils/exam-time";

type AppDb = ReturnType<typeof getDb>;

export type NotificationRole = "teacher" | "student";
export type NotificationSeverity = "critical" | "warning" | "info" | "success";
export type NotificationType =
  | "student_joined"
  | "student_submitted"
  | "student_flagged"
  | "exam_ending_soon"
  | "exam_finished"
  | "exam_unlocked"
  | "late_entry_notice"
  | "submission_saved"
  | "time_remaining_warning"
  | "result_published";

export type PublishNotificationInput = {
  userId: string;
  role: NotificationRole;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  examId?: string | null;
  sessionId?: string | null;
  studentId?: string | null;
  metadata?: Record<string, unknown> | null;
  dedupeKey?: string | null;
};

const serializeMetadata = (metadata?: Record<string, unknown> | null) =>
  metadata ? JSON.stringify(metadata) : null;

const nowIso = () => new Date().toISOString();
const INFO_RETENTION_MS = 24 * 60 * 60 * 1000;
const WARNING_RETENTION_MS = 3 * 24 * 60 * 60 * 1000;
const MAX_ACTIVE_NOTIFICATIONS = 60;

const retentionByType: Partial<Record<NotificationType, number>> = {
  submission_saved: 10 * 60 * 1000,
  time_remaining_warning: 6 * 60 * 60 * 1000,
  exam_unlocked: INFO_RETENTION_MS,
  late_entry_notice: WARNING_RETENTION_MS,
  exam_ending_soon: 6 * 60 * 60 * 1000,
};

export const publishNotification = async (
  db: AppDb,
  input: PublishNotificationInput,
) => {
  if (input.dedupeKey) {
    const [existing] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, input.userId),
          eq(notifications.dedupeKey, input.dedupeKey),
        ),
      )
      .limit(1);

    if (existing) return existing;
  }

  const record = {
    id: crypto.randomUUID(),
    userId: input.userId,
    role: input.role,
    type: input.type,
    severity: input.severity,
    status: "unread",
    title: input.title,
    message: input.message,
    examId: input.examId ?? null,
    sessionId: input.sessionId ?? null,
    studentId: input.studentId ?? null,
    metadata: serializeMetadata(input.metadata),
    dedupeKey: input.dedupeKey ?? null,
    createdAt: nowIso(),
    readAt: null,
    archivedAt: null,
  } as const;

  await db.insert(notifications).values(record);
  return record;
};

export const listNotificationsForUser = async (
  db: AppDb,
  userId: string,
  limit = 40,
) =>
  db
    .select()
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), isNull(notifications.archivedAt)),
    )
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

export const markNotificationRead = async (
  db: AppDb,
  userId: string,
  notificationId: string,
) => {
  await db
    .update(notifications)
    .set({
      status: "read",
      readAt: nowIso(),
    })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId),
      ),
    );
};

export const markAllNotificationsRead = async (db: AppDb, userId: string) => {
  await db
    .update(notifications)
    .set({
      status: "read",
      readAt: nowIso(),
    })
    .where(
      and(eq(notifications.userId, userId), eq(notifications.status, "unread")),
    );
};

export const cleanupNotificationsForUser = async (db: AppDb, userId: string) => {
  const now = Date.now();
  const infoCutoff = new Date(now - INFO_RETENTION_MS).toISOString();
  const warningCutoff = new Date(now - WARNING_RETENTION_MS).toISOString();

  await db
    .update(notifications)
    .set({ archivedAt: nowIso() })
    .where(
      and(
        eq(notifications.userId, userId),
        isNull(notifications.archivedAt),
        or(
          and(
            eq(notifications.status, "read"),
            eq(notifications.severity, "info"),
            lt(notifications.createdAt, infoCutoff),
          ),
          and(
            eq(notifications.status, "read"),
            eq(notifications.severity, "success"),
            lt(notifications.createdAt, infoCutoff),
          ),
          and(
            eq(notifications.severity, "warning"),
            lt(notifications.createdAt, warningCutoff),
          ),
        ),
      ),
    );

  for (const [type, retentionMs] of Object.entries(retentionByType) as Array<
    [NotificationType, number]
  >) {
    const cutoff = new Date(now - retentionMs).toISOString();
    await db
      .update(notifications)
      .set({ archivedAt: nowIso() })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.type, type),
          isNull(notifications.archivedAt),
          lt(notifications.createdAt, cutoff),
        ),
      );
  }

  const activeItems = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), isNull(notifications.archivedAt)),
    )
    .orderBy(desc(notifications.createdAt));

  const overflow = activeItems.slice(MAX_ACTIVE_NOTIFICATIONS);
  for (const item of overflow) {
    await db
      .update(notifications)
      .set({ archivedAt: nowIso() })
      .where(eq(notifications.id, item.id));
  }
};

const minutesLeft = (endsAt: Date) =>
  Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / 60000));

const buildTeacherCopy = {
  studentJoined: (name: string) => ({
    title: "Сурагч орж ирлээ",
    message: `${name} шалгалтад нэвтэрлээ.`,
  }),
  studentSubmitted: (name: string) => ({
    title: "Шалгалт илгээгдлээ",
    message: `${name} хариултаа илгээлээ.`,
  }),
  studentFlagged: (name: string, reason: string) => ({
    title: "Зөрчил илэрлээ",
    message: `${name}-ийн шалгалтын үеэр ${reason} бүртгэгдлээ.`,
  }),
  examEndingSoon: (title: string, minutes: number) => ({
    title: "Шалгалт дуусах дөхлөө",
    message: `${title} шалгалт ${minutes} минутын дараа дуусна.`,
  }),
  examFinished: (title: string) => ({
    title: "Шалгалт дууслаа",
    message: `${title} шалгалтын хугацаа дууслаа.`,
  }),
};

const buildStudentCopy = {
  examUnlocked: (title: string) => ({
    title: "Шалгалт эхлэхэд бэлэн",
    message: `${title} шалгалтаа эхлүүлж болно.`,
  }),
  lateEntryNotice: (minutes: number) => ({
    title: "Хоцорч орлоо",
    message: `Та хоцорч орсон тул ${minutes} минутын үлдсэн хугацаагаар өгнө.`,
  }),
  submissionSaved: () => ({
    title: "Хариулт хадгалагдлаа",
    message: "Таны сүүлийн хариулт амжилттай хадгалагдлаа.",
  }),
  timeRemainingWarning: (minutes: number) => ({
    title: "Хугацаа дуусах гэж байна",
    message: `${minutes} минут үлдлээ.`,
  }),
  resultPublished: (title: string) => ({
    title: "Дүн гарлаа",
    message: `${title} шалгалтын дүнг харах боломжтой боллоо.`,
  }),
};

export const notifyTeacherStudentJoined = async (
  db: AppDb,
  teacherId: string,
  examId: string,
  sessionId: string,
  studentId: string,
  studentName: string,
  late = false,
) => {
  const copy = late
    ? {
        title: "Сурагч хоцорч орлоо",
        message: `${studentName} хоцорч шалгалтад орж ирлээ.`,
      }
    : buildTeacherCopy.studentJoined(studentName);

  return publishNotification(db, {
    userId: teacherId,
    role: "teacher",
    type: "student_joined",
    severity: late ? "warning" : "info",
    title: copy.title,
    message: copy.message,
    examId,
    sessionId,
    studentId,
    dedupeKey: `student_joined:${sessionId}`,
    metadata: { studentName, late },
  });
};

export const notifyTeacherStudentSubmitted = async (
  db: AppDb,
  teacherId: string,
  examId: string,
  sessionId: string,
  studentId: string,
  studentName: string,
) =>
  publishNotification(db, {
    userId: teacherId,
    role: "teacher",
    type: "student_submitted",
    severity: "success",
    title: buildTeacherCopy.studentSubmitted(studentName).title,
    message: buildTeacherCopy.studentSubmitted(studentName).message,
    examId,
    sessionId,
    studentId,
    dedupeKey: `student_submitted:${sessionId}`,
    metadata: { studentName },
  });

export const notifyTeacherStudentFlagged = async (
  db: AppDb,
  teacherId: string,
  examId: string,
  sessionId: string,
  studentId: string,
  studentName: string,
  reason: string,
  severity: NotificationSeverity = "warning",
) =>
  publishNotification(db, {
    userId: teacherId,
    role: "teacher",
    type: "student_flagged",
    severity,
    title: buildTeacherCopy.studentFlagged(studentName, reason).title,
    message: buildTeacherCopy.studentFlagged(studentName, reason).message,
    examId,
    sessionId,
    studentId,
    dedupeKey: `student_flagged:${sessionId}:${reason}:${Math.floor(Date.now() / 120000)}`,
    metadata: { studentName, reason },
  });

export const notifyStudentLateEntry = async (
  db: AppDb,
  studentId: string,
  examId: string,
  sessionId: string,
  minutes: number,
) =>
  publishNotification(db, {
    userId: studentId,
    role: "student",
    type: "late_entry_notice",
    severity: "warning",
    title: buildStudentCopy.lateEntryNotice(minutes).title,
    message: buildStudentCopy.lateEntryNotice(minutes).message,
    examId,
    sessionId,
    dedupeKey: `late_entry_notice:${sessionId}`,
    metadata: { minutesLeft: minutes },
  });

export const notifyStudentSubmissionSaved = async (
  db: AppDb,
  studentId: string,
  examId: string,
  sessionId: string,
) => {
  const bucket = Math.floor(Date.now() / 30000);
  return publishNotification(db, {
    userId: studentId,
    role: "student",
    type: "submission_saved",
    severity: "success",
    title: buildStudentCopy.submissionSaved().title,
    message: buildStudentCopy.submissionSaved().message,
    examId,
    sessionId,
    dedupeKey: `submission_saved:${sessionId}:${bucket}`,
  });
};

const syncTeacherExamWindowNotifications = async (
  db: AppDb,
  teacherId: string,
) => {
  const teacherExams = await db
    .select({
      id: exams.id,
      title: exams.title,
      scheduledAt: exams.scheduledAt,
      startedAt: exams.startedAt,
      finishedAt: exams.finishedAt,
      durationMin: exams.durationMin,
      status: exams.status,
    })
    .from(exams)
    .where(eq(exams.teacherId, teacherId));

  for (const exam of teacherExams) {
    const start = parseExamDate(exam.startedAt) ?? parseExamDate(exam.scheduledAt);
    if (!start) continue;
    const end = new Date(start.getTime() + Number(exam.durationMin ?? 0) * 60000);
    const minsLeft = minutesLeft(end);

    if (minsLeft <= 0) {
      await publishNotification(db, {
        userId: teacherId,
        role: "teacher",
        type: "exam_finished",
        severity: "success",
        title: buildTeacherCopy.examFinished(exam.title).title,
        message: buildTeacherCopy.examFinished(exam.title).message,
        examId: exam.id,
        dedupeKey: `exam_finished:${exam.id}`,
      });
      continue;
    }

    for (const threshold of [10, 5, 1]) {
      if (minsLeft <= threshold) {
        await publishNotification(db, {
          userId: teacherId,
          role: "teacher",
          type: "exam_ending_soon",
          severity: "warning",
          title: buildTeacherCopy.examEndingSoon(exam.title, threshold).title,
          message: buildTeacherCopy.examEndingSoon(exam.title, threshold).message,
          examId: exam.id,
          dedupeKey: `exam_ending_soon:${exam.id}:${threshold}`,
          metadata: { minutesLeft: threshold },
        });
      }
    }
  }
};

const syncStudentLifecycleNotifications = async (
  db: AppDb,
  studentId: string,
) => {
  const sessions = await db
    .select({
      sessionId: examSessions.id,
      sessionStatus: examSessions.status,
      submittedAt: examSessions.submittedAt,
      examId: exams.id,
      examTitle: exams.title,
      examStatus: exams.status,
      scheduledAt: exams.scheduledAt,
      startedAt: exams.startedAt,
      finishedAt: exams.finishedAt,
      durationMin: exams.durationMin,
    })
    .from(examSessions)
    .innerJoin(exams, eq(examSessions.examId, exams.id))
    .where(eq(examSessions.studentId, studentId));

  for (const session of sessions) {
    const start =
      parseExamDate(session.startedAt) ?? parseExamDate(session.scheduledAt);
    const end = start
      ? new Date(start.getTime() + Number(session.durationMin ?? 0) * 60000)
      : null;

    if (session.examStatus === "active") {
      await publishNotification(db, {
        userId: studentId,
        role: "student",
        type: "exam_unlocked",
        severity: "success",
        title: buildStudentCopy.examUnlocked(session.examTitle).title,
        message: buildStudentCopy.examUnlocked(session.examTitle).message,
        examId: session.examId,
        sessionId: session.sessionId,
        dedupeKey: `exam_unlocked:${session.sessionId}`,
      });
    }

    if (session.sessionStatus === "late" && end) {
      await notifyStudentLateEntry(
        db,
        studentId,
        session.examId,
        session.sessionId,
        minutesLeft(end),
      );
    }

    if (end && ["joined", "late", "in_progress"].includes(session.sessionStatus)) {
      for (const threshold of [10, 5, 1]) {
        if (minutesLeft(end) <= threshold && minutesLeft(end) > 0) {
          await publishNotification(db, {
            userId: studentId,
            role: "student",
            type: "time_remaining_warning",
            severity: "warning",
            title: buildStudentCopy.timeRemainingWarning(threshold).title,
            message: buildStudentCopy.timeRemainingWarning(threshold).message,
            examId: session.examId,
            sessionId: session.sessionId,
            dedupeKey: `time_remaining_warning:${session.sessionId}:${threshold}`,
            metadata: { minutesLeft: threshold },
          });
        }
      }
    }

    if (
      session.submittedAt &&
      (session.examStatus === "finished" || Boolean(session.finishedAt))
    ) {
      await publishNotification(db, {
        userId: studentId,
        role: "student",
        type: "result_published",
        severity: "success",
        title: buildStudentCopy.resultPublished(session.examTitle).title,
        message: buildStudentCopy.resultPublished(session.examTitle).message,
        examId: session.examId,
        sessionId: session.sessionId,
        dedupeKey: `result_published:${session.sessionId}`,
      });
    }
  }
};

export const syncNotificationsForUser = async (
  db: AppDb,
  userId: string,
  role: NotificationRole,
) => {
  await cleanupNotificationsForUser(db, userId);
  if (role === "teacher") {
    await syncTeacherExamWindowNotifications(db, userId);
  } else {
    await syncStudentLifecycleNotifications(db, userId);
  }
};

export const enrichTeacherNotificationTargets = async (
  db: AppDb,
  examId: string,
  studentId: string,
) => {
  const [exam] = await db
    .select({ teacherId: exams.teacherId, title: exams.title })
    .from(exams)
    .where(eq(exams.id, examId))
    .limit(1);

  const [student] = await db
    .select({ fullName: students.fullName })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  return {
    teacherId: exam?.teacherId ?? null,
    examTitle: exam?.title ?? null,
    studentName: student?.fullName ?? studentId,
  };
};

export const getUnreadCount = async (db: AppDb, userId: string) => {
  const unread = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.status, "unread"),
        isNull(notifications.archivedAt),
      ),
    );

  return unread.length;
};
