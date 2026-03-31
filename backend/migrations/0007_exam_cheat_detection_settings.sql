ALTER TABLE `exams`
ADD COLUMN `enabled_cheat_detections` text NOT NULL DEFAULT '["tab_switch","tab_hidden","window_blur","copy_paste","right_click","screen_capture","devtools_open","multiple_monitors","suspicious_resize","rapid_answers","idle_too_long","face_missing","multiple_faces","looking_away","looking_down","camera_blocked"]';
