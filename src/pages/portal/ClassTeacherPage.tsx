import { useState, useEffect } from "react";
import DashboardLayout from "@/components/portal/DashboardLayout";
import { useSchool, ALL_CLASSES, ClassName } from "@/context/SchoolContext";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserCheck, Save } from "lucide-react";

interface Assignment {
  class_name: string;
  section_name: string;
  staff_id: string | null;
}

export default function ClassTeacherPage() {
  const { staff, classes } = useSchool();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const teachers = staff.filter((s) => s.role === "teacher");

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    setLoading(true);
    const { data } = await supabase.from("class_teacher_assignments").select("*");
    if (data) {
      setAssignments(data.map((r: any) => ({
        class_name: r.class_name,
        section_name: r.section_name,
        staff_id: r.staff_id,
      })));
    }
    setLoading(false);
  };

  const getAssignment = (className: string, section: string) =>
    assignments.find((a) => a.class_name === className && a.section_name === section)?.staff_id || "";

  const handleAssign = async (className: string, sectionName: string, staffId: string) => {
    const value = staffId === "none" ? null : staffId;
    try {
      // Upsert
      const { error } = await supabase.from("class_teacher_assignments").upsert(
        { class_name: className, section_name: sectionName, staff_id: value } as any,
        { onConflict: "class_name,section_name" }
      );
      if (error) throw error;
      setAssignments((prev) => {
        const existing = prev.findIndex((a) => a.class_name === className && a.section_name === sectionName);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { class_name: className, section_name: sectionName, staff_id: value };
          return updated;
        }
        return [...prev, { class_name: className, section_name: sectionName, staff_id: value }];
      });
      toast.success(`Class teacher ${value ? "assigned" : "removed"} for ${className} - ${sectionName}`);
    } catch {
      toast.error("Failed to assign class teacher");
    }
  };

  const classesWithSections = classes.filter((c) => c.sections.length > 0);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display">Class Teacher Assignments</h1>
        <p className="text-muted-foreground mt-1">Assign a class teacher to each section</p>
      </div>

      <div className="space-y-4">
        {classesWithSections.map((cls) => (
          <div key={cls.name} className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-bold font-display text-lg mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              Class {cls.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cls.sections.map((sec) => {
                const currentTeacher = getAssignment(cls.name, sec.name);
                return (
                  <div key={sec.id} className="flex items-center gap-3 bg-muted/30 border border-border rounded-lg p-3">
                    <span className="text-sm font-semibold min-w-[80px]">Section {sec.name}</span>
                    <Select value={currentTeacher || "none"} onValueChange={(v) => handleAssign(cls.name, sec.name, v)}>
                      <SelectTrigger className="flex-1 h-9 text-sm">
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— No teacher —</SelectItem>
                        {teachers.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {classesWithSections.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No classes with sections found. Add sections to classes first.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
