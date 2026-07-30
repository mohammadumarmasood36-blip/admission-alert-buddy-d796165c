-- 1. class_teacher_assignments: admin-only writes
DROP POLICY IF EXISTS "class_teacher_assignments staff insert" ON public.class_teacher_assignments;
DROP POLICY IF EXISTS "class_teacher_assignments staff update" ON public.class_teacher_assignments;
DROP POLICY IF EXISTS "class_teacher_assignments staff delete" ON public.class_teacher_assignments;

CREATE POLICY "class_teacher_assignments admin insert"
  ON public.class_teacher_assignments FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "class_teacher_assignments admin update"
  ON public.class_teacher_assignments FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "class_teacher_assignments admin delete"
  ON public.class_teacher_assignments FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- 2. credential_delivery_log: admin read-only from client; writes only via service role
DROP POLICY IF EXISTS "credential_delivery_log admin all" ON public.credential_delivery_log;

CREATE POLICY "credential_delivery_log admin select"
  ON public.credential_delivery_log FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

REVOKE INSERT, UPDATE, DELETE ON public.credential_delivery_log FROM authenticated;
GRANT SELECT ON public.credential_delivery_log TO authenticated;
REVOKE ALL ON public.credential_delivery_log FROM anon;
GRANT ALL ON public.credential_delivery_log TO service_role;

-- 3. realtime.messages: remove wildcard topic match
DROP POLICY IF EXISTS "Authenticated can read scoped realtime topics" ON realtime.messages;

CREATE POLICY "Authenticated can read scoped realtime topics"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    public.is_staff(auth.uid())
    OR topic = ('student:' || (public.current_student_id())::text)
  );

-- 4. Revoke anon EXECUTE on SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.is_assigned_class_teacher(uuid, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.parent_of_class_section(uuid, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_assigned_class_teacher(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.parent_of_class_section(uuid, text, text) TO authenticated, service_role;