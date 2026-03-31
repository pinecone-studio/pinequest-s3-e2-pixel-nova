ALTER TABLE `exams`
ADD COLUMN `requires_audio_recording` integer DEFAULT false NOT NULL;

CREATE TABLE `exam_audio_chunks` (
  `id` text PRIMARY KEY NOT NULL,
  `session_id` text NOT NULL,
  `exam_id` text NOT NULL,
  `student_id` text NOT NULL,
  `object_key` text NOT NULL,
  `mime_type` text NOT NULL,
  `sequence_number` integer NOT NULL,
  `chunk_started_at` text NOT NULL,
  `chunk_ended_at` text NOT NULL,
  `uploaded_at` text DEFAULT (current_timestamp) NOT NULL,
  `duration_ms` integer NOT NULL,
  `size_bytes` integer NOT NULL,
  `created_at` text DEFAULT (current_timestamp) NOT NULL,
  FOREIGN KEY (`session_id`) REFERENCES `exam_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX `exam_audio_chunks_session_sequence_unique`
ON `exam_audio_chunks` (`session_id`,`sequence_number`);
