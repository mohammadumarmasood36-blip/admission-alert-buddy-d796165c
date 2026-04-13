
-- Add missing columns to exam_schedules
ALTER TABLE public.exam_schedules ADD COLUMN room TEXT;
ALTER TABLE public.exam_schedules ADD COLUMN class TEXT;

-- Add missing columns to exam_results
ALTER TABLE public.exam_results ADD COLUMN student_name TEXT;
ALTER TABLE public.exam_results ADD COLUMN admission_no TEXT;
ALTER TABLE public.exam_results RENAME COLUMN marks TO marks_obtained;
