ALTER TABLE `exam_sessions` ADD COLUMN `risk_level` text NOT NULL DEFAULT 'low';
ALTER TABLE `exam_sessions` ADD COLUMN `last_violation_at` text;
ALTER TABLE `exam_sessions` ADD COLUMN `top_violation_type` text;

ALTER TABLE `cheat_events` ADD COLUMN `event_source` text NOT NULL DEFAULT 'unknown';
ALTER TABLE `cheat_events` ADD COLUMN `confidence` real;
ALTER TABLE `cheat_events` ADD COLUMN `details` text;
ALTER TABLE `cheat_events` ADD COLUMN `dedupe_key` text;
