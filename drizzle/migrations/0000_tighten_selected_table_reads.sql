DROP POLICY IF EXISTS "exam_room_configs read auth" ON public.exam_room_configs;
CREATE POLICY "exam_room_configs staff read" ON public.exam_room_configs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "examinations read auth" ON public.examinations;
CREATE POLICY "examinations scoped read" ON public.examinations FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.parent_user_id = auth.uid()
      AND s.class_name = ANY (
        SELECT jsonb_array_elements_text(COALESCE(public.examinations.classes, '[]'::jsonb))
      )
  )
);

DROP POLICY IF EXISTS "exam_schedules read auth" ON public.exam_schedules;
CREATE POLICY "exam_schedules scoped read" ON public.exam_schedules FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.parent_user_id = auth.uid()
      AND s.class_name = public.exam_schedules.class
  )
);

DROP POLICY IF EXISTS "class_teacher_assignments read auth" ON public.class_teacher_assignments;
CREATE POLICY "class_teacher_assignments scoped read" ON public.class_teacher_assignments FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid())
  OR staff_id = public.current_staff_id()
);

DROP POLICY IF EXISTS "subject_assignments read auth" ON public.subject_assignments;
CREATE POLICY "subject_assignments scoped read" ON public.subject_assignments FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid())
  OR staff_id = public.current_staff_id()
);

DROP POLICY IF EXISTS "sections read auth" ON public.sections;
CREATE POLICY "sections staff read" ON public.sections FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "class_subjects read auth" ON public.class_subjects;
CREATE POLICY "class_subjects staff read" ON public.class_subjects FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "class_fee_defaults read auth" ON public.class_fee_defaults;
CREATE POLICY "class_fee_defaults staff read" ON public.class_fee_defaults FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));