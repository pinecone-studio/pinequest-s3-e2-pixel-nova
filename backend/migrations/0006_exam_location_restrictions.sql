ALTER TABLE exams ADD COLUMN location_policy TEXT NOT NULL DEFAULT 'anywhere';
ALTER TABLE exams ADD COLUMN location_label TEXT;
ALTER TABLE exams ADD COLUMN location_latitude REAL;
ALTER TABLE exams ADD COLUMN location_longitude REAL;
ALTER TABLE exams ADD COLUMN allowed_radius_meters INTEGER NOT NULL DEFAULT 3000;

ALTER TABLE exam_sessions ADD COLUMN join_location_status TEXT NOT NULL DEFAULT 'not_checked';
ALTER TABLE exam_sessions ADD COLUMN join_distance_meters REAL;
ALTER TABLE exam_sessions ADD COLUMN join_latitude REAL;
ALTER TABLE exam_sessions ADD COLUMN join_longitude REAL;
ALTER TABLE exam_sessions ADD COLUMN join_location_checked_at TEXT;
