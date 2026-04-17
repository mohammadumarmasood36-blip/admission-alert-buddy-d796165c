-- Master list of subjects available per class
CREATE TABLE public.class_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name text NOT NULL,
  subject_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(class_name, subject_name)
);

ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select on class_subjects" ON public.class_subjects FOR SELECT USING (true);
CREATE POLICY "Allow all insert on class_subjects" ON public.class_subjects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on class_subjects" ON public.class_subjects FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on class_subjects" ON public.class_subjects FOR DELETE USING (true);

-- Mapping of student to subjects they take
CREATE TABLE public.student_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  subject_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(student_id, subject_name)
);

CREATE INDEX idx_student_subjects_student ON public.student_subjects(student_id);

ALTER TABLE public.student_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select on student_subjects" ON public.student_subjects FOR SELECT USING (true);
CREATE POLICY "Allow all insert on student_subjects" ON public.student_subjects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on student_subjects" ON public.student_subjects FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on student_subjects" ON public.student_subjects FOR DELETE USING (true);