import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSchool } from "@/context/SchoolContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, GraduationCap, BookOpen, Users, CheckCircle, XCircle, BarChart3, Eye, Star, ClipboardList, Save, Loader2, Bell, School, Megaphone, PenLine, Trash2, Pencil } from "lucide-react";
import ChangePassword from "@/components/portal/ChangePassword";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function TeacherDashboard() {
  const { user, logout, session } = useAuth();
  const { staff, students, classes } = useSchool();
  const navigate = useNavigate();

  const teacher = staff.find((s) => s.id === user?.id);
  const [classTeacherAssignments, setClassTeacherAssignments] = useState<any[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [viewTab, setViewTab] = useState<string>("classes");
  const [examinations, setExaminations] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [resultClass, setResultClass] = useState("");
  const [resultSection, setResultSection] = useState("");
  const [resultSubject, setResultSubject] = useState("");
  const [resultEntries, setResultEntries] = useState<Record<string, { marks: string; max: string }>>({});
  const [savingResults, setSavingResults] = useState(false);
  const [examResults, setExamResults] = useState<any[]>([]);
  // Homework
  const [hwOpen, setHwOpen] = useState(false);
  const [hwTitle, setHwTitle] = useState("");
  const [hwDesc, setHwDesc] = useState("");
  const [hwSubject, setHwSubject] = useState("");
  const [hwClasses, setHwClasses] = useState<string[]>([]);
  const [hwDue, setHwDue] = useState("");
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  // Notices
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeTarget, setNoticeTarget] = useState("all");
  const [noticeClasses, setNoticeClasses] = useState<string[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  // Notice edit
  const [editingNotice, setEditingNotice] = useState<any>(null);
  // Results lock
  const [resultsEditMode, setResultsEditMode] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [ctRes, saRes, attRes, examRes, noticeRes, erRes, hwRes] = await Promise.all([
        supabase.from("class_teacher_assignments").select("*"),
        supabase.from("subject_assignments").select("*"),
        supabase.from("attendance").select("*").eq("session", session),
        supabase.from("examinations").select("*"),
        supabase.from("notices").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("exam_results").select("*"),
        supabase.from("homework").select("*").order("created_at", { ascending: false }),
      ]);
      if (ctRes.data) setClassTeacherAssignments(ctRes.data);
      if (saRes.data) setSubjectAssignments(saRes.data);
      if (attRes.data) setAttendance(attRes.data);
      if (examRes.data) setExaminations(examRes.data);
      if (noticeRes.data) setNotices(noticeRes.data);
      if (erRes.data) setExamResults(erRes.data);
      if (hwRes.data) setHomeworkList(hwRes.data);
    };
    load();
  }, [session]);

  const myClassTeacherSections = useMemo(() =>
    classTeacherAssignments.filter((a) => a.staff_id === user?.id), [classTeacherAssignments, user?.id]);

  const mySubjectAssignments = useMemo(() =>
    subjectAssignments.filter((a) => a.staff_id === user?.id), [subjectAssignments, user?.id]);

  const myClasses = useMemo(() => {
    const set = new Set<string>();
    myClassTeacherSections.forEach((a) => set.add(`${a.class_name}|${a.section_name}`));
    mySubjectAssignments.forEach((a) => set.add(`${a.class_name}|${a.section_name}`));
    return Array.from(set).map((s) => { const [cls, sec] = s.split("|"); return { className: cls, section: sec }; });
  }, [myClassTeacherSections, mySubjectAssignments]);

  const sortedClasses = useMemo(() => {
    const ct = myClasses.filter((c) => myClassTeacherSections.some((a) => a.class_name === c.className && a.section_name === c.section));
    const other = myClasses.filter((c) => !myClassTeacherSections.some((a) => a.class_name === c.className && a.section_name === c.section));
    return [...ct, ...other];
  }, [myClasses, myClassTeacherSections]);

  const isClassTeacher = (cls: string, sec: string) =>
    myClassTeacherSections.some((a) => a.class_name === cls && a.section_name === sec);

  const sectionStudents = useMemo(() => {
    if (!selectedClass || !selectedSection) return [];
    return students.filter((s) => s.className === selectedClass && s.section === selectedSection).sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedClass, selectedSection, students]);

  // Default all students to ABSENT
  useEffect(() => {
    if (!selectedClass || !selectedSection) return;
    const map: Record<string, string> = {};
    sectionStudents.forEach((s) => {
      const rec = attendance.find((a) => a.student_id === s.id && a.date === attendanceDate);
      map[s.id] = rec?.status || "absent";
    });
    setAttendanceMap(map);
  }, [selectedClass, selectedSection, attendanceDate, sectionStudents, attendance]);

  // ★ Load existing marks when switching to a result entry view & lock editing by default
  useEffect(() => {
    if (!selectedExam || !resultClass || !resultSection || !resultSubject) return;
    const sectionStuds = students.filter((s) => s.className === resultClass && s.section === resultSection);
    const entries: Record<string, { marks: string; max: string }> = {};
    let hasExisting = false;
    sectionStuds.forEach((s) => {
      const existing = examResults.find(
        (r) => r.examination_id === selectedExam.id && r.admission_no === s.admissionNumber && r.subject === resultSubject
      );
      if (existing) {
        entries[s.id] = { marks: String(existing.marks_obtained), max: String(existing.max_marks) };
        hasExisting = true;
      }
    });
    setResultEntries(entries);
    setResultsEditMode(!hasExisting); // If marks already exist, lock them
  }, [selectedExam, resultClass, resultSection, resultSubject, examResults, students]);

  const handleSaveAttendance = async () => {
    setSavingAttendance(true);
    try {
      for (const student of sectionStudents) {
        const status = attendanceMap[student.id] || "absent";
        await supabase.from("attendance").upsert(
          { student_id: student.id, date: attendanceDate, status, marked_by: user?.id, session } as any,
          { onConflict: "student_id,date,session" }
        );
      }
      const { data } = await supabase.from("attendance").select("*").eq("session", session);
      if (data) setAttendance(data);
      // Send push notifications to parents
      const studentIds = sectionStudents.map((s) => s.id);
      if (studentIds.length > 0) {
        supabase.functions.invoke("send-push", {
          body: { student_ids: studentIds, title: "📋 Attendance Updated", body: `Attendance for ${attendanceDate} has been marked for ${selectedClass} - ${selectedSection}.` },
        });
      }
      toast.success("Attendance saved!");
    } catch { toast.error("Failed to save attendance"); }
    setSavingAttendance(false);
  };

  const getStudentAttendance = (studentId: string) => {
    const records = attendance.filter((a) => a.student_id === studentId);
    const total = records.length;
    const present = records.filter((a) => a.status === "present").length;
    return { total, present, absent: total - present, percent: total > 0 ? Math.round((present / total) * 100) : 0 };
  };

  const getMySubjects = (cls: string, sec: string) =>
    mySubjectAssignments.filter((a) => a.class_name === cls && a.section_name === sec).map((a) => a.subject);

  const handleSaveResults = async () => {
    if (!selectedExam || !resultClass || !resultSection || !resultSubject) return;
    setSavingResults(true);
    try {
      const studentsInSection = students.filter((s) => s.className === resultClass && s.section === resultSection);
      const upsertRows: any[] = [];
      for (const student of studentsInSection) {
        const entry = resultEntries[student.id];
        if (!entry?.marks || !entry?.max) continue;
        const marks = Number(entry.marks);
        const max = Number(entry.max);
        const percent = (marks / max) * 100;
        const grade = percent >= 90 ? "A+" : percent >= 80 ? "A" : percent >= 70 ? "B+" : percent >= 60 ? "B" : percent >= 50 ? "C" : percent >= 40 ? "D" : "F";
        upsertRows.push({
          examination_id: selectedExam.id,
          admission_no: student.admissionNumber,
          student_name: student.name,
          subject: resultSubject,
          marks_obtained: marks,
          max_marks: max,
          grade,
        });
      }
      if (upsertRows.length > 0) {
        const { error } = await supabase.from("exam_results").upsert(upsertRows as any, {
          onConflict: "examination_id,admission_no,subject",
        });
        if (error) throw error;
      }
      // Refresh results
      const { data: erRes } = await supabase.from("exam_results").select("*");
      if (erRes) setExamResults(erRes);
      toast.success("Results saved!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save results");
    }
    setSavingResults(false);
  };

  const handleAddHomework = async () => {
    if (!hwTitle.trim() || !hwSubject || hwClasses.length === 0) { toast.error("Fill all fields"); return; }
    // Insert homework for each selected class|section
    const insertRows = hwClasses.map((cs) => {
      const [cls, sec] = cs.split("|");
      return {
        title: hwTitle.trim(), description: hwDesc, subject: hwSubject,
        class_name: cls, section_name: sec, due_date: hwDue || null, assigned_by: user?.id,
      };
    });
    const { data, error } = await supabase.from("homework").insert(insertRows as any).select();
    if (error) { toast.error("Failed"); return; }
    if (data) setHomeworkList((prev) => [...data, ...prev]);
    toast.success("Homework assigned!");
    setHwOpen(false); setHwTitle(""); setHwDesc(""); setHwDue(""); setHwClasses([]);
  };

  const handleDeleteHomework = async (id: string) => {
    await supabase.from("homework").delete().eq("id", id);
    setHomeworkList((prev) => prev.filter((h) => h.id !== id));
    toast.success("Homework deleted");
  };

  const handleAddNotice = async () => {
    if (!noticeTitle.trim() || !noticeContent.trim()) { toast.error("Fill title and content"); return; }
    const targetValues = noticeTarget === "class" && noticeClasses.length > 0 ? noticeClasses : [];
    if (editingNotice) {
      const { error } = await supabase.from("notices").update({
        title: noticeTitle.trim(), content: noticeContent.trim(),
        target_type: noticeTarget, target_values: targetValues,
      }).eq("id", editingNotice.id);
      if (error) { toast.error("Failed"); return; }
      setNotices((prev) => prev.map((n) => n.id === editingNotice.id ? { ...n, title: noticeTitle.trim(), content: noticeContent.trim(), target_type: noticeTarget, target_values: targetValues } : n));
      toast.success("Notice updated!");
    } else {
      const { data, error } = await supabase.from("notices").insert({
        title: noticeTitle.trim(), content: noticeContent.trim(), created_by: user?.id,
        target_type: noticeTarget, target_values: targetValues,
      } as any).select().single();
      if (error) { toast.error("Failed"); return; }
      if (data) setNotices((prev) => [data, ...prev]);
      toast.success("Notice published!");
    }
    setNoticeOpen(false); setNoticeTitle(""); setNoticeContent(""); setEditingNotice(null); setNoticeClasses([]);
  };

  const handleEditNotice = (notice: any) => {
    setEditingNotice(notice);
    setNoticeTitle(notice.title);
    setNoticeContent(notice.content);
    setNoticeTarget(notice.target_type || "all");
    setNoticeClasses(notice.target_values || []);
    setNoticeOpen(true);
  };

  const handleDeleteNotice = async (id: string) => {
    await supabase.from("notices").delete().eq("id", id);
    setNotices((prev) => prev.filter((n) => n.id !== id));
    toast.success("Notice deleted");
  };

  const handleLogout = () => { logout(); navigate("/portal"); };

  // My homework (filtered to my assignments)
  const myHomework = useMemo(() => {
    return homeworkList.filter((h) =>
      mySubjectAssignments.some((a) => a.class_name === h.class_name && a.section_name === h.section_name && a.subject === h.subject)
    );
  }, [homeworkList, mySubjectAssignments]);

  if (!teacher) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Teacher data not found.</p></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <School className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold">Teacher Portal</h1>
            <p className="text-xs text-white/70">Welcome, {teacher.name}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 border-white/30 text-white hover:bg-white/10 bg-transparent">
          <LogOut className="w-4 h-4" /> Logout
        </Button>
      </header>

      <main className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        <Tabs value={viewTab} onValueChange={setViewTab}>
          <TabsList className="grid grid-cols-6 w-full max-w-2xl bg-white/80 shadow-sm">
            <TabsTrigger value="classes" className="text-xs">Classes</TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs">Attend.</TabsTrigger>
            <TabsTrigger value="results" className="text-xs">Results</TabsTrigger>
            <TabsTrigger value="homework" className="text-xs">HW</TabsTrigger>
            <TabsTrigger value="notices" className="text-xs">Notices</TabsTrigger>
            <TabsTrigger value="profile" className="text-xs">Profile</TabsTrigger>
          </TabsList>

          {/* MY CLASSES TAB */}
          <TabsContent value="classes" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedClasses.map(({ className: cls, section: sec }, i) => {
                const isCT = isClassTeacher(cls, sec);
                const subjects = getMySubjects(cls, sec);
                const studentCount = students.filter((s) => s.className === cls && s.section === sec).length;
                const gradients = ["from-rose-500 to-pink-500", "from-blue-500 to-cyan-500", "from-emerald-500 to-teal-500", "from-amber-500 to-orange-500", "from-violet-500 to-purple-500", "from-indigo-500 to-blue-500"];
                return (
                  <div key={`${cls}-${sec}`} className={`bg-gradient-to-br ${gradients[i % gradients.length]} text-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer animate-fade-in`} style={{ animationDelay: `${i * 80}ms` }}
                    onClick={() => { setSelectedClass(cls); setSelectedSection(sec); }}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold font-display text-lg">Class {cls}</h3>
                      {isCT && <Badge className="bg-white/20 text-white border-0 text-[10px]"><Star className="w-3 h-3 mr-1" /> Class Teacher</Badge>}
                    </div>
                    <p className="text-sm text-white/80">Section {sec}</p>
                    <p className="text-xs text-white/60 mt-1">{studentCount} students</p>
                    {subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {subjects.map((s) => <Badge key={s} className="bg-white/20 text-white border-0 text-[10px]">{s}</Badge>)}
                      </div>
                    )}
                  </div>
                );
              })}
              {sortedClasses.length === 0 && (
                <div className="col-span-full text-center py-16 text-muted-foreground"><BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No classes assigned yet.</p></div>
              )}
            </div>

            {/* Selected class student list */}
            {selectedClass && selectedSection && (
              <Card className="animate-fade-in bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Class {selectedClass} - {selectedSection} ({sectionStudents.length})</span>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedClass(null); setSelectedSection(null); }}>Close</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-xs text-muted-foreground uppercase border-b"><th className="text-left py-2 px-3">Roll</th><th className="text-left py-2 px-3">Name</th><th className="text-left py-2 px-3">Adm No.</th><th className="text-left py-2 px-3">Attendance</th><th className="text-center py-2 px-3">Details</th></tr></thead>
                      <tbody>
                        {sectionStudents.map((s, idx) => {
                          const att = getStudentAttendance(s.id);
                          return (
                            <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-bold">{s.rollNumber || idx + 1}</td>
                              <td className="py-2.5 px-3 font-medium">{s.name}</td>
                              <td className="py-2.5 px-3 text-muted-foreground">{s.admissionNumber}</td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${att.percent}%` }} /></div>
                                  <span className="text-xs text-muted-foreground">{att.percent}%</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center"><Button variant="ghost" size="sm" onClick={() => setSelectedStudent(s)} className="h-7"><Eye className="w-3.5 h-3.5" /></Button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ATTENDANCE TAB */}
          <TabsContent value="attendance" className="space-y-4 mt-4">
            {myClassTeacherSections.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground"><ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>You are not a class teacher for any section.</p></div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div><Label className="text-xs">Class & Section</Label>
                    <Select value={selectedClass && selectedSection ? `${selectedClass}|${selectedSection}` : ""} onValueChange={(v) => { const [c, s] = v.split("|"); setSelectedClass(c); setSelectedSection(s); }}>
                      <SelectTrigger className="w-[200px] mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{myClassTeacherSections.map((a) => <SelectItem key={`${a.class_name}-${a.section_name}`} value={`${a.class_name}|${a.section_name}`}>{a.class_name} - {a.section_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Date</Label><Input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="mt-1 w-[180px]" /></div>
                  <Button onClick={handleSaveAttendance} disabled={savingAttendance || !selectedClass} className="gap-2">
                    {savingAttendance ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                  </Button>
                </div>

                {selectedClass && selectedSection && (
                  <>
                    <div className="flex gap-4 text-sm">
                      <span className="text-emerald-600 font-medium">Present: {Object.values(attendanceMap).filter(v => v === "present").length}</span>
                      <span className="text-rose-600 font-medium">Absent: {Object.values(attendanceMap).filter(v => v === "absent").length}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">All students are <strong>absent</strong> by default. Tap to mark <strong>present</strong>.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {sectionStudents.map((s, idx) => (
                        <div key={s.id}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${attendanceMap[s.id] === "present" ? "bg-emerald-50 border-emerald-300" : "bg-rose-50 border-rose-300"}`}
                          onClick={() => setAttendanceMap((prev) => ({ ...prev, [s.id]: prev[s.id] === "present" ? "absent" : "present" }))}>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold w-6">{s.rollNumber || idx + 1}</span>
                            <span className="text-sm font-medium">{s.name}</span>
                          </div>
                          {attendanceMap[s.id] === "present" ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-500" />}
                        </div>
                      ))}
                    </div>

                    {/* Attendance graph */}
                    <Card className="bg-white/80 border-0 shadow-md">
                      <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Attendance Overview</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {sectionStudents.map((s) => {
                            const att = getStudentAttendance(s.id);
                            return (
                              <div key={s.id} className="flex items-center gap-3">
                                <span className="text-xs w-24 truncate">{s.name}</span>
                                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${att.percent >= 75 ? "bg-emerald-500" : att.percent >= 50 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${att.percent}%` }} /></div>
                                <span className="text-xs font-medium w-12 text-right">{att.percent}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </>
            )}
          </TabsContent>

          {/* RESULTS TAB */}
          <TabsContent value="results" className="space-y-4 mt-4">
            {mySubjectAssignments.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground"><ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No subjects assigned to you.</p></div>
            ) : !selectedExam ? (
              <>
                <h3 className="text-lg font-bold font-display">Select Examination</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {examinations.map((exam, i) => {
                    const gradients = ["from-violet-500 to-purple-500", "from-blue-500 to-cyan-500", "from-emerald-500 to-teal-500", "from-amber-500 to-orange-500", "from-rose-500 to-pink-500"];
                    return (
                      <div key={exam.id} className={`bg-gradient-to-br ${gradients[i % gradients.length]} text-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02] animate-fade-in`} style={{ animationDelay: `${i * 80}ms` }}
                        onClick={() => setSelectedExam(exam)}>
                        <h3 className="font-bold font-display text-lg">{exam.name}</h3>
                        <p className="text-sm text-white/80 mt-1">{exam.type.replace("_", " ")}</p>
                        <p className="text-xs text-white/60 mt-2">Classes: {exam.classes?.join(", ")}</p>
                        <Badge className="bg-white/20 text-white border-0 mt-3">{exam.status}</Badge>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold font-display">{selectedExam.name} — My Subjects</h3>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedExam(null); setResultClass(""); setResultSection(""); setResultSubject(""); }}>← Back</Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mySubjectAssignments.map((a, i) => {
                    const gradients = ["from-blue-500 to-indigo-500", "from-emerald-500 to-teal-500", "from-rose-500 to-pink-500", "from-amber-500 to-orange-500"];
                    return (
                      <div key={a.id} className={`bg-gradient-to-br ${gradients[i % gradients.length]} text-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02] animate-fade-in`} style={{ animationDelay: `${i * 80}ms` }}
                        onClick={() => { setResultClass(a.class_name); setResultSection(a.section_name); setResultSubject(a.subject); }}>
                        <BookOpen className="w-6 h-6 mb-2 text-white/80" />
                        <h3 className="font-bold text-lg">{a.subject}</h3>
                        <p className="text-sm text-white/80">{a.class_name} ({a.section_name})</p>
                      </div>
                    );
                  })}
                </div>

                {/* Marks entry table */}
                {resultClass && resultSection && resultSubject && (
                  <Card className="bg-white/80 border-0 shadow-lg animate-fade-in">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{resultSubject} — {resultClass} ({resultSection})</CardTitle>
                        {!resultsEditMode && (
                          <Button variant="outline" size="sm" onClick={() => setResultsEditMode(true)} className="gap-1">
                            <Pencil className="w-3 h-3" /> Edit Marks
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="text-xs text-muted-foreground uppercase border-b"><th className="text-left py-2 px-2">Roll</th><th className="text-left py-2 px-2">Student</th><th className="text-center py-2 px-2">Marks</th><th className="text-center py-2 px-2">Max</th></tr></thead>
                          <tbody>
                            {students.filter((s) => s.className === resultClass && s.section === resultSection).sort((a, b) => (a.rollNumber || 0) - (b.rollNumber || 0) || a.name.localeCompare(b.name)).map((s, idx) => (
                              <tr key={s.id} className="border-b border-border/50">
                                <td className="py-2 px-2 font-mono text-xs">{s.rollNumber || idx + 1}</td>
                                <td className="py-2 px-2 font-medium">{s.name}</td>
                                <td className="py-2 px-2"><Input type="number" className="h-8 w-20 text-center mx-auto" disabled={!resultsEditMode} value={resultEntries[s.id]?.marks || ""} onChange={(e) => setResultEntries((prev) => ({ ...prev, [s.id]: { ...prev[s.id], marks: e.target.value, max: prev[s.id]?.max || "100" } }))} /></td>
                                <td className="py-2 px-2"><Input type="number" className="h-8 w-20 text-center mx-auto" disabled={!resultsEditMode} value={resultEntries[s.id]?.max || "100"} onChange={(e) => setResultEntries((prev) => ({ ...prev, [s.id]: { ...prev[s.id], max: e.target.value, marks: prev[s.id]?.marks || "" } }))} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {resultsEditMode && (
                        <Button onClick={handleSaveResults} disabled={savingResults} className="w-full mt-4 gap-2">
                          {savingResults ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Results
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* HOMEWORK TAB — now shows list of assigned homework */}
          <TabsContent value="homework" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-display flex items-center gap-2"><PenLine className="w-5 h-5 text-primary" /> Homework</h3>
              <Button onClick={() => setHwOpen(true)} className="gap-2" size="sm"><BookOpen className="w-4 h-4" /> New Homework</Button>
            </div>

            {myHomework.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <PenLine className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No homework assigned yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myHomework.map((hw, i) => (
                  <Card key={hw.id} className="bg-white/80 border-0 shadow-md animate-fade-in hover:shadow-lg transition-all" style={{ animationDelay: `${i * 50}ms` }}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-sm">{hw.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px]">{hw.subject}</Badge>
                            <Badge variant="outline" className="text-[10px]">{hw.class_name} ({hw.section_name})</Badge>
                            {hw.due_date && <span className="text-[10px] text-muted-foreground">Due: {new Date(hw.due_date).toLocaleDateString("en-IN")}</span>}
                          </div>
                          {hw.description && <p className="text-xs text-muted-foreground mt-2">{hw.description}</p>}
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteHomework(hw.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2">{new Date(hw.created_at).toLocaleDateString("en-IN")}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* NOTICES TAB — with edit & delete */}
          <TabsContent value="notices" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-display flex items-center gap-2"><Megaphone className="w-5 h-5 text-primary" /> Notices</h3>
              <Button onClick={() => { setEditingNotice(null); setNoticeTitle(""); setNoticeContent(""); setNoticeTarget("all"); setNoticeClasses([]); setNoticeOpen(true); }} className="gap-2" size="sm"><Bell className="w-4 h-4" /> New Notice</Button>
            </div>
            {notices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground"><Bell className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No notices yet.</p></div>
            ) : notices.slice(0, 10).map((n, i) => (
              <Card key={n.id} className="bg-white/80 border-0 shadow-md animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-sm">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{n.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px]">{n.target_type === "all" ? "All Students" : `Class ${n.target_values?.[0] || ""}`}</Badge>
                        <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleDateString("en-IN")}</span>
                      </div>
                    </div>
                    {n.created_by === user?.id && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditNotice(n)}>
                          <Pencil className="w-3.5 h-3.5 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteNotice(n.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* PROFILE TAB */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            <Card className="bg-white/80 border-0 shadow-md">
              <CardHeader><CardTitle className="font-display">My Profile</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  {teacher.photoFile ? <img src={teacher.photoFile} alt={teacher.name} className="w-16 h-16 rounded-full object-cover" /> : <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">{teacher.name.charAt(0)}</div>}
                  <div><h3 className="text-lg font-bold">{teacher.name}</h3><p className="text-sm text-muted-foreground">Teacher • Joined {teacher.joinDate}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-muted-foreground text-xs">Salary</p><p className="font-medium">₹ {teacher.salary.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground text-xs">Status</p><p className={`font-medium ${teacher.salaryPaid ? "text-emerald-600" : "text-amber-600"}`}>{teacher.salaryPaid ? "Paid" : "Pending"}</p></div>
                </div>
              </CardContent>
            </Card>
            <ChangePassword userId={teacher.id} userType="staff" />
          </TabsContent>
        </Tabs>

        {/* Student Detail Dialog */}
        <Dialog open={!!selectedStudent} onOpenChange={(open) => { if (!open) setSelectedStudent(null); }}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display">Student Details</DialogTitle></DialogHeader>
            {selectedStudent && (() => {
              const att = getStudentAttendance(selectedStudent.id);
              const studentResults = examResults.filter((r) => r.admission_no === selectedStudent.admissionNumber);
              return (
                <div className="space-y-4 mt-2">
                  <div className="flex items-center gap-4">
                    {selectedStudent.photoFile ? <img src={selectedStudent.photoFile} alt="" className="w-16 h-16 rounded-full object-cover" /> : <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">{selectedStudent.name.charAt(0)}</div>}
                    <div>
                      <h3 className="text-lg font-bold">{selectedStudent.name}</h3>
                      <p className="text-sm text-muted-foreground">Class {selectedStudent.className} - Section {selectedStudent.section}</p>
                      <p className="text-xs text-muted-foreground">Adm. No: {selectedStudent.admissionNumber}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-muted-foreground">Father</p><p className="font-medium">{selectedStudent.fatherName || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Father Mobile</p><p className="font-medium">{selectedStudent.fatherMobile || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Mother</p><p className="font-medium">{selectedStudent.motherName || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Mother Mobile</p><p className="font-medium">{selectedStudent.motherMobile || "—"}</p></div>
                    <div className="col-span-2"><p className="text-xs text-muted-foreground">Address</p><p className="font-medium">{selectedStudent.address || "—"}</p></div>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4">
                    <h4 className="font-bold text-sm mb-2">Attendance Record</h4>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div><p className="text-2xl font-bold text-emerald-600">{att.present}</p><p className="text-xs text-muted-foreground">Present</p></div>
                      <div><p className="text-2xl font-bold text-rose-500">{att.absent}</p><p className="text-xs text-muted-foreground">Absent</p></div>
                      <div><p className="text-2xl font-bold text-blue-600">{att.percent}%</p><p className="text-xs text-muted-foreground">Percentage</p></div>
                    </div>
                  </div>
                  {studentResults.length > 0 && (
                    <div>
                      <h4 className="font-bold text-sm mb-2">Exam Results</h4>
                      <table className="w-full text-sm">
                        <thead><tr className="text-xs text-muted-foreground uppercase border-b"><th className="text-left py-1 px-2">Subject</th><th className="text-center py-1 px-2">Marks</th><th className="text-center py-1 px-2">Grade</th></tr></thead>
                        <tbody>
                          {studentResults.map((r) => (
                            <tr key={r.id} className="border-b border-border/50"><td className="py-1 px-2">{r.subject}</td><td className="py-1 px-2 text-center">{r.marks_obtained}/{r.max_marks}</td><td className="py-1 px-2 text-center"><Badge variant={r.grade === "F" ? "destructive" : "default"} className="text-[10px]">{r.grade}</Badge></td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Homework Dialog */}
        <Dialog open={hwOpen} onOpenChange={setHwOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Assign Homework</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Title</Label><Input value={hwTitle} onChange={(e) => setHwTitle(e.target.value)} placeholder="Homework title" className="mt-1" /></div>
              <div><Label>Description</Label><Textarea value={hwDesc} onChange={(e) => setHwDesc(e.target.value)} placeholder="Details..." className="mt-1" rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Subject</Label>
                  <Select value={hwSubject} onValueChange={setHwSubject}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{mySubjectAssignments.map((a) => <SelectItem key={a.id} value={a.subject}>{a.subject}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Due Date</Label><Input type="date" value={hwDue} onChange={(e) => setHwDue(e.target.value)} className="mt-1" /></div>
              </div>
              <div>
                <Label>Assign to Classes & Sections (click to toggle)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {mySubjectAssignments.filter((a) => a.subject === hwSubject).map((a) => {
                    const key = `${a.class_name}|${a.section_name}`;
                    return (
                      <button key={key} type="button"
                        onClick={() => setHwClasses((prev) => prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key])}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${hwClasses.includes(key) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-muted/80"}`}
                      >
                        {a.class_name} ({a.section_name})
                      </button>
                    );
                  })}
                </div>
              </div>
              <Button onClick={handleAddHomework} className="w-full">Assign Homework</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Notice Dialog (create & edit) */}
        <Dialog open={noticeOpen} onOpenChange={(o) => { if (!o) { setNoticeOpen(false); setEditingNotice(null); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingNotice ? "Edit Notice" : "Create Notice"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Title</Label><Input value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} placeholder="Notice title" className="mt-1" /></div>
              <div><Label>Content</Label><Textarea value={noticeContent} onChange={(e) => setNoticeContent(e.target.value)} placeholder="Notice content..." className="mt-1" rows={4} /></div>
              <div>
                <Label>Target</Label>
                <Select value={noticeTarget} onValueChange={setNoticeTarget}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="class">Specific Class</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {noticeTarget === "class" && (
                <div>
                  <Label>Select Classes (click to toggle)</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {classes.filter((c) => c.sections.length > 0).map((c) => (
                      <button key={c.name} type="button"
                        onClick={() => setNoticeClasses((prev) => prev.includes(c.name) ? prev.filter((x) => x !== c.name) : [...prev, c.name])}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${noticeClasses.includes(c.name) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-muted/80"}`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <Button onClick={handleAddNotice} className="w-full">{editingNotice ? "Update Notice" : "Publish Notice"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
