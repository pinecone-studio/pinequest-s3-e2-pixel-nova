import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ============================================
// SHARED — Code-based auth (no external provider)
// ============================================

// Teacher
export const teachers = sqliteTable("teachers", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),         // unique teacher code (e.g., "T-1001")
  fullName: text("full_name").notNull(),
  email: text("email"),
  avatarUrl: text("avatar_url"),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

// Student
export const students = sqliteTable("students", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),         // unique student code (e.g., "S-2001")
  fullName: text("full_name").notNull(),
  email: text("email"),
  avatarUrl: text("avatar_url"),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

// ============================================
// MANDAH — Exams, Questions, Options
// ============================================

// Subject
export const subjects = sqliteTable("subjects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

// Exam
export const exams = sqliteTable("exams", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  subjectId: text("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft | scheduled | active | finished | archived
  scheduledAt: text("scheduled_at"),
  startedAt: text("started_at"),
  finishedAt: text("finished_at"),
  durationMin: integer("duration_min").notNull().default(60),
  roomCode: text("room_code").unique(),
  passScore: integer("pass_score").default(50),
  shuffleQuestions: integer("shuffle_questions", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

// Question
export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  examId: text("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  topic: text("topic"),
  difficulty: text("difficulty").notNull().default("medium"), // easy | medium | hard
  type: text("type").notNull(), // multiple_choice | true_false | short_answer
  questionText: text("question_text").notNull(),
  explanation: text("explanation"),
  correctAnswerText: text("correct_answer_text"), // for short_answer grading
  points: real("points").notNull().default(1),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

// Option (for multiple_choice / true_false)
export const options = sqliteTable("options", {
  id: text("id").primaryKey(),
  questionId: text("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  label: text("label").notNull(), // A, B, C, D
  text: text("text").notNull(),
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull().default(false),
  orderIndex: integer("order_index").notNull().default(0),
});

// Material (file attachments for exams)
export const materials = sqliteTable("materials", {
  id: text("id").primaryKey(),
  examId: text("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  materialType: text("material_type").notNull(), // attachment | reference
  fileUrl: text("file_url").notNull(),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

// ============================================
// ZOLOO — Sessions, Answers, Cheat Detection
// ============================================

// Exam Session (one per student per exam)
export const examSessions = sqliteTable("exam_sessions", {
  id: text("id").primaryKey(),
  examId: text("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("joined"), // joined | in_progress | submitted | graded | disqualified
  startedAt: text("started_at"),
  submittedAt: text("submitted_at"),
  score: real("score"),
  totalPoints: integer("total_points"),
  earnedPoints: integer("earned_points"),
  isFlagged: integer("is_flagged", { mode: "boolean" }).notNull().default(false),
  flagCount: integer("flag_count").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
}, (table) => [
  uniqueIndex("exam_sessions_exam_student_unique").on(table.examId, table.studentId),
]);

// Student Answer (one per question per session)
export const studentAnswers = sqliteTable("student_answers", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => examSessions.id, { onDelete: "cascade" }),
  questionId: text("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  selectedOptionId: text("selected_option_id")
    .references(() => options.id),
  textAnswer: text("text_answer"),
  isCorrect: integer("is_correct", { mode: "boolean" }),
  pointsEarned: real("points_earned").default(0),
  answeredAt: text("answered_at").notNull().default(sql`(current_timestamp)`),
}, (table) => [
  uniqueIndex("student_answers_session_question_unique").on(table.sessionId, table.questionId),
]);

// Cheat Event
export const cheatEvents = sqliteTable("cheat_events", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => examSessions.id, { onDelete: "cascade" }),
  examId: text("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // tab_switch | tab_hidden | window_blur | copy_paste | right_click | screen_capture | devtools_open | multiple_monitors | suspicious_resize | rapid_answers | idle_too_long
  severity: text("severity").notNull().default("low"), // low | medium | high | critical
  metadata: text("metadata"), // JSON string
  isNotified: integer("is_notified", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

// ============================================
// UULEE & MANLAI — XP, Saved Exams
// ============================================

// XP Transaction
export const xpTransactions = sqliteTable("xp_transactions", {
  id: text("id").primaryKey(),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(), // exam_completed | exam_passed | perfect_score | streak_bonus | first_exam | high_participation
  referenceId: text("reference_id"), // exam_id or session_id
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

// Saved Exam (student bookmarks)
export const savedExams = sqliteTable("saved_exams", {
  id: text("id").primaryKey(),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  examId: text("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
}, (table) => [
  uniqueIndex("saved_exams_student_exam_unique").on(table.studentId, table.examId),
]);
