import { useState, useEffect } from "react";
import DashboardLayout from "@/components/portal/DashboardLayout";
import { useSchool, ALL_CLASSES, ClassName } from "@/context/SchoolContext";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BookOpen, Plus, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SubjectAssignment {
  id: string;
  staff_id: string;
  class_name: string;
  section_name: string;
  subject: string;
}

export default function SubjectAssignmentPage() {
  const { staff, classes } = useSchool();
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [subject, setSubject] = useState("");

  const teachers = staff.filter((s) => s.role === "teacher");
  const selectedClassData = classes.find((c) => c.name === selectedClass);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    setLoading(true);
    const { data } = await supabase.from("subject_assignments").select("*");
    if (data) setAssignments(data as SubjectAssignment[]);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!selectedClass || !selectedSection || !selectedTeacher || !subject.trim()) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      const { data, error } = await supabase.from("subject_assignments").upsert(
        { class_name: selectedClass, section_name: selectedSection, subject: subject.trim(), staff_id: selectedTeacher } as any,
        { onConflict: "class_name,section_name,subject" }
      ).select().single();
      if (error) throw error;
      if (data) {
        setAssignments((prev) => {
          const existing = prev.findIndex((a) => a.class_name === selectedClass && a.section_name === selectedSection && a.subject === subject.trim());
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = data as SubjectAssignment;
            return updated;
          }
          return [...prev, data as SubjectAssignment];
        });
      }
      toast.success(`${subject.trim()} assigned to ${teachers.find(t => t.id === selectedTeacher)?.name}`);
      setSubject("");
    } catch {
      toast.error("Failed to assign subject");
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await supabase.from("subject_assignments").delete().eq("id", id);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      toast.success("Assignment removed");
    } catch {
      toast.error("Failed to remove");
    }
  };

  const classesWithSections = classes.filter((c) => c.sections.length > 0);

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display">Subject-Teacher Assignments</h1>
        <p className="text-muted-foreground mt-1">Assign which teacher teaches which subject in each class & section</p>
      </div>

      {/* Add assignment form */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-8 animate-fade-in">
        <h2 className="font-bold font-display text-lg mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" /> Assign Subject
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div>
            <Label className="text-xs">Class</Label>
            <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedSection(""); }}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>
                {ALL_CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Section</Label>
            <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Section" /></SelectTrigger>
              <SelectContent>
                {selectedClassData?.sections.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Subject</Label>
            <Input placeholder="e.g. Mathematics" value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Teacher</Label>
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Teacher" /></SelectTrigger>
              <SelectContent>
                {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} className="gap-2"><Plus className="w-4 h-4" /> Assign</Button>
        </div>
      </div>

      {/* Assignments by class */}
      <div className="space-y-4">
        {classesWithSections.map((cls) => {
          const clsAssignments = assignments.filter((a) => a.class_name === cls.name);
          if (clsAssignments.length === 0) return null;
          return (
            <div key={cls.name} className="bg-card border border-border rounded-2xl p-5 animate-fade-in">
              <h3 className="font-bold font-display text-lg mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> Class {cls.name}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground uppercase border-b border-border">
                      <th className="text-left py-2 px-3">Section</th>
                      <th className="text-left py-2 px-3">Subject</th>
                      <th className="text-left py-2 px-3">Teacher</th>
                      <th className="text-center py-2 px-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clsAssignments.map((a) => (
                      <tr key={a.id} className="border-b border-border/50">
                        <td className="py-2.5 px-3"><Badge variant="outline">{a.section_name}</Badge></td>
                        <td className="py-2.5 px-3 font-medium">{a.subject}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{teachers.find(t => t.id === a.staff_id)?.name || "Unknown"}</td>
                        <td className="py-2.5 px-3 text-center">
                          <Button variant="ghost" size="sm" className="text-destructive h-7 w-7 p-0" onClick={() => handleRemove(a.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
