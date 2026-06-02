
-- 1) Prevent profile field tampering. Users can change their own name/mobile
--    but never their identity-linkage columns (student_id, staff_id, user_id).
DROP POLICY IF EXISTS "Profiles: self can update" ON public.profiles;

CREATE POLICY "Profiles: self can update name/mobile only"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND student_id IS NOT DISTINCT FROM (SELECT student_id FROM public.profiles WHERE user_id = auth.uid())
    AND staff_id   IS NOT DISTINCT FROM (SELECT staff_id   FROM public.profiles WHERE user_id = auth.uid())
    AND admission_number IS NOT DISTINCT FROM (SELECT admission_number FROM public.profiles WHERE user_id = auth.uid())
  );

-- 2) exam_seating_plans: staff only
DROP POLICY IF EXISTS "exam_seating_plans read auth" ON public.exam_seating_plans;
CREATE POLICY "exam_seating_plans staff read"
  ON public.exam_seating_plans FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- 3) credential_delivery_log: admin only
DROP POLICY IF EXISTS "credential_delivery_log staff all" ON public.credential_delivery_log;
CREATE POLICY "credential_delivery_log admin all"
  ON public.credential_delivery_log FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 4) Realtime channels: signed-in users can only subscribe to topics whose
--    namespace they own (own student-id or staff-id). For broadcast/presence
--    channels we restrict by topic prefix matching the user's identity.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read scoped realtime topics"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    -- Allow staff to subscribe to any topic
    public.is_staff(auth.uid())
    -- Or parent subscribing to their own student channel
    OR topic = ('student:' || public.current_student_id()::text)
    -- Or postgres_changes topics (those are independently RLS-checked at row level)
    OR topic LIKE 'realtime:%'
  );

CREATE POLICY "Authenticated can broadcast to own topics"
  ON realtime.messages FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff(auth.uid())
    OR topic = ('student:' || public.current_student_id()::text)
  );
