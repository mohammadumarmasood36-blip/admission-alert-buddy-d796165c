CREATE TABLE public.class_teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name text NOT NULL,
  section_name text NOT NULL,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(class_name, section_name)
);

ALTER TABLE public.class_teacher_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access class_teacher_assignments" ON public.class_teacher_assignments
  FOR ALL TO public USING (true) WITH CHECK (true);