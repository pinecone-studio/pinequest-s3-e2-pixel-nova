CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`type` text NOT NULL,
	`severity` text NOT NULL,
	`status` text DEFAULT 'unread' NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`exam_id` text,
	`session_id` text,
	`student_id` text,
	`metadata` text,
	`dedupe_key` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`read_at` text,
	`archived_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notifications_user_dedupe_unique` ON `notifications` (`user_id`,`dedupe_key`);
