
-- 1. Helper: teacher assigned to a specific class+section
CREATE OR REPLACE FUNCTION public.is_assigned_class_teacher(_user_id uuid, _class text, _section text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.class_teacher_assignments cta
    JOIN public.profiles p ON p.staff_id = cta.staff_id
    WHERE p.user_id = _user_id
      AND cta.class_name = _class
      AND cta.section_name = _section
  )
$$;

-- 2. Helper: parent of a child in a given class+section
CREATE OR REPLACE FUNCTION public.parent_of_class_section(_user_id uuid, _class text, _section text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.parent_user_id = _user_id
      AND s.class_name = _class
      AND (_section IS NULL OR s.section IS NULL OR s.section = _section)
  )
$$;

-- 3. Tighten students INSERT: admins anywhere; teachers only their assigned section
DROP POLICY IF EXISTS "students staff insert" ON public.students;
CREATE POLICY "students insert scoped"
ON public.students FOR INSERT TO authenticated
WITH CHECK (
  is_admin(auth.uid())
  OR has_role(auth.uid(), 'cashier')
  OR is_assigned_class_teacher(auth.uid(), class_name, section)
);

-- Also tighten UPDATE/DELETE similarly so teachers can't move kids out of their class
DROP POLICY IF EXISTS "students staff update" ON public.students;
CREATE POLICY "students update scoped"
ON public.students FOR UPDATE TO authenticated
USING (
  is_admin(auth.uid())
  OR has_role(auth.uid(), 'cashier')
  OR is_assigned_class_teacher(auth.uid(), class_name, section)
)
WITH CHECK (
  is_admin(auth.uid())
  OR has_role(auth.uid(), 'cashier')
  OR is_assigned_class_teacher(auth.uid(), class_name, section)
);

DROP POLICY IF EXISTS "students staff delete" ON public.students;
CREATE POLICY "students delete scoped"
ON public.students FOR DELETE TO authenticated
USING (
  is_admin(auth.uid())
  OR is_assigned_class_teacher(auth.uid(), class_name, section)
);

-- 4. homework SELECT: staff everything; parents only their child's class+section
DROP POLICY IF EXISTS "homework read auth" ON public.homework;
CREATE POLICY "homework read scoped"
ON public.homework FOR SELECT TO authenticated
USING (
  is_staff(auth.uid())
  OR parent_of_class_section(auth.uid(), class_name, section_name)
);

-- 5. notices SELECT: staff everything; parents only when school-wide or targeted to their child
DROP POLICY IF EXISTS "notices read auth" ON public.notices;
CREATE POLICY "notices read scoped"
ON public.notices FOR SELECT TO authenticated
USING (
  is_staff(auth.uid())
  OR target_type IS NULL
  OR target_type = 'all'
  OR EXISTS (
    SELECT 1 FROM public.student_notices sn
    WHERE sn.notice_id = notices.id
      AND sn.student_id = current_student_id()
  )
);

-- 6. student_subjects SELECT: staff everything; parents only their own child
DROP POLICY IF EXISTS "student_subjects read auth" ON public.student_subjects;
CREATE POLICY "student_subjects read scoped"
ON public.student_subjects FOR SELECT TO authenticated
USING (
  is_staff(auth.uid())
  OR student_id = current_student_id()
);
