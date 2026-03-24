CREATE TABLE `exams` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`start_time` text,
	`end_time` text,
	`duration_minutes` integer,
	`room_code` text,
	`allow_late_entry` integer DEFAULT false NOT NULL,
	`total_points` real DEFAULT 0 NOT NULL,
	`total_questions` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exams_room_code_unique` ON `exams` (`room_code`);--> statement-breakpoint
CREATE TABLE `materials` (
	`id` text PRIMARY KEY NOT NULL,
	`exam_id` text NOT NULL,
	`file_name` text NOT NULL,
	`file_type` text NOT NULL,
	`material_type` text NOT NULL,
	`file_url` text NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `options` (
	`id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`label` text NOT NULL,
	`text` text NOT NULL,
	`is_correct` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`exam_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`topic` text,
	`difficulty` text DEFAULT 'medium' NOT NULL,
	`type` text NOT NULL,
	`question_text` text NOT NULL,
	`explanation` text,
	`correct_answer_text` text,
	`points` real DEFAULT 1 NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subjects_code_unique` ON `subjects` (`code`);--> statement-breakpoint
CREATE TABLE `teachers` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'teacher' NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teachers_email_unique` ON `teachers` (`email`);