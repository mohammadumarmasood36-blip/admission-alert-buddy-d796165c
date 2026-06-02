
-- Helper to look up the signed-in user's linked student_id (for parents)
CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT student_id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Helper: staff_id of the signed-in user
CREATE OR REPLACE FUNCTION public.current_staff_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT staff_id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Drop every "Allow all ..." policy on every table and replace.
-- Generic helper: revoke anon, grant authenticated.
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'app_settings','attendance','class_fee_defaults','class_subjects',
      'class_teacher_assignments','credential_delivery_log','exam_results',
      'exam_room_configs','exam_schedules','exam_seating_plans','examinations',
      'fee_payments','homework','notices','payment_intents','push_subscriptions',
      'salary_payments','sections','staff','student_notices','student_subjects',
      'students','subject_assignments'
    ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all delete on %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all insert on %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all select on %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all update on %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all access to %1$s" ON public.%1$I', t);
    EXECUTE format('REVOKE ALL ON public.%1$I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%1$I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%1$I TO service_role', t);
  END LOOP;
END $$;

-- ============================================================
-- app_settings: staff read, admin write
-- ============================================================
CREATE POLICY "app_settings staff read"  ON public.app_settings FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "app_settings admin write" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "app_settings admin update" ON public.app_settings FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "app_settings admin delete" ON public.app_settings FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- ============================================================
-- attendance: staff full, parent read own child
-- ============================================================
CREATE POLICY "attendance staff read"   ON public.attendance FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR student_id = public.current_student_id());
CREATE POLICY "attendance staff insert" ON public.attendance FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "attendance staff update" ON public.attendance FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "attendance staff delete" ON public.attendance FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- ============================================================
-- class_fee_defaults / sections / class_subjects / class_teacher_assignments
-- / subject_assignments: any authenticated user can read; only staff write
-- ============================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'class_fee_defaults','sections','class_subjects',
    'class_teacher_assignments','subject_assignments','student_subjects'
  ]) LOOP
    EXECUTE format($f$CREATE POLICY "%1$s read auth" ON public.%1$I FOR SELECT TO authenticated USING (true)$f$, t);
    EXECUTE format($f$CREATE POLICY "%1$s staff insert" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()))$f$, t);
    EXECUTE format($f$CREATE POLICY "%1$s staff update" ON public.%1$I FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()))$f$, t);
    EXECUTE format($f$CREATE POLICY "%1$s staff delete" ON public.%1$I FOR DELETE TO authenticated USING (public.is_staff(auth.uid()))$f$, t);
  END LOOP;
END $$;

-- ============================================================
-- credential_delivery_log: staff only
-- ============================================================
CREATE POLICY "credential_delivery_log staff all" ON public.credential_delivery_log FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============================================================
-- exam_results: staff full, parent read own
-- ============================================================
CREATE POLICY "exam_results staff read"   ON public.exam_results FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR student_id = public.current_student_id());
CREATE POLICY "exam_results staff insert" ON public.exam_results FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "exam_results staff update" ON public.exam_results FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "exam_results staff delete" ON public.exam_results FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- ============================================================
-- exam_room_configs / exam_schedules / exam_seating_plans / examinations:
-- read for any authenticated; staff write
-- ============================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'exam_room_configs','exam_schedules','exam_seating_plans','examinations'
  ]) LOOP
    EXECUTE format($f$CREATE POLICY "%1$s read auth" ON public.%1$I FOR SELECT TO authenticated USING (true)$f$, t);
    EXECUTE format($f$CREATE POLICY "%1$s staff insert" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()))$f$, t);
    EXECUTE format($f$CREATE POLICY "%1$s staff update" ON public.%1$I FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()))$f$, t);
    EXECUTE format($f$CREATE POLICY "%1$s staff delete" ON public.%1$I FOR DELETE TO authenticated USING (public.is_staff(auth.uid()))$f$, t);
  END LOOP;
END $$;

-- ============================================================
-- fee_payments / payment_intents: staff full, parent read own
-- ============================================================
CREATE POLICY "fee_payments read"        ON public.fee_payments FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR student_id = public.current_student_id());
CREATE POLICY "fee_payments staff write" ON public.fee_payments FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "fee_payments staff update" ON public.fee_payments FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "fee_payments staff delete" ON public.fee_payments FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "payment_intents read"        ON public.payment_intents FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR student_id = public.current_student_id());
CREATE POLICY "payment_intents staff write" ON public.payment_intents FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "payment_intents staff update" ON public.payment_intents FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "payment_intents staff delete" ON public.payment_intents FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- ============================================================
-- homework: any authenticated read, staff write
-- ============================================================
CREATE POLICY "homework read auth"   ON public.homework FOR SELECT TO authenticated USING (true);
CREATE POLICY "homework staff insert" ON public.homework FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "homework staff update" ON public.homework FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "homework staff delete" ON public.homework FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- ============================================================
-- notices: any authenticated read, staff write
-- ============================================================
CREATE POLICY "notices read auth"   ON public.notices FOR SELECT TO authenticated USING (true);
CREATE POLICY "notices staff insert" ON public.notices FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "notices staff update" ON public.notices FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "notices staff delete" ON public.notices FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- ============================================================
-- student_notices: staff full, parent read/update own
-- ============================================================
CREATE POLICY "student_notices read"    ON public.student_notices FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR student_id = public.current_student_id());
CREATE POLICY "student_notices update"  ON public.student_notices FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()) OR student_id = public.current_student_id()) WITH CHECK (public.is_staff(auth.uid()) OR student_id = public.current_student_id());
CREATE POLICY "student_notices insert"  ON public.student_notices FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "student_notices delete"  ON public.student_notices FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- ============================================================
-- push_subscriptions: owner only
-- ============================================================
CREATE POLICY "push_subscriptions owner read"   ON public.push_subscriptions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR student_id = public.current_student_id());
CREATE POLICY "push_subscriptions owner write"  ON public.push_subscriptions FOR INSERT TO authenticated WITH CHECK (student_id = public.current_student_id());
CREATE POLICY "push_subscriptions owner update" ON public.push_subscriptions FOR UPDATE TO authenticated USING (student_id = public.current_student_id()) WITH CHECK (student_id = public.current_student_id());
CREATE POLICY "push_subscriptions owner delete" ON public.push_subscriptions FOR DELETE TO authenticated USING (student_id = public.current_student_id());

-- ============================================================
-- salary_payments: admin only
-- ============================================================
CREATE POLICY "salary_payments admin read"   ON public.salary_payments FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "salary_payments admin insert" ON public.salary_payments FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "salary_payments admin update" ON public.salary_payments FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "salary_payments admin delete" ON public.salary_payments FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- ============================================================
-- staff: staff can read all (needed by sidebar/teacher list);
-- admin can write; a staff can update their own row
-- ============================================================
CREATE POLICY "staff staff read"    ON public.staff FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff admin insert"  ON public.staff FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "staff admin update"  ON public.staff FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()) OR id = public.current_staff_id()) WITH CHECK (public.is_admin(auth.uid()) OR id = public.current_staff_id());
CREATE POLICY "staff admin delete"  ON public.staff FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- ============================================================
-- students: staff full; parent read only their child
-- ============================================================
CREATE POLICY "students staff read"   ON public.students FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR id = public.current_student_id());
CREATE POLICY "students staff insert" ON public.students FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "students staff update" ON public.students FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "students staff delete" ON public.students FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
