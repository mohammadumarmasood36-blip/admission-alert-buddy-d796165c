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
  const [readNoticeIds, setReadNoticeIds] = useState<Set<string>>(new Set());
  const [noticeFilterFrom, setNoticeFilterFrom] = useState("");
  const [noticeFilterTo, setNoticeFilterTo] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [calMonth, setCalMonth] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState("home");

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

      const [attRes, examRes, examsRes, schedRes, noticeRes, hwRes, subjRes, readRes] = await Promise.all([
        supabase.from("attendance").select("*").in("student_id", childIds).eq("session", session),
        supabase.from("exam_results").select("*").in("admission_no", admNos),
        supabase.from("examinations").select("*"),
        supabase.from("exam_schedules").select("*"),
        supabase.from("notices").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("homework").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("student_subjects").select("student_id, subject_name").in("student_id", childIds),
        supabase.from("student_notices").select("notice_id, read").in("student_id", childIds).eq("read", true),
      ]);
      if (attRes.data) setAttendance(attRes.data);
      if (examRes.data) setExamResults(examRes.data);
      if (examsRes.data) setExaminations(examsRes.data);
      if (schedRes.data) setExamSchedules(schedRes.data);
      if (noticeRes.data) setNotices(noticeRes.data);
      if (hwRes.data) setHomework(hwRes.data);
      if (readRes.data) setReadNoticeIds(new Set(readRes.data.map((r: any) => r.notice_id)));
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

  // Month-wise attendance breakdown (reference-style counters)
  const monthAttStats = useMemo(() => {
    const m = calMonth.getMonth(), y = calMonth.getFullYear();
    const recs = childAttendance.filter((a) => {
      const d = new Date(a.date);
      return d.getMonth() === m && d.getFullYear() === y;
    });
    const count = (...keys: string[]) =>
      recs.filter((r) => keys.includes(String(r.status || "").toLowerCase().replace(/[\s_-]/g, ""))).length;
    return {
      present: count("present"),
      absent: count("absent"),
      halfDay: count("halfday"),
      leave: count("leave", "onleave"),
      holiday: count("holiday"),
    };
  }, [childAttendance, calMonth]);

  const shiftMonth = (delta: number) =>
    setCalMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));


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

  // ===== Notices inbox helpers =====
  const filteredNotices = useMemo(() => {
    return childNotices.filter((n) => {
      if (unreadOnly && readNoticeIds.has(n.id)) return false;
      const d = new Date(n.created_at);
      if (noticeFilterFrom && d < new Date(noticeFilterFrom)) return false;
      if (noticeFilterTo) {
        const to = new Date(noticeFilterTo); to.setHours(23, 59, 59);
        if (d > to) return false;
      }
      return true;
    });
  }, [childNotices, noticeFilterFrom, noticeFilterTo, unreadOnly, readNoticeIds]);

  const unreadCount = childNotices.filter((n) => !readNoticeIds.has(n.id)).length;

  const markNoticeRead = async (noticeId: string) => {
    if (readNoticeIds.has(noticeId) || !child) return;
    const next = new Set(readNoticeIds); next.add(noticeId);
    setReadNoticeIds(next);
    await supabase.from("student_notices").upsert(
      { student_id: child.id, notice_id: noticeId, read: true } as any,
      { onConflict: "student_id,notice_id" } as any
    );
  };

  const markAllNoticesRead = async () => {
    if (!child) return;
    const unread = childNotices.filter((n) => !readNoticeIds.has(n.id));
    if (unread.length === 0) { toast.info("All notices already read"); return; }
    const next = new Set(readNoticeIds);
    unread.forEach((n) => next.add(n.id));
    setReadNoticeIds(next);
    const rows = unread.map((n) => ({ student_id: child.id, notice_id: n.id, read: true }));
    await supabase.from("student_notices").upsert(rows as any, { onConflict: "student_id,notice_id" } as any);
    toast.success(`Marked ${unread.length} notice${unread.length > 1 ? "s" : ""} as read`);
  };

  // Detect linked entity in notice content (homework/exam keywords)
  const findRelatedHomework = (n: any) => {
    const text = `${n.title} ${n.content || ""}`.toLowerCase();
    return childHomework.find((h) => text.includes(h.title.toLowerCase()) || text.includes((h.subject || "").toLowerCase()));
  };
  const findRelatedExam = (n: any) => {
    const text = `${n.title} ${n.content || ""}`.toLowerCase();
    return examinations.find((e) => text.includes((e.name || "").toLowerCase()));
  };

  // ===== Attendance PDF for selected month =====
  const downloadAttendancePDF = () => {
    if (!child) return;
    const month = calMonth.getMonth();
    const year = calMonth.getFullYear();
    const monthRecords = childAttendance
      .filter((a) => { const d = new Date(a.date); return d.getMonth() === month && d.getFullYear() === year; })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const doc = new jsPDF();
    const monthName = calMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    doc.setFontSize(16); doc.text("Attendance Report", 105, 15, { align: "center" });
    doc.setFontSize(12); doc.text(`${child.name} • Class ${child.className}-${child.section}`, 105, 23, { align: "center" });
    doc.text(`Admission No: ${child.admissionNumber}`, 105, 30, { align: "center" });
    doc.setFontSize(11); doc.text(`Month: ${monthName}`, 14, 42);
    const present = monthRecords.filter((r) => r.status === "present").length;
    const absent = monthRecords.length - present;
    const pct = monthRecords.length > 0 ? Math.round((present / monthRecords.length) * 100) : 0;
    doc.text(`Present: ${present}   Absent: ${absent}   Attendance: ${pct}%`, 14, 50);
    doc.setFontSize(10);
    let y = 62;
    doc.setFillColor(30, 58, 95); doc.rect(14, y - 5, 182, 8, "F");
    doc.setTextColor(255, 255, 255); doc.text("Date", 18, y); doc.text("Day", 70, y); doc.text("Status", 130, y);
    doc.setTextColor(0, 0, 0); y += 6;
    monthRecords.forEach((r) => {
      const d = new Date(r.date);
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(d.toLocaleDateString("en-IN"), 18, y);
      doc.text(d.toLocaleDateString("en-IN", { weekday: "long" }), 70, y);
      doc.text((r.status || "").toUpperCase(), 130, y);
      y += 6;
    });
    if (monthRecords.length === 0) { doc.text("No attendance recorded for this month.", 14, y); }
    doc.save(`Attendance_${child.name}_${monthName.replace(" ", "_")}.pdf`);
    toast.success(`Downloaded ${monthName} attendance`);
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
                {heroStats.map((s, i) => {
                  const tints = [
                    "from-emerald-500/15 to-emerald-500/5 border-emerald-500/30",
                    "from-amber-500/15 to-amber-500/5 border-amber-500/30",
                    "from-sky-500/15 to-sky-500/5 border-sky-500/30",
                    "from-rose-500/15 to-rose-500/5 border-rose-500/30",
                  ];
                  return (
                    <div key={s.label} className={`bg-gradient-to-br ${tints[i % 4]} rounded-xl p-3 border animate-fade-in shadow-sm hover:shadow-md transition-shadow`} style={{ animationDelay: `${i * 60}ms` }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-9 h-9 rounded-xl bg-card/80 flex items-center justify-center shadow-sm`}>
                          <s.icon className={`w-5 h-5 ${s.accent}`} />
                        </div>
                      </div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{s.label}</p>
                      <p className="text-base sm:text-lg font-bold font-display mt-0.5">{s.value}</p>
                    </div>
                  );
                })}
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-4 sm:grid-cols-8 h-auto bg-muted/50 p-1 gap-0.5">
              <TabsTrigger value="home" className="text-[10px] sm:text-xs py-2.5 flex-col sm:flex-row gap-1 sm:gap-1.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground"><Home className="w-5 h-5 sm:w-4 sm:h-4" /> Home</TabsTrigger>
              <TabsTrigger value="inbox" className="text-[10px] sm:text-xs py-2.5 flex-col sm:flex-row gap-1 sm:gap-1.5 relative data-[state=active]:bg-gradient-to-br data-[state=active]:from-secondary data-[state=active]:to-secondary/70 data-[state=active]:text-secondary-foreground">
                <Inbox className="w-5 h-5 sm:w-4 sm:h-4" /> Inbox
                {unreadCount > 0 && <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-destructive text-destructive-foreground rounded-full text-[9px] px-1.5 leading-4 min-w-[16px] text-center font-bold animate-pulse">{unreadCount}</span>}
              </TabsTrigger>
              <TabsTrigger value="homework" className="text-[10px] sm:text-xs py-2.5 flex-col sm:flex-row gap-1 sm:gap-1.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-info data-[state=active]:to-info/70 data-[state=active]:text-info-foreground"><BookOpen className="w-5 h-5 sm:w-4 sm:h-4" /> HW</TabsTrigger>
              <TabsTrigger value="timetable" className="text-[10px] sm:text-xs py-2.5 flex-col sm:flex-row gap-1 sm:gap-1.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-purple-500 data-[state=active]:text-white"><CalendarIcon className="w-5 h-5 sm:w-4 sm:h-4" /> Exams</TabsTrigger>
              <TabsTrigger value="results" className="text-[10px] sm:text-xs py-2.5 flex-col sm:flex-row gap-1 sm:gap-1.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-600 data-[state=active]:to-emerald-500 data-[state=active]:text-white"><BarChart3 className="w-5 h-5 sm:w-4 sm:h-4" /> Results</TabsTrigger>
              <TabsTrigger value="attendance" className="text-[10px] sm:text-xs py-2.5 flex-col sm:flex-row gap-1 sm:gap-1.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-success data-[state=active]:to-success/70 data-[state=active]:text-success-foreground"><CheckCircle2 className="w-5 h-5 sm:w-4 sm:h-4" /> Att.</TabsTrigger>
              <TabsTrigger value="fees" className="text-[10px] sm:text-xs py-2.5 flex-col sm:flex-row gap-1 sm:gap-1.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white"><CreditCard className="w-5 h-5 sm:w-4 sm:h-4" /> Fees</TabsTrigger>
              <TabsTrigger value="more" className="text-[10px] sm:text-xs py-2.5 flex-col sm:flex-row gap-1 sm:gap-1.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-slate-700 data-[state=active]:to-slate-600 data-[state=active]:text-white"><Settings className="w-5 h-5 sm:w-4 sm:h-4" /> More</TabsTrigger>
            </TabsList>


            {/* ===== HOME ===== */}
            <TabsContent value="home" className="space-y-4 mt-5">
              {/* Profile Widget */}
              <Card className="animate-fade-in overflow-hidden border-secondary/30 bg-gradient-to-br from-primary/5 via-card to-secondary/5">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <User className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-bold text-sm">Student Profile</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-card/70 border border-border/40">
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Class</p>
                      <p className="font-bold text-sm mt-0.5">{child.className}-{child.section}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-card/70 border border-border/40">
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Adm. No</p>
                      <p className="font-mono font-bold text-sm mt-0.5 truncate">{child.admissionNumber}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-card/70 border border-border/40">
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> Father</p>
                      <p className="font-medium text-xs mt-0.5 truncate">{child.fatherMobile || "—"}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-card/70 border border-border/40">
                      <p className="text-[10px] uppercase text-muted-foreground tracking-wider flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> Mother</p>
                      <p className="font-medium text-xs mt-0.5 truncate">{child.motherMobile || "—"}</p>
                    </div>
                  </div>
                  {/* Quick actions */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                    <Button size="sm" variant="outline" className="gap-2 text-xs h-auto py-2.5 hover:bg-primary/5 hover:border-primary/40" onClick={() => setActiveTab("timetable")}>
                      <CalendarIcon className="w-5 h-5 text-purple-600" /> Timetable
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2 text-xs h-auto py-2.5 hover:bg-secondary/5 hover:border-secondary/40" onClick={() => setActiveTab("homework")}>
                      <BookOpen className="w-5 h-5 text-sky-600" /> Homework
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2 text-xs h-auto py-2.5 hover:bg-success/5 hover:border-success/40" onClick={() => setActiveTab("attendance")}>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Attendance
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2 text-xs h-auto py-2.5 hover:bg-info/5 hover:border-info/40" onClick={() => setActiveTab("results")}>
                      <BarChart3 className="w-5 h-5 text-amber-600" /> Results
                    </Button>
                  </div>
                </CardContent>
              </Card>

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

            {/* ===== INBOX ===== */}
            <TabsContent value="inbox" className="space-y-3 mt-5">
              <Card className="animate-fade-in">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-display flex items-center justify-between gap-2 flex-wrap">
                    <span className="flex items-center gap-2"><Inbox className="w-5 h-5 text-primary" /> Notices Inbox</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{unreadCount} unread</Badge>
                      <Button
                        size="sm"
                        variant={unreadOnly ? "default" : "outline"}
                        className="h-7 text-xs gap-1.5"
                        onClick={() => setUnreadOnly((v) => !v)}
                      >
                        <Mail className="w-3.5 h-3.5" /> {unreadOnly ? "Showing unread" : "Unread only"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5"
                        onClick={markAllNoticesRead}
                        disabled={unreadCount === 0}
                      >
                        <MailOpen className="w-3.5 h-3.5" /> Mark all read
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2 items-end">
                    <div className="flex-1 min-w-[120px]">
                      <label className="text-[10px] uppercase text-muted-foreground tracking-wider">From</label>
                      <Input type="date" value={noticeFilterFrom} onChange={(e) => setNoticeFilterFrom(e.target.value)} className="h-8 text-xs mt-0.5" />
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <label className="text-[10px] uppercase text-muted-foreground tracking-wider">To</label>
                      <Input type="date" value={noticeFilterTo} onChange={(e) => setNoticeFilterTo(e.target.value)} className="h-8 text-xs mt-0.5" />
                    </div>
                    {(noticeFilterFrom || noticeFilterTo || unreadOnly) && (
                      <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setNoticeFilterFrom(""); setNoticeFilterTo(""); setUnreadOnly(false); }}>Clear</Button>
                    )}
                  </div>

                  {filteredNotices.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm">
                      <Inbox className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      {unreadOnly ? "No unread notices 🎉" : "No notices match the filters."}
                    </div>
                  ) : filteredNotices.map((n) => {
                    const isRead = readNoticeIds.has(n.id);
                    const relHw = findRelatedHomework(n);
                    const relExam = findRelatedExam(n);
                    return (
                      <button
                        key={n.id}
                        onClick={() => markNoticeRead(n.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all hover:shadow-md ${
                          isRead ? "bg-muted/30 border-border" : "bg-secondary/5 border-secondary/40 shadow-sm"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isRead ? "bg-muted text-muted-foreground" : "bg-secondary text-secondary-foreground"}`}>
                            {isRead ? <MailOpen className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm truncate ${isRead ? "font-medium text-muted-foreground" : "font-bold"}`}>{n.title}</p>
                              <span className="text-[10px] text-muted-foreground shrink-0">{new Date(n.created_at).toLocaleDateString("en-IN")}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 whitespace-pre-wrap">{n.content}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {relHw && (
                                <Badge onClick={(e) => { e.stopPropagation(); markNoticeRead(n.id); setActiveTab("homework"); }} className="text-[10px] cursor-pointer bg-secondary/20 text-secondary-foreground hover:bg-secondary/30 gap-1">
                                  <BookOpen className="w-2.5 h-2.5" /> Open Homework
                                </Badge>
                              )}
                              {relExam && (
                                <Badge onClick={(e) => { e.stopPropagation(); markNoticeRead(n.id); setActiveTab("timetable"); }} className="text-[10px] cursor-pointer bg-info/20 text-info-foreground hover:bg-info/30 gap-1">
                                  <ClipboardList className="w-2.5 h-2.5" /> Open Exam
                                </Badge>
                              )}
                              {!isRead && <Badge className="text-[10px] bg-destructive text-destructive-foreground">NEW</Badge>}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
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
                const dueDate = hw.due_date ? new Date(hw.due_date) : null;
                const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / 86400000) : null;
                const dueBadge = daysLeft === null ? null
                  : daysLeft < 0 ? { label: `Overdue ${Math.abs(daysLeft)}d`, cls: "bg-destructive text-destructive-foreground" }
                  : daysLeft === 0 ? { label: "Due today", cls: "bg-destructive text-destructive-foreground" }
                  : daysLeft <= 2 ? { label: `${daysLeft}d left`, cls: "bg-secondary text-secondary-foreground" }
                  : { label: `${daysLeft}d left`, cls: "bg-muted text-muted-foreground" };
                return (
                  <Card key={hw.id} className={`animate-fade-in transition-all ${done ? "opacity-60 bg-muted/40" : ""}`} style={{ animationDelay: `${i * 40}ms` }}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-3">
                        <Checkbox checked={done} onCheckedChange={() => toggleHw(hw.id)} className="mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className={`text-sm font-semibold ${done ? "line-through" : ""}`}>{hw.title}</p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant="outline" className="text-[10px]">{hw.subject}</Badge>
                              {!done && dueBadge && (
                                <Badge className={`text-[10px] gap-1 ${dueBadge.cls}`}><AlarmClock className="w-2.5 h-2.5" /> {dueBadge.label}</Badge>
                              )}
                              {done && <Badge className="text-[10px] bg-success text-success-foreground">Done</Badge>}
                            </div>
                          </div>
                          {hw.description && <p className="text-xs text-muted-foreground mt-1.5 whitespace-pre-wrap">{hw.description}</p>}
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            {hw.due_date && (
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3" /> Due {new Date(hw.due_date).toLocaleDateString("en-IN")}
                              </p>
                            )}
                            {hw.attachment_url && (
                              <a
                                href={hw.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                              >
                                <Paperclip className="w-3 h-3" /> View attachment
                              </a>
                            )}
                          </div>
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
                <CardHeader className="flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-display flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-primary" /> Attendance Calendar
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={downloadAttendancePDF} className="gap-1.5 h-8 text-xs">
                    <Download className="w-3.5 h-3.5" /> PDF
                  </Button>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="flex items-center justify-between w-full max-w-sm mb-2 text-xs">
                    <span className="text-muted-foreground">Viewing</span>
                    <span className="font-display font-bold">{calMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</span>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setCalMonth(new Date())}>Today</Button>
                  </div>
                  <Calendar
                    mode="single"
                    month={calMonth}
                    onMonthChange={setCalMonth}
                    modifiers={{ present: presentDates, absent: absentDates }}
                    modifiersClassNames={{
                      present: "bg-success/20 text-success font-bold rounded-full",
                      absent: "bg-destructive/20 text-destructive font-bold rounded-full",
                    }}
                    className="rounded-md border pointer-events-auto"
                  />
                </CardContent>
                <div className="px-6 pb-4 flex gap-4 text-xs justify-center">
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1.5 cursor-help">
                          <span className="w-3 h-3 rounded-full bg-success/40 ring-1 ring-success/60" /> Present
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Days your child was marked present</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1.5 cursor-help">
                          <span className="w-3 h-3 rounded-full bg-destructive/40 ring-1 ring-destructive/60" /> Absent
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Days your child was marked absent</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1.5 cursor-help text-muted-foreground">
                          <span className="w-3 h-3 rounded-full border border-border" /> No record
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Holiday or attendance not yet marked</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
