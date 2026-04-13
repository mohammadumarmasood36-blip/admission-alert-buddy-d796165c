
ALTER TABLE public.exam_results
  ADD CONSTRAINT exam_results_unique_per_student_subject
  UNIQUE (examination_id, admission_no, subject);
