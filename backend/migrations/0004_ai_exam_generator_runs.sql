CREATE TABLE `ai_exam_generator_runs` (
  `id` text PRIMARY KEY NOT NULL,
  `teacher_id` text NOT NULL,
  `topic` text NOT NULL,
  `subject` text,
  `grade_or_class` text,
  `difficulty` text NOT NULL,
  `question_count` integer NOT NULL,
  `instructions` text,
  `generated_title` text NOT NULL,
  `draft_payload` text NOT NULL,
  `status` text NOT NULL DEFAULT 'accepted',
  `created_at` text NOT NULL DEFAULT (current_timestamp),
  `updated_at` text NOT NULL DEFAULT (current_timestamp),
  FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE cascade
);
