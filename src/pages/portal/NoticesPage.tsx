import { useState, useEffect } from "react";
import DashboardLayout from "@/components/portal/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useSchool } from "@/context/SchoolContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Bell, Megaphone, Trash2, Pencil } from "lucide-react";

export default function NoticesPage() {
  const { user } = useAuth();
  const { students, classes, staff } = useSchool();
  const [notices, setNotices] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetType, setTargetType] = useState("all");
  const [targetClasses, setTargetClasses] = useState<string[]>([]);
  const [editingNotice, setEditingNotice] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("notices").select("*").order("created_at", { ascending: false });
      if (data) setNotices(data);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) { toast.error("Fill title and content"); return; }
    const targetValues = targetType === "class" && targetClasses.length > 0 ? targetClasses : [];

    if (editingNotice) {
      const { error } = await supabase.from("notices").update({
        title: title.trim(),
        content: content.trim(),
        target_type: targetType,
        target_values: targetValues,
      }).eq("id", editingNotice.id);
      if (error) { toast.error("Failed to update notice"); return; }
      setNotices((prev) => prev.map((n) => n.id === editingNotice.id ? { ...n, title: title.trim(), content: content.trim(), target_type: targetType, target_values: targetValues } : n));
      toast.success("Notice updated!");
    } else {
      const { data, error } = await supabase.from("notices").insert({
        title: title.trim(),
        content: content.trim(),
        created_by: user?.id,
        target_type: targetType,
        target_values: targetValues,
      } as any).select().single();
      if (error) { toast.error("Failed to create notice"); return; }
      if (data) {
        setNotices((prev) => [data, ...prev]);
        const targetStudentIds = targetType === "all"
          ? students.map((s) => s.id)
          : students.filter((s) => targetValues.includes(s.className)).map((s) => s.id);
        if (targetStudentIds.length > 0) {
          supabase.functions.invoke("send-push", {
            body: { student_ids: targetStudentIds, title: "📢 " + title.trim(), body: content.trim().substring(0, 200) },
          });
        }
      }
      toast.success("Notice created!");
    }

    setTitle(""); setContent(""); setTargetType("all"); setTargetClasses([]); setOpen(false); setEditingNotice(null);
  };

  const handleEdit = (notice: any) => {
    setEditingNotice(notice);
    setTitle(notice.title);
    setContent(notice.content);
    setTargetType(notice.target_type || "all");
    setTargetClasses(notice.target_values || []);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notice?")) return;
    await supabase.from("notices").delete().eq("id", id);
    setNotices((prev) => prev.filter((n) => n.id !== id));
    toast.success("Notice deleted");
  };

  const getCreatorName = (id: string) => {
    const s = staff.find((st) => st.id === id);
    return s?.name || "Unknown";
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-primary" /> Notices
          </h1>
          <p className="text-muted-foreground mt-1">Create and manage notices for students</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditingNotice(null); setTitle(""); setContent(""); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => { setEditingNotice(null); setTitle(""); setContent(""); setTargetType("all"); setTargetClasses([]); }}><Plus className="w-4 h-4" /> New Notice</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingNotice ? "Edit Notice" : "Create Notice"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notice title" className="mt-1" /></div>
              <div><Label>Content</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Notice content..." className="mt-1" rows={4} /></div>
              <div>
                <Label>Target</Label>
                <Select value={targetType} onValueChange={setTargetType}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="class">Specific Class</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {targetType === "class" && (
                <div>
                  <Label>Select Classes (click to toggle)</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {classes.filter((c) => c.sections.length > 0).map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setTargetClasses((prev) => prev.includes(c.name) ? prev.filter((x) => x !== c.name) : [...prev, c.name])}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${targetClasses.includes(c.name) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-muted/80"}`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                  {targetClasses.length > 0 && <p className="text-xs text-muted-foreground mt-1">Selected: {targetClasses.join(", ")}</p>}
                </div>
              )}
              <Button onClick={handleSave} className="w-full">{editingNotice ? "Update Notice" : "Publish Notice"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {notices.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No notices yet.</p>
          </div>
        ) : notices.map((notice, i) => (
          <Card key={notice.id} className="animate-fade-in hover:shadow-lg transition-all" style={{ animationDelay: `${i * 60}ms` }}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{notice.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    By {getCreatorName(notice.created_by)} • {new Date(notice.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {notice.target_type === "all" ? "All Students" : `Class ${(notice.target_values || []).join(", ")}`}
                  </Badge>
                  {(notice.created_by === user?.id || user?.role === "principal" || user?.role === "manager") && (
                    <>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(notice)}>
                        <Pencil className="w-3.5 h-3.5 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(notice.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notice.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
