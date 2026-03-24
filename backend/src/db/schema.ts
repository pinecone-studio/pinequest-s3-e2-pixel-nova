import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Teacher
export const teachers = sqliteTable("teachers", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("teacher"),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

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
  status: text("status").notNull().default("draft"), // draft | active | closed
  startTime: text("start_time"),
  endTime: text("end_time"),
  durationMinutes: integer("duration_minutes"),
  roomCode: text("room_code").unique(),
  allowLateEntry: integer("allow_late_entry", { mode: "boolean" }).notNull().default(false),
  totalPoints: real("total_points").notNull().default(0),
  totalQuestions: integer("total_questions").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

// Question
export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  examId: text("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  subjectId: text("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  topic: text("topic"),
  difficulty: text("difficulty").notNull().default("medium"), // easy | medium | hard
  type: text("type").notNull(), // multiple_choice | true_false | short_answer
  questionText: text("question_text").notNull(),
  explanation: text("explanation"),
  correctAnswerText: text("correct_answer_text"),
  points: real("points").notNull().default(1),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

// Option
export const options = sqliteTable("options", {
  id: text("id").primaryKey(),
  questionId: text("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  label: text("label").notNull(), // A, B, C, D
  text: text("text").notNull(),
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull().default(false),
});

// Material
export const materials = sqliteTable("materials", {
  id: text("id").primaryKey(),
  examId: text("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  materialType: text("material_type").notNull(), // attachment | reference | result
  fileUrl: text("file_url").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
});
