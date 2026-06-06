import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSchool } from "@/context/SchoolContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LogOut, GraduationCap, CreditCard, BookOpen, BarChart3, ClipboardList,
  Bell, Calendar as CalendarIcon, School, User, BellRing, Download,
  CheckCircle2, Clock, Sparkles, TrendingUp, FileText, ChevronRight,
  Home, Inbox, Mail, MailOpen, Paperclip, AlarmClock, Phone, Users, Settings,
} from "lucide-react";
import ChangePassword from "@/components/portal/ChangePassword";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { subscribeToPush, isPushSubscribed } from "@/lib/pushNotifications";
import { exportReportCardPDF } from "@/lib/pdfExport";
import jsPDF from "jspdf";

const HW_DONE_KEY = "ups_homework_done";

function getDoneHomework(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(HW_DONE_KEY) || "[]")); }
  catch { return new Set(); }
}
function setDoneHomework(set: Set<string>) {
  localStorage.setItem(HW_DONE_KEY, JSON.stringify([...set]));
}

export default function ParentDashboard() {
  const { user, logout, session } = useAuth();
  const { students, feeHistory } = useSchool();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [examResults, setExamResults] = useState<any[]>([]);
  const [examinations, setExaminations] = useState<any[]>([]);
  const [examSchedules, setExamSchedules] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [homework, setHomework] = useState<any[]>([]);
  const [studentSubjects, setStudentSubjects] = useState<Record<string, string[]>>({});
  const [doneHw, setDoneHw] = useState<Set<string>>(() => getDoneHomework());

  const myChildren = useMemo(() => {
    const child = students.find((s) => s.id === user?.id);
    if (!child) return [];
    const parentMobile = child.fatherMobile || child.motherMobile || child.parentMobile;
    if (parentMobile) {
      return students.filter((s) => s.fatherMobile === parentMobile || s.motherMobile === parentMobile || s.parentMobile === parentMobile);
    }
    return [child];
  }, [students, user?.id]);

  useEffect(() => {
    const load = async () => {
      const childIds = myChildren.map((c) => c.id);
      const admNos = myChildren.map((c) => c.admissionNumber);
      if (childIds.length === 0) return;

      const [attRes, examRes, examsRes, schedRes, noticeRes, hwRes, subjRes] = await Promise.all([
        supabase.from("attendance").select("*").in("student_id", childIds).eq("session", session),
        supabase.from("exam_results").select("*").in("admission_no", admNos),
        supabase.from("examinations").select("*"),
        supabase.from("exam_schedules").select("*"),
        supabase.from("notices").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("homework").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("student_subjects").select("student_id, subject_name").in("student_id", childIds),
      ]);
      if (attRes.data) setAttendance(attRes.data);
      if (examRes.data) setExamResults(examRes.data);
      if (examsRes.data) setExaminations(examsRes.data);
      if (schedRes.data) setExamSchedules(schedRes.data);
      if (noticeRes.data) setNotices(noticeRes.data);
      if (hwRes.data) setHomework(hwRes.data);
      if (subjRes.data) {
        const map: Record<string, string[]> = {};
        subjRes.data.forEach((r: any) => {
          if (!map[r.student_id]) map[r.student_id] = [];
          map[r.student_id].push(r.subject_name);
        });
        setStudentSubjects(map);
      }
    };
    load();
  }, [myChildren, session]);

  // Realtime alerts
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; time: Date; type: "attendance" | "notice" | "homework" }>>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const childIds = myChildren.map((c) => c.id);
    if (childIds.length === 0) return;

    const channel = supabase
      .channel("parent-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "attendance" }, (payload) => {
        const r = payload.new as any;
        if (childIds.includes(r.student_id)) {
          const child = myChildren.find((c) => c.id === r.student_id);
          const msg = `${child?.name || "Your child"} marked ${r.status} on ${r.date}`;
          setNotifications((prev) => [{ id: crypto.randomUUID(), message: msg, time: new Date(), type: "attendance" }, ...prev]);
          setAttendance((prev) => [...prev, r]);
          toast.info(msg, { icon: "📋" });
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notices" }, (payload) => {
        const r = payload.new as any;
        const child = myChildren[0];
        const relevant = r.target_type === "all" || (r.target_type === "class" && child && r.target_values?.includes(child.className));
        if (relevant) {
          setNotifications((prev) => [{ id: crypto.randomUUID(), message: `New Notice: ${r.title}`, time: new Date(), type: "notice" }, ...prev]);
          setNotices((prev) => [r, ...prev]);
          toast.info(`New Notice: ${r.title}`, { icon: "🔔" });
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "homework" }, (payload) => {
        const r = payload.new as any;
        const child = myChildren.find((c) => c.className === r.class_name && c.section === r.section_name);
        if (child) {
          setNotifications((prev) => [{ id: crypto.randomUUID(), message: `New Homework: ${r.title} (${r.subject})`, time: new Date(), type: "homework" }, ...prev]);
          setHomework((prev) => [r, ...prev]);
          toast.info(`New Homework: ${r.title}`, { icon: "📚" });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [myChildren]);

  const [pushEnabled, setPushEnabled] = useState(false);
  useEffect(() => { isPushSubscribed().then(setPushEnabled); }, []);

  const handleEnablePush = useCallback(async () => {
    if (!myChildren.length) return;
    const success = await subscribeToPush(myChildren[0].id);
    if (success) { setPushEnabled(true); toast.success("Push notifications enabled!"); }
    else toast.error("Could not enable notifications. Allow them in your browser.");
  }, [myChildren]);

  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  useEffect(() => {
    if (myChildren.length > 0 && !selectedChild) setSelectedChild(myChildren[0].id);
  }, [myChildren]);

  const child = myChildren.find((c) => c.id === selectedChild);
  const childFeeHistory = feeHistory.filter((f) => f.studentId === selectedChild);
  const childAttendance = attendance.filter((a) => a.student_id === selectedChild);
  const childResults = examResults.filter((r) => r.admission_no === child?.admissionNumber);
  const childHomework = useMemo(
    () => homework.filter((h) => child && h.class_name === child.className && h.section_name === child.section),
    [homework, child]
  );
  const childNotices = notices.filter((n) => {
    if (n.target_type === "all") return true;
    if (n.target_type === "class" && child && n.target_values?.includes(child.className)) return true;
    return false;
  });

  const attStats = useMemo(() => {
    const total = childAttendance.length;
    const present = childAttendance.filter((a) => a.status === "present").length;
    return { total, present, absent: total - present, percent: total > 0 ? Math.round((present / total) * 100) : 0 };
  }, [childAttendance]);

  const presentDates = useMemo(
    () => childAttendance.filter((a) => a.status === "present").map((a) => new Date(a.date)),
    [childAttendance]
  );
  const absentDates = useMemo(
    () => childAttendance.filter((a) => a.status !== "present").map((a) => new Date(a.date)),
    [childAttendance]
  );

  const upcomingExams = useMemo(() => {
    if (!child) return [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return examSchedules
      .filter((s) => s.class === child.className && new Date(s.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [examSchedules, child]);

  const pendingHomework = childHomework.filter((h) => !doneHw.has(h.id));
  const feeBalance = child ? Math.max(0, child.feeAmount - childFeeHistory.reduce((s, p) => s + p.amount, 0)) : 0;

  const toggleHw = (id: string) => {
    const next = new Set(doneHw);
    if (next.has(id)) next.delete(id); else next.add(id);
    setDoneHw(next);
    setDoneHomework(next);
  };

  const downloadReportCard = (examId: string) => {
    if (!child) return;
    const exam = examinations.find((e) => e.id === examId);
    const results = childResults.filter((r) => r.examination_id === examId);
    if (!exam || results.length === 0) { toast.error("No results to export"); return; }
    exportReportCardPDF(
      child.name,
      child.admissionNumber,
      `${child.className} - ${child.section}`,
      results.map((r) => ({
        studentName: child.name,
        admissionNo: child.admissionNumber,
        examName: exam.name,
        subject: r.subject,
        marksObtained: Number(r.marks_obtained),
        maxMarks: Number(r.max_marks),
        grade: r.grade || "",
      }))
    );
  };

  const handleLogout = () => { logout(); navigate("/portal"); };

  if (myChildren.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Student data not found.</p>
      </div>
    );
  }

  const heroStats = child ? [
    { label: "Attendance", value: `${attStats.percent}%`, icon: TrendingUp, accent: attStats.percent >= 75 ? "text-success" : "text-destructive" },
    { label: "Pending HW", value: pendingHomework.length, icon: BookOpen, accent: "text-secondary" },
    { label: "Upcoming Exams", value: upcomingExams.length, icon: ClipboardList, accent: "text-info" },
    { label: "Fee Due", value: `₹${feeBalance.toLocaleString()}`, icon: CreditCard, accent: feeBalance > 0 ? "text-destructive" : "text-success" },
  ] : [];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header — navy + gold matching school site */}
      <header className="relative bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,hsl(var(--secondary)),transparent_60%)]" />
        <div className="absolute -bottom-px left-0 right-0 h-1 bg-gradient-to-r from-transparent via-secondary to-transparent" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center shadow-[var(--gold-glow)]">
              <School className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-widest text-primary-foreground/60 font-medium">Parent Portal</p>
              <h1 className="font-display font-bold text-base sm:text-lg truncate">{user?.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!pushEnabled && (
              <Button variant="outline" size="sm" onClick={handleEnablePush} className="hidden sm:inline-flex gap-1.5 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 text-xs">
                <Bell className="w-3.5 h-3.5" /> Enable Alerts
              </Button>
            )}
            <div className="relative">
              <Button variant="outline" size="icon" onClick={() => setShowNotifications((v) => !v)} className="relative border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <BellRing className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-secondary-foreground rounded-full text-[10px] flex items-center justify-center font-bold">
                    {notifications.length > 9 ? "9+" : notifications.length}
                  </span>
                )}
              </Button>
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-card text-card-foreground rounded-xl shadow-2xl border border-border z-50 max-h-96 overflow-y-auto animate-fade-in">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <p className="font-bold text-sm">Notifications</p>
                    {notifications.length > 0 && (
                      <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setNotifications([])}>Clear all</Button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      <BellRing className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      No new notifications
                    </div>
                  ) : notifications.map((n) => (
                    <div key={n.id} className="px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-2">
                        <span className="text-base mt-0.5">{n.type === "attendance" ? "📋" : n.type === "homework" ? "📚" : "🔔"}</span>
                        <div className="min-w-0">
                          <p className="text-sm">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{n.time.toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Child selector */}
        {myChildren.length > 1 && (
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pb-4 flex gap-2 overflow-x-auto">
            {myChildren.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedChild(c.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  selectedChild === c.id
                    ? "bg-secondary text-secondary-foreground shadow-[var(--gold-glow)]"
                    : "bg-primary-foreground/10 text-primary-foreground/80 hover:bg-primary-foreground/20"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" /> {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Student hero card */}
        {child && (
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pb-6 pt-2">
            <div className="bg-card text-card-foreground rounded-2xl p-4 sm:p-5 shadow-[var(--card-shadow)] border border-border/50 animate-fade-in">
              <div className="flex items-center gap-4">
                {child.photoFile ? (
                  <img src={child.photoFile} alt="" className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-secondary/40" />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-2xl font-bold text-primary-foreground">
                    {child.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="font-display font-bold text-lg sm:text-xl truncate">{child.name}</h2>
                  <p className="text-sm text-muted-foreground">Class {child.className} • Section {child.section}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Adm No: <span className="font-mono font-semibold">{child.admissionNumber}</span></p>
                </div>
                <Sparkles className="hidden sm:block w-5 h-5 text-secondary" />
              </div>

              {/* Hero stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4">
                {heroStats.map((s, i) => (
                  <div key={s.label} className="bg-muted/40 rounded-xl p-3 border border-border/40 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <s.icon className={`w-4 h-4 ${s.accent}`} />
                    </div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{s.label}</p>
                    <p className="text-base sm:text-lg font-bold font-display mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>

              {studentSubjects[child.id]?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/40">
                  <p className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                    <BookOpen className="w-3 h-3" /> Subjects ({studentSubjects[child.id].length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {studentSubjects[child.id].map((s) => (
                      <Badge key={s} variant="outline" className="text-[10px] border-secondary/40 text-foreground bg-secondary/5">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {child && (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-4">
          <Tabs defaultValue="home">
            <TabsList className="w-full grid grid-cols-3 sm:grid-cols-7 h-auto bg-muted/50 p-1">
              <TabsTrigger value="home" className="text-xs py-2">Home</TabsTrigger>
              <TabsTrigger value="homework" className="text-xs py-2">Homework</TabsTrigger>
              <TabsTrigger value="timetable" className="text-xs py-2">Timetable</TabsTrigger>
              <TabsTrigger value="results" className="text-xs py-2">Results</TabsTrigger>
              <TabsTrigger value="attendance" className="text-xs py-2">Attendance</TabsTrigger>
              <TabsTrigger value="fees" className="text-xs py-2">Fees</TabsTrigger>
              <TabsTrigger value="more" className="text-xs py-2">More</TabsTrigger>
            </TabsList>

            {/* ===== HOME ===== */}
            <TabsContent value="home" className="space-y-4 mt-5">
              {pendingHomework.length > 0 && (
                <Card className="border-secondary/30 bg-gradient-to-br from-secondary/5 to-transparent animate-fade-in">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 font-display">
                      <Clock className="w-4 h-4 text-secondary" /> Pending Homework ({pendingHomework.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {pendingHomework.slice(0, 3).map((hw) => (
                      <div key={hw.id} className="flex items-center gap-3 p-2.5 bg-card rounded-lg border border-border/60">
                        <Checkbox checked={false} onCheckedChange={() => toggleHw(hw.id)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium truncate">{hw.title}</p>
                            <Badge variant="outline" className="text-[10px] shrink-0">{hw.subject}</Badge>
                          </div>
                          {hw.due_date && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">Due: {new Date(hw.due_date).toLocaleDateString("en-IN")}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {upcomingExams.length > 0 && (
                <Card className="animate-fade-in">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 font-display">
                      <ClipboardList className="w-4 h-4 text-info" /> Upcoming Exams
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {upcomingExams.slice(0, 4).map((e) => (
                      <div key={e.id} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{e.subject}</p>
                          <p className="text-[11px] text-muted-foreground">{new Date(e.date).toLocaleDateString("en-IN")} • {e.start_time}–{e.end_time} • Room {e.room || "TBA"}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {childNotices.length > 0 && (
                <Card className="animate-fade-in">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 font-display">
                      <Bell className="w-4 h-4 text-secondary" /> Recent Notices
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {childNotices.slice(0, 3).map((n) => (
                      <div key={n.id} className="p-3 bg-muted/30 rounded-lg border-l-2 border-secondary">
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.content}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ===== HOMEWORK ===== */}
            <TabsContent value="homework" className="space-y-3 mt-5">
              {childHomework.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No homework assigned yet.</p>
                </div>
              ) : childHomework.map((hw, i) => {
                const done = doneHw.has(hw.id);
                return (
                  <Card key={hw.id} className={`animate-fade-in transition-all ${done ? "opacity-60 bg-muted/40" : ""}`} style={{ animationDelay: `${i * 40}ms` }}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-3">
                        <Checkbox checked={done} onCheckedChange={() => toggleHw(hw.id)} className="mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className={`text-sm font-semibold ${done ? "line-through" : ""}`}>{hw.title}</p>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-[10px]">{hw.subject}</Badge>
                              {done && <Badge className="text-[10px] bg-success text-success-foreground">Done</Badge>}
                            </div>
                          </div>
                          {hw.description && <p className="text-xs text-muted-foreground mt-1.5 whitespace-pre-wrap">{hw.description}</p>}
                          {hw.due_date && (
                            <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" /> Due {new Date(hw.due_date).toLocaleDateString("en-IN")}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            {/* ===== TIMETABLE ===== */}
            <TabsContent value="timetable" className="space-y-3 mt-5">
              {examSchedules.filter((s) => s.class === child.className).length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No exam schedule published yet.</p>
                </div>
              ) : (
                examinations.map((exam) => {
                  const sched = examSchedules
                    .filter((s) => s.examination_id === exam.id && s.class === child.className)
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                  if (sched.length === 0) return null;
                  return (
                    <Card key={exam.id} className="animate-fade-in overflow-hidden">
                      <CardHeader className="bg-primary text-primary-foreground py-3">
                        <CardTitle className="text-base font-display flex items-center justify-between">
                          <span>{exam.name}</span>
                          <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground bg-transparent">{sched.length} papers</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-border">
                          {sched.map((s) => (
                            <div key={s.id} className="p-3 sm:p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                              <div className="w-14 sm:w-16 text-center shrink-0">
                                <p className="text-xs text-muted-foreground uppercase">{new Date(s.date).toLocaleDateString("en-IN", { month: "short" })}</p>
                                <p className="text-2xl font-display font-bold text-primary">{new Date(s.date).getDate()}</p>
                                <p className="text-[10px] text-muted-foreground">{new Date(s.date).toLocaleDateString("en-IN", { weekday: "short" })}</p>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">{s.subject}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" /> {s.start_time} – {s.end_time}</p>
                                {s.room && <p className="text-xs text-muted-foreground">Room: {s.room}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {/* ===== RESULTS ===== */}
            <TabsContent value="results" className="space-y-4 mt-5">
              {childResults.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No exam results published yet.</p>
                </div>
              ) : examinations.map((exam) => {
                const results = childResults.filter((r) => r.examination_id === exam.id);
                if (results.length === 0) return null;
                const total = results.reduce((s, r) => s + Number(r.marks_obtained), 0);
                const max = results.reduce((s, r) => s + Number(r.max_marks), 0);
                const pct = max > 0 ? ((total / max) * 100).toFixed(1) : "0";
                const grade = Number(pct) >= 90 ? "A+" : Number(pct) >= 80 ? "A" : Number(pct) >= 70 ? "B+" : Number(pct) >= 60 ? "B" : Number(pct) >= 50 ? "C" : Number(pct) >= 40 ? "D" : "F";
                return (
                  <Card key={exam.id} className="animate-fade-in overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary to-primary/85 text-primary-foreground">
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle className="font-display text-base sm:text-lg">{exam.name}</CardTitle>
                        <Button size="sm" variant="outline" onClick={() => downloadReportCard(exam.id)} className="gap-1.5 border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
                          <Download className="w-3.5 h-3.5" /> Report Card
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-muted-foreground uppercase bg-muted/40">
                              <th className="text-left py-2.5 px-4 font-medium">Subject</th>
                              <th className="text-center py-2.5 px-3 font-medium">Marks</th>
                              <th className="text-center py-2.5 px-3 font-medium">%</th>
                              <th className="text-center py-2.5 px-3 font-medium">Grade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.map((r) => {
                              const p = Math.round((Number(r.marks_obtained) / Number(r.max_marks)) * 100);
                              return (
                                <tr key={r.id} className="border-t border-border/60 hover:bg-muted/20">
                                  <td className="py-2.5 px-4 font-medium">{r.subject}</td>
                                  <td className="py-2.5 px-3 text-center font-mono">{r.marks_obtained}<span className="text-muted-foreground">/{r.max_marks}</span></td>
                                  <td className="py-2.5 px-3 text-center font-mono">{p}%</td>
                                  <td className="py-2.5 px-3 text-center">
                                    <Badge variant={r.grade === "F" ? "destructive" : "default"} className={r.grade !== "F" ? "bg-success text-success-foreground" : ""}>{r.grade || "-"}</Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="bg-secondary/10 px-4 py-3 border-t border-secondary/30 flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Overall</p>
                          <p className="font-display font-bold text-lg">{total} / {max} <span className="text-secondary">({pct}%)</span></p>
                        </div>
                        <Badge className="bg-secondary text-secondary-foreground text-sm px-3 py-1 font-display">Grade {grade}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            {/* ===== ATTENDANCE ===== */}
            <TabsContent value="attendance" className="space-y-4 mt-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Present", value: attStats.present, bg: "bg-success/10", text: "text-success" },
                  { label: "Absent", value: attStats.absent, bg: "bg-destructive/10", text: "text-destructive" },
                  { label: "%", value: `${attStats.percent}%`, bg: "bg-secondary/15", text: "text-secondary" },
                ].map((s) => (
                  <Card key={s.label} className={`${s.bg} border-0 animate-fade-in`}>
                    <CardContent className="pt-5 pb-4 text-center">
                      <p className={`text-2xl sm:text-3xl font-display font-bold ${s.text}`}>{s.value}</p>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="text-sm font-display flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-primary" /> Attendance Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Calendar
                    mode="single"
                    modifiers={{ present: presentDates, absent: absentDates }}
                    modifiersClassNames={{
                      present: "bg-success/20 text-success font-bold rounded-full",
                      absent: "bg-destructive/20 text-destructive font-bold rounded-full",
                    }}
                    className="rounded-md border pointer-events-auto"
                  />
                </CardContent>
                <div className="px-6 pb-4 flex gap-4 text-xs justify-center">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-success/30" /> Present</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-destructive/30" /> Absent</span>
                </div>
              </Card>
            </TabsContent>

            {/* ===== FEES ===== */}
            <TabsContent value="fees" className="space-y-4 mt-5">
              <Card className="animate-fade-in">
                <CardHeader><CardTitle className="font-display flex items-center gap-2 text-base"><CreditCard className="w-5 h-5 text-primary" /> Fee Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl p-3 bg-muted/40 border border-border/40 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Annual</p>
                      <p className="text-base font-bold font-display">₹{child.feeAmount.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl p-3 bg-success/10 border border-success/30 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-success">Paid</p>
                      <p className="text-base font-bold font-display text-success">₹{childFeeHistory.reduce((s, p) => s + p.amount, 0).toLocaleString()}</p>
                    </div>
                    <div className={`rounded-xl p-3 text-center border ${feeBalance > 0 ? "bg-destructive/10 border-destructive/30" : "bg-success/10 border-success/30"}`}>
                      <p className={`text-[10px] uppercase tracking-wider ${feeBalance > 0 ? "text-destructive" : "text-success"}`}>Balance</p>
                      <p className={`text-base font-bold font-display ${feeBalance > 0 ? "text-destructive" : "text-success"}`}>₹{feeBalance.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {["Q1", "Q2", "Q3", "Q4"].map((q) => {
                      const qPayments = childFeeHistory.filter((f) => (f as any).quarter === q);
                      const paid = qPayments.length > 0;
                      const amt = qPayments.reduce((s, p) => s + p.amount, 0);
                      return (
                        <div key={q} className={`rounded-xl p-3 border flex items-center justify-between ${paid ? "bg-success/5 border-success/30" : "bg-muted/30 border-border"}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${paid ? "bg-success text-success-foreground" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                              {paid ? <CheckCircle2 className="w-4 h-4" /> : q}
                            </div>
                            <div>
                              <p className="text-sm font-medium">Quarter {q.replace("Q", "")}</p>
                              {paid && <p className="text-[11px] text-muted-foreground">Paid {qPayments[0]?.date || "—"}</p>}
                            </div>
                          </div>
                          <p className={`font-bold font-mono text-sm ${paid ? "text-success" : "text-muted-foreground"}`}>
                            ₹{(paid ? amt : child.feeAmount / 4).toLocaleString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== MORE ===== */}
            <TabsContent value="more" className="space-y-4 mt-5">
              <Card className="animate-fade-in">
                <CardHeader><CardTitle className="font-display flex items-center gap-2 text-base"><User className="w-5 h-5 text-primary" /> Student Information</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Father</p><p className="font-medium">{child.fatherName || "—"}</p></div>
                    <div><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Father Mobile</p><p className="font-medium">{child.fatherMobile || "—"}</p></div>
                    <div><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Mother</p><p className="font-medium">{child.motherName || "—"}</p></div>
                    <div><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Mother Mobile</p><p className="font-medium">{child.motherMobile || "—"}</p></div>
                    <div className="col-span-2"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Address</p><p className="font-medium">{child.address || "—"}</p></div>
                    {child.transportFacility && (
                      <>
                        <div><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Bus</p><p className="font-medium">{child.busNumber || "—"}</p></div>
                        <div><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Pickup</p><p className="font-medium">{child.pickupLocation || "—"}</p></div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-fade-in">
                <CardHeader><CardTitle className="font-display flex items-center gap-2 text-base"><Bell className="w-5 h-5 text-secondary" /> All Notices</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {childNotices.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No notices.</p>
                  ) : childNotices.map((n) => (
                    <div key={n.id} className="p-3 bg-muted/30 rounded-lg border-l-2 border-secondary">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{n.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString("en-IN")}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <ChangePassword userId={child.id} userType="student" />
            </TabsContent>
          </Tabs>
        </main>
      )}
    </div>
  );
}
