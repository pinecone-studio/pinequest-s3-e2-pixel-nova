ALTER TABLE `students` ADD COLUMN `term_xp` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `students` ADD COLUMN `progress_xp` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE `students`
SET
  `term_xp` = COALESCE((
    SELECT SUM(`xp_transactions`.`amount`)
    FROM `xp_transactions`
    INNER JOIN `exam_sessions`
      ON `exam_sessions`.`id` = `xp_transactions`.`reference_id`
    INNER JOIN `exams`
      ON `exams`.`id` = `exam_sessions`.`exam_id`
    WHERE
      `xp_transactions`.`student_id` = `students`.`id`
      AND `exams`.`exam_type` = 'term'
  ), 0),
  `progress_xp` = COALESCE((
    SELECT SUM(`xp_transactions`.`amount`)
    FROM `xp_transactions`
    INNER JOIN `exam_sessions`
      ON `exam_sessions`.`id` = `xp_transactions`.`reference_id`
    INNER JOIN `exams`
      ON `exams`.`id` = `exam_sessions`.`exam_id`
    WHERE
      `xp_transactions`.`student_id` = `students`.`id`
      AND `exams`.`exam_type` = 'progress'
  ), 0);
