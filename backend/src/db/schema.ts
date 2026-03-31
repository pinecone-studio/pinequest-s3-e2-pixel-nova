import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { serializeEnabledCheatDetections } from "../utils/exam-cheat-detections";

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
  phone: text("phone"),
  school: text("school"),
  grade: text("grade"),
  groupName: text("group_name"),
  bio: text("bio"),
  xp: integer("xp").notNull().default(0),
  termXp: integer("term_xp").notNull().default(0),
  progressXp: integer("progress_xp").notNull().default(0),
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
  examType: text("exam_type"),
  className: text("class_name"),
  groupName: text("group_name"),
  status: text("status").notNull().default("draft"), // draft | scheduled | active | finished | archived
  scheduledAt: text("scheduled_at"),
  startedAt: text("started_at"),
  finishedAt: text("finished_at"),
  durationMin: integer("duration_min").notNull().default(60),
  expectedStudentsCount: integer("expected_students_count")
    .notNull()
    .default(0),
  roomCode: text("room_code").unique(),
  passScore: integer("pass_score").default(50),
  shuffleQuestions: integer("shuffle_questions", { mode: "boolean" }).notNull().default(false),
  locationPolicy: text("location_policy").notNull().default("anywhere"), // anywhere | school_only
  locationLabel: text("location_label"),
  locationLatitude: real("location_latitude"),
  locationLongitude: real("location_longitude"),
  allowedRadiusMeters: integer("allowed_radius_meters").notNull().default(3000),
  enabledCheatDetections: text("enabled_cheat_detections")
    .notNull()
    .default(serializeEnabledCheatDetections()),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

// ============================================
// QUESTION BANK — Reusable questions across exams
// ============================================

// Question Bank (багш асуултуудыг хадгалж, олон шалгалтад дахин ашиглах)
export const questionBank = sqliteTable("question_bank", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  subjectId: text("subject_id")
    .references(() => subjects.id, { onDelete: "set null" }),
  type: text("type").notNull(),                        // multiple_choice | true_false | short_answer
  difficulty: text("difficulty").notNull().default("medium"), // easy | medium | hard
  questionText: text("question_text").notNull(),
  imageUrl: text("image_url"),                         // зураг (R2 URL)
  audioUrl: text("audio_url"),                         // аудио (R2 URL)
  explanation: text("explanation"),
  correctAnswerText: text("correct_answer_text"),      // for short_answer
  tags: text("tags"),                                  // JSON array: ["algebra", "grade10"]
  usageCount: integer("usage_count").notNull().default(0), // хэдэн шалгалтад ашигласан
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

// Question Bank Options (банк дахь асуултын хариултууд)
export const questionBankOptions = sqliteTable("question_bank_options", {
  id: text("id").primaryKey(),
  bankQuestionId: text("bank_question_id")
    .notNull()
    .references(() => questionBank.id, { onDelete: "cascade" }),
  label: text("label").notNull(),                      // A, B, C, D
  text: text("text").notNull(),
  imageUrl: text("image_url"),
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull().default(false),
  orderIndex: integer("order_index").notNull().default(0),
});

// Question (exam дотор — банкнаас хуулсан эсвэл шинээр үүсгэсэн)
export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  examId: text("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  bankQuestionId: text("bank_question_id")
    .references(() => questionBank.id),                // null = original, set = copied from bank
  topic: text("topic"),
  difficulty: text("difficulty").notNull().default("medium"), // easy | medium | hard
  type: text("type").notNull(), // multiple_choice | true_false | short_answer
  questionText: text("question_text").notNull(),
  imageUrl: text("image_url"),                         // зураг (R2 URL)
  audioUrl: text("audio_url"),                         // аудио (R2 URL)
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
  imageUrl: text("image_url"),                         // хариулт дотор зураг (R2 URL)
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
  violationScore: integer("violation_score").notNull().default(0),
  riskLevel: text("risk_level").notNull().default("low"),
  lastViolationAt: text("last_violation_at"),
  topViolationType: text("top_violation_type"),
  joinLocationStatus: text("join_location_status").notNull().default("not_checked"), // not_checked | inside | near_edge | outside | not_required
  joinDistanceMeters: real("join_distance_meters"),
  joinLatitude: real("join_latitude"),
  joinLongitude: real("join_longitude"),
  joinLocationCheckedAt: text("join_location_checked_at"),
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
  eventType: text("event_type").notNull(), // tab_switch | tab_hidden | window_blur | copy_paste | right_click | screen_capture | devtools_open | multiple_monitors | suspicious_resize | rapid_answers | idle_too_long | face_missing | multiple_faces | looking_away | looking_down | camera_blocked
  severity: text("severity").notNull().default("low"), // low | medium | high | critical
  eventSource: text("event_source").notNull().default("unknown"),
  confidence: real("confidence"),
  details: text("details"), // normalized JSON string
  dedupeKey: text("dedupe_key"),
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

// Accepted AI exam generator drafts
export const aiExamGeneratorRuns = sqliteTable("ai_exam_generator_runs", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  topic: text("topic").notNull(),
  subject: text("subject"),
  gradeOrClass: text("grade_or_class"),
  difficulty: text("difficulty").notNull(),
  questionCount: integer("question_count").notNull(),
  instructions: text("instructions"),
  generatedTitle: text("generated_title").notNull(),
  draftPayload: text("draft_payload").notNull(),
  status: text("status").notNull().default("accepted"),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

// Real-time / persisted notifications
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(), // teacher | student
  type: text("type").notNull(),
  severity: text("severity").notNull(), // critical | warning | info | success
  status: text("status").notNull().default("unread"), // unread | read | archived
  title: text("title").notNull(),
  message: text("message").notNull(),
  examId: text("exam_id"),
  sessionId: text("session_id"),
  studentId: text("student_id"),
  metadata: text("metadata"),
  dedupeKey: text("dedupe_key"),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  readAt: text("read_at"),
  archivedAt: text("archived_at"),
}, (table) => [
  uniqueIndex("notifications_user_dedupe_unique").on(table.userId, table.dedupeKey),
]);
