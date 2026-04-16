
-- Create salary_payments table for monthly tracking
CREATE TABLE public.salary_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL,
  month text NOT NULL,
  year integer NOT NULL,
  amount numeric DEFAULT 0,
  paid boolean DEFAULT false,
  paid_date date,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(staff_id, month, year)
);

ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select on salary_payments" ON public.salary_payments FOR SELECT USING (true);
CREATE POLICY "Allow all insert on salary_payments" ON public.salary_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on salary_payments" ON public.salary_payments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on salary_payments" ON public.salary_payments FOR DELETE USING (true);

-- Add unique constraint on exam_results for proper upsert
CREATE UNIQUE INDEX IF NOT EXISTS exam_results_unique_exam_admission_subject 
ON public.exam_results (examination_id, admission_no, subject);
