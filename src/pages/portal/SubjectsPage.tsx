import { useEffect, useState } from "react";
import DashboardLayout from "@/components/portal/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { ALL_CLASSES, ClassName } from "@/context/SchoolContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ClassSubject {
  id: string;
  class_name: string;
  subject_name: string;
}

export default function SubjectsPage() {
  const { user } = useAuth();
  const canManage = user?.role === "principal" || user?.role === "manager" || user?.role === "cashier";
  const [subjects, setSubjects] = useState<ClassSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassName>("9th");
  const [newSubject, setNewSubject] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("class_subjects").select("*").order("subject_name");
    setSubjects((data as ClassSubject[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    const name = newSubject.trim();
    if (!name) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("class_subjects")
      .insert({ class_name: selectedClass, subject_name: name })
      .select()
      .single();
    setSaving(false);
    if (error) {
      if (error.code === "23505") {
        toast.error("This subject already exists for this class");
      } else {
        toast.error("Failed to add subject");
      }
      return;
    }
    if (data) setSubjects((prev) => [...prev, data as ClassSubject]);
    setNewSubject("");
    toast.success(`${name} added to Class ${selectedClass}`);
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}"? Students currently studying this subject will keep their selection until edited.`)) return;
    const { error } = await supabase.from("class_subjects").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove subject");
      return;
    }
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    toast.success("Subject removed");
  };

  const subjectsByClass = (cls: string) => subjects.filter((s) => s.class_name === cls);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display">Subjects</h1>
            <p className="text-muted-foreground text-sm">Manage available subjects per class</p>
          </div>
        </div>
      </div>

      {canManage && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h2 className="font-semibold mb-3">Add New Subject</h2>
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr_auto] gap-3">
            <div>
              <Label className="text-xs">Class</Label>
              <Select value={selectedClass} onValueChange={(v) => setSelectedClass(v as ClassName)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {ALL_CLASSES.map((cls) => (
                    <SelectItem key={cls} value={cls}>Class {cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Subject Name</Label>
              <Input
                placeholder="e.g. Mathematics"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAdd} disabled={saving || !newSubject.trim()} className="gap-2 w-full sm:w-auto">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_CLASSES.map((cls) => {
          const list = subjectsByClass(cls);
          return (
            <div key={cls} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold font-display">Class {cls}</h3>
                <Badge variant="secondary">{list.length}</Badge>
              </div>
              {list.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No subjects added</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {list.map((s) => (
                    <div key={s.id} className="flex items-center gap-1 bg-muted rounded-full px-2.5 py-1 text-xs">
                      <span>{s.subject_name}</span>
                      {canManage && (
                        <button
                          onClick={() => handleRemove(s.id, s.subject_name)}
                          className="text-destructive hover:text-destructive/80 ml-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
