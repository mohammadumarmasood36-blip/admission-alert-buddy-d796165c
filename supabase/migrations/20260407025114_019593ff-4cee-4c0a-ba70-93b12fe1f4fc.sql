
-- app_settings table
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Public write access" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- staff table
CREATE TABLE public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "Full Name" TEXT NOT NULL,
  "Role" TEXT NOT NULL,
  "Mobile number" BIGINT,
  "Monthly Salary" NUMERIC,
  salary_paid BOOLEAN DEFAULT false,
  join_date TEXT,
  "Photo" TEXT,
  "Resume" TEXT,
  "Login Password" TEXT,
  teaching_classes TEXT[] DEFAULT '{}'
);
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access staff" ON public.staff FOR ALL USING (true) WITH CHECK (true);

-- sections table
CREATE TABLE public.sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_name TEXT NOT NULL,
  name TEXT NOT NULL
);
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access sections" ON public.sections FOR ALL USING (true) WITH CHECK (true);

-- students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admission_number TEXT NOT NULL,
  name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT '',
  fee_amount NUMERIC NOT NULL DEFAULT 0,
  fee_paid BOOLEAN DEFAULT false,
  enroll_date TEXT,
  installments TEXT[] DEFAULT '{}',
  payment_mode TEXT,
  parent_name TEXT,
  parent_mobile TEXT,
  parent_password TEXT,
  roll_number INTEGER,
  photo_file TEXT,
  father_name TEXT,
  father_mobile TEXT,
  father_email TEXT,
  mother_name TEXT,
  mother_mobile TEXT,
  mother_email TEXT,
  address TEXT,
  transport_facility BOOLEAN DEFAULT false,
  pickup_location TEXT,
  bus_number TEXT
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access students" ON public.students FOR ALL USING (true) WITH CHECK (true);

-- fee_payments table
CREATE TABLE public.fee_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id),
  student_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  section TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_date TEXT,
  payment_mode TEXT,
  cashier_name TEXT
);
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access fee_payments" ON public.fee_payments FOR ALL USING (true) WITH CHECK (true);

-- examinations table
CREATE TABLE public.examinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'unit_test',
  start_date TEXT NOT NULL,
  classes TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'upcoming',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access examinations" ON public.examinations FOR ALL USING (true) WITH CHECK (true);

-- exam_schedules table
CREATE TABLE public.exam_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room TEXT,
  class TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access exam_schedules" ON public.exam_schedules FOR ALL USING (true) WITH CHECK (true);

-- exam_seating_plans table
CREATE TABLE public.exam_seating_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
  class TEXT NOT NULL,
  room TEXT NOT NULL,
  date TEXT NOT NULL,
  students TEXT[] DEFAULT '{}',
  capacity INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.exam_seating_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access exam_seating_plans" ON public.exam_seating_plans FOR ALL USING (true) WITH CHECK (true);

-- exam_results table
CREATE TABLE public.exam_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  admission_no TEXT NOT NULL,
  subject TEXT NOT NULL,
  marks_obtained NUMERIC NOT NULL,
  max_marks NUMERIC NOT NULL,
  grade TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access exam_results" ON public.exam_results FOR ALL USING (true) WITH CHECK (true);

-- exam_room_configs table
CREATE TABLE public.exam_room_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  benches_per_row INTEGER NOT NULL DEFAULT 1,
  num_rows INTEGER NOT NULL DEFAULT 1,
  bench_capacity INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.exam_room_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access exam_room_configs" ON public.exam_room_configs FOR ALL USING (true) WITH CHECK (true);

-- update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_examinations_updated_at
  BEFORE UPDATE ON public.examinations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
