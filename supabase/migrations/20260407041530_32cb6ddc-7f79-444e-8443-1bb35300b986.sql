ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS quarter text;
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS session text;
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS receipt_number text;
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS cheque_bank text;
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS cheque_number text;
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS cheque_date text;