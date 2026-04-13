
-- Notices table
CREATE TABLE public.notices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  created_by uuid NOT NULL,
  target_type text NOT NULL DEFAULT 'all',
  target_values text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access notices" ON public.notices FOR ALL USING (true) WITH CHECK (true);

-- Homework table
CREATE TABLE public.homework (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  subject text NOT NULL,
  class_name text NOT NULL,
  section_name text NOT NULL,
  due_date text,
  assigned_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access homework" ON public.homework FOR ALL USING (true) WITH CHECK (true);

-- Student notices junction for individual targeting
CREATE TABLE public.student_notices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notice_id uuid NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.student_notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access student_notices" ON public.student_notices FOR ALL USING (true) WITH CHECK (true);
