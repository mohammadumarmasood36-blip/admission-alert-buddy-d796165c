
-- Staff table
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "Full Name" TEXT NOT NULL,
  "Role" TEXT NOT NULL,
  "Mobile number" TEXT,
  "Monthly Salary" NUMERIC DEFAULT 0,
  salary_paid BOOLEAN DEFAULT false,
  join_date DATE,
  "Photo" TEXT,
  "Resume" TEXT,
  "Login Password" TEXT,
  teaching_classes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_number TEXT UNIQUE,
  name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  section TEXT,
  fee_amount NUMERIC DEFAULT 0,
  fee_paid BOOLEAN DEFAULT false,
  enroll_date DATE,
  installments JSONB DEFAULT '[]'::jsonb,
  payment_mode TEXT DEFAULT 'cash',
  parent_name TEXT,
  parent_mobile TEXT,
  parent_password TEXT,
  roll_number TEXT,
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
  bus_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sections table
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fee payments table
CREATE TABLE public.fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  student_name TEXT,
  class_name TEXT,
  section TEXT,
  amount NUMERIC DEFAULT 0,
  payment_date DATE,
  payment_mode TEXT,
  cashier_name TEXT,
  quarter TEXT,
  session TEXT,
  receipt_number TEXT,
  cheque_bank TEXT,
  cheque_number TEXT,
  cheque_date DATE,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notices table
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  created_by UUID,
  target_type TEXT,
  target_values JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Student notices table
CREATE TABLE public.student_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID REFERENCES public.notices(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Homework table
CREATE TABLE public.homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  class_name TEXT,
  section_name TEXT,
  due_date DATE,
  assigned_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Examinations table
CREATE TABLE public.examinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  start_date DATE,
  classes JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'upcoming',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Exam seating plans
CREATE TABLE public.exam_seating_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id UUID REFERENCES public.examinations(id) ON DELETE CASCADE,
  class TEXT,
  room TEXT,
  date DATE,
  students JSONB,
  capacity INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Exam results
CREATE TABLE public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id UUID REFERENCES public.examinations(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject TEXT,
  marks NUMERIC,
  max_marks NUMERIC,
  grade TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Subject assignments
CREATE TABLE public.subject_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  section_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_name, section_name, subject)
);

-- Class teacher assignments
CREATE TABLE public.class_teacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name TEXT NOT NULL,
  section_name TEXT NOT NULL,
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_name, section_name)
);

-- Exam room configs
CREATE TABLE public.exam_room_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id UUID REFERENCES public.examinations(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  benches_per_row INTEGER DEFAULT 1,
  num_rows INTEGER DEFAULT 1,
  bench_capacity INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Class fee defaults
CREATE TABLE public.class_fee_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name TEXT UNIQUE NOT NULL,
  default_fee NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- App settings (key-value store)
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  class_name TEXT,
  section_name TEXT,
  date DATE NOT NULL,
  status TEXT DEFAULT 'present',
  session TEXT,
  marked_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
