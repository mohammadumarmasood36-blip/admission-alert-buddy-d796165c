-- Server-issued payment intents for UPI fee payments.
-- Each intent locks (student, quarters, amount, session) to a unique `tr`
-- reference embedded in the UPI QR. Verification compares the claimed
-- amount against expected_amount before marking fees paid.

CREATE TABLE public.payment_intents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tr TEXT NOT NULL UNIQUE,
  student_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  section TEXT,
  quarters JSONB NOT NULL DEFAULT '[]'::jsonb,
  session TEXT,
  expected_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | used | cancelled
  cashier_id UUID,
  cashier_name TEXT,
  transaction_id TEXT,
  receipt_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

CREATE INDEX idx_payment_intents_tr ON public.payment_intents(tr);
CREATE INDEX idx_payment_intents_student ON public.payment_intents(student_id);

ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

-- Permissive policies (matches the project-wide custom-auth permissive RLS mode);
-- the real validation happens inside edge functions using the service role.
CREATE POLICY "Allow all select on payment_intents"
  ON public.payment_intents FOR SELECT USING (true);
CREATE POLICY "Allow all insert on payment_intents"
  ON public.payment_intents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on payment_intents"
  ON public.payment_intents FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on payment_intents"
  ON public.payment_intents FOR DELETE USING (true);