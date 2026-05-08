CREATE TABLE public.credential_delivery_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID,
  admission_number TEXT,
  parent_mobile TEXT,
  method TEXT NOT NULL DEFAULT 'pending',
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_cred_log_student ON public.credential_delivery_log(student_id);
CREATE INDEX idx_cred_log_admission ON public.credential_delivery_log(admission_number);

ALTER TABLE public.credential_delivery_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select on credential_delivery_log"
  ON public.credential_delivery_log FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert on credential_delivery_log"
  ON public.credential_delivery_log FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update on credential_delivery_log"
  ON public.credential_delivery_log FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on credential_delivery_log"
  ON public.credential_delivery_log FOR DELETE TO public USING (true);