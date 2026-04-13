
-- Attendance table for daily attendance
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'present',
  marked_by UUID REFERENCES public.staff(id),
  session TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, date, session)
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);

-- Subject-teacher assignments (principal assigns which teacher teaches which subject in which class/section)
CREATE TABLE public.subject_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  section_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_name, section_name, subject)
);
ALTER TABLE public.subject_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access subject_assignments" ON public.subject_assignments FOR ALL USING (true) WITH CHECK (true);

-- Class fee defaults (manager sets default fee per class)
CREATE TABLE public.class_fee_defaults (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_name TEXT NOT NULL UNIQUE,
  annual_fee NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.class_fee_defaults ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access class_fee_defaults" ON public.class_fee_defaults FOR ALL USING (true) WITH CHECK (true);

-- Add unique constraint on class_teacher_assignments for upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'class_teacher_assignments_class_section_unique'
  ) THEN
    ALTER TABLE public.class_teacher_assignments ADD CONSTRAINT class_teacher_assignments_class_section_unique UNIQUE (class_name, section_name);
  END IF;
END $$;
