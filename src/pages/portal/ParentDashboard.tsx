import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSchool } from "@/context/SchoolContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, GraduationCap, CreditCard, BookOpen, BarChart3, ClipboardList, Bell, Bus, Calendar, MapPin, School, User, Home, BellRing } from "lucide-react";
import ChangePassword from "@/components/portal/ChangePassword";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function ParentDashboard() {
  const { user, logout, session } = useAuth();
  const { students, feeHistory } = useSchool();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [examResults, setExamResults] = useState<any[]>([]);
  const [examinations, setExaminations] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [homework, setHomework] = useState<any[]>([]);
  const [seatingPlans, setSeatingPlans] = useState<any[]>([]);

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

      const [attRes, examRes, examsRes, noticeRes, hwRes, seatRes] = await Promise.all([
        supabase.from("attendance").select("*").in("student_id", childIds).eq("session", session),
        supabase.from("exam_results").select("*").in("admission_no", admNos),
        supabase.from("examinations").select("*"),
        supabase.from("notices").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("homework").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("exam_seating_plans").select("*"),
      ]);
      if (attRes.data) setAttendance(attRes.data);
      if (examRes.data) setExamResults(examRes.data);
      if (examsRes.data) setExaminations(examsRes.data);
      if (noticeRes.data) setNotices(noticeRes.data);
      if (hwRes.data) setHomework(hwRes.data);
      if (seatRes.data) setSeatingPlans(seatRes.data);
    };
    load();
  }, [myChildren, session]);

  // Real-time notifications for attendance & notices
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; time: Date; type: "attendance" | "notice" }>>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const childIds = myChildren.map((c) => c.id);
    if (childIds.length === 0) return;

    const channel = supabase
      .channel("parent-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "attendance" },
        (payload) => {
          const record = payload.new as any;
          if (childIds.includes(record.student_id)) {
            const child = myChildren.find((c) => c.id === record.student_id);
            const msg = `${child?.name || "Your child"} marked ${record.status} on ${record.date}`;
            setNotifications((prev) => [{ id: crypto.randomUUID(), message: msg, time: new Date(), type: "attendance" }, ...prev]);
            setAttendance((prev) => [...prev, record]);
            toast.info(msg, { icon: "📋" });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notices" },
        (payload) => {
          const record = payload.new as any;
          const child = myChildren[0];
          const isRelevant = record.target_type === "all" || 
            (record.target_type === "class" && child && record.target_values?.includes(child.className));
          if (isRelevant) {
            const msg = `New Notice: ${record.title}`;
            setNotifications((prev) => [{ id: crypto.randomUUID(), message: msg, time: new Date(), type: "notice" }, ...prev]);
            setNotices((prev) => [record, ...prev]);
            toast.info(msg, { icon: "🔔" });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [myChildren]);

  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  useEffect(() => {
    if (myChildren.length > 0 && !selectedChild) setSelectedChild(myChildren[0].id);
  }, [myChildren]);

  const child = myChildren.find((c) => c.id === selectedChild);
  const childFeeHistory = feeHistory.filter((f) => f.studentId === selectedChild);
  const childAttendance = attendance.filter((a) => a.student_id === selectedChild);
  const childResults = examResults.filter((r) => r.admission_no === child?.admissionNumber);

  // Filter notices relevant to this child
  const childNotices = notices.filter((n) => {
    if (n.target_type === "all") return true;
    if (n.target_type === "class" && child && n.target_values?.includes(child.className)) return true;
    return false;
  });

  // Filter homework for child's class
  const childHomework = homework.filter((h) => child && h.class_name === child.className && h.section_name === child.section);

  // Seating for child
  const childSeating = seatingPlans.filter((sp) => child && sp.students?.includes(child.name));

  const attStats = useMemo(() => {
    const total = childAttendance.length;
    const present = childAttendance.filter((a) => a.status === "present").length;
    return { total, present, absent: total - present, percent: total > 0 ? Math.round((present / total) * 100) : 0 };
  }, [childAttendance]);

  const handleLogout = () => { logout(); navigate("/portal"); };

  if (myChildren.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <p className="text-white/60">Student data not found.</p>
      </div>
    );
  }

  const quickActions = [
    { icon: CreditCard, label: "Fees", tab: "fees", color: "from-emerald-500 to-teal-500" },
    { icon: ClipboardList, label: "Results", tab: "results", color: "from-blue-500 to-indigo-500" },
    { icon: Bell, label: "Notices", tab: "notices", color: "from-amber-500 to-orange-500" },
    { icon: BarChart3, label: "Attendance", tab: "attendance", color: "from-rose-500 to-pink-500" },
    { icon: Bus, label: "Transport", tab: "info", color: "from-violet-500 to-purple-500" },
    { icon: BookOpen, label: "Homework", tab: "homework", color: "from-cyan-500 to-sky-500" },
    { icon: MapPin, label: "Seating", tab: "seating", color: "from-lime-500 to-green-500" },
    { icon: Calendar, label: "Calendar", tab: "attendance", color: "from-fuchsia-500 to-pink-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-6 py-5 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <School className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Welcome back,</p>
              <h1 className="font-display font-bold text-lg">{user?.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Button variant="outline" size="icon" onClick={() => setShowNotifications(!showNotifications)} className="border-white/30 text-white hover:bg-white/10 bg-transparent relative">
                <BellRing className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-[10px] flex items-center justify-center font-bold text-destructive-foreground">
                    {notifications.length > 9 ? "9+" : notifications.length}
                  </span>
                )}
              </Button>
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-card rounded-xl shadow-2xl border border-border z-50 max-h-80 overflow-y-auto">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <p className="font-bold text-sm text-foreground">Notifications</p>
                    {notifications.length > 0 && (
                      <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setNotifications([])}>Clear all</Button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-sm">No new notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50">
                        <div className="flex items-start gap-2">
                          <span className="text-base mt-0.5">{n.type === "attendance" ? "📋" : "🔔"}</span>
                          <div>
                            <p className="text-sm text-foreground">{n.message}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">{n.time.toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 border-white/30 text-white hover:bg-white/10 bg-transparent">
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-5">
        {/* Child selector */}
        {myChildren.length > 1 && (
          <div className="flex gap-2 flex-wrap animate-fade-in">
            {myChildren.map((c) => (
              <Button
                key={c.id}
                variant={selectedChild === c.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedChild(c.id)}
                className="gap-2"
              >
                <GraduationCap className="w-4 h-4" /> {c.name} ({c.className})
              </Button>
            ))}
          </div>
        )}

        {/* Student card */}
        {child && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg animate-fade-in overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 flex items-center gap-4">
              {child.photoFile ? (
                <img src={child.photoFile} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white/50" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold text-white">
                  {child.name.charAt(0)}
                </div>
              )}
              <div className="text-white">
                <h3 className="font-bold text-lg">{child.name}</h3>
                <p className="text-sm text-white/80">Class {child.className} • Section {child.section}</p>
                <p className="text-xs text-white/60">Adm No: {child.admissionNumber}</p>
              </div>
            </div>
          </Card>
        )}

        {child && (
          <Tabs defaultValue="home">
            <TabsList className="grid grid-cols-5 w-full bg-white/80 backdrop-blur-sm shadow-sm">
              <TabsTrigger value="home" className="text-xs">Home</TabsTrigger>
              <TabsTrigger value="fees" className="text-xs">Fees</TabsTrigger>
              <TabsTrigger value="attendance" className="text-xs">Attend.</TabsTrigger>
              <TabsTrigger value="results" className="text-xs">Results</TabsTrigger>
              <TabsTrigger value="more" className="text-xs">More</TabsTrigger>
            </TabsList>

            {/* HOME TAB */}
            <TabsContent value="home" className="space-y-5 mt-4">
              {/* Quick Actions Grid */}
              <div>
                <h3 className="text-sm font-bold text-muted-foreground mb-3">Quick Actions</h3>
                <div className="grid grid-cols-4 gap-3">
                  {quickActions.map((action, i) => (
                    <button key={action.label} className="flex flex-col items-center gap-2 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg hover:scale-105 transition-transform`}>
                        <action.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Attendance summary */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md animate-fade-in">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" /> My Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3 justify-center mb-3">
                    {[
                      { label: "Present", value: attStats.present, color: "bg-emerald-500" },
                      { label: "Absent", value: attStats.absent, color: "bg-rose-500" },
                      { label: "Total", value: attStats.total, color: "bg-blue-500" },
                      { label: "%", value: `${attStats.percent}%`, color: "bg-amber-500" },
                    ].map((stat) => (
                      <div key={stat.label} className="flex flex-col items-center">
                        <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                          {stat.value}
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${attStats.percent >= 75 ? "bg-emerald-500" : attStats.percent >= 50 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${attStats.percent}%` }} />
                  </div>
                </CardContent>
              </Card>

              {/* Recent Notices */}
              {childNotices.length > 0 && (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md animate-fade-in">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-500" /> Recent Notices
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {childNotices.slice(0, 3).map((n) => (
                      <div key={n.id} className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.content}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* FEES TAB */}
            <TabsContent value="fees" className="space-y-4 mt-4">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md animate-fade-in">
                <CardHeader><CardTitle className="font-display flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Fee Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
                      <p className="text-xs text-rose-600 font-medium">Due</p>
                      <p className="text-xl font-bold text-rose-700">₹ {child.feeAmount.toLocaleString()}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                      <p className="text-xs text-emerald-600 font-medium">Paid</p>
                      <p className="text-xl font-bold text-emerald-700">₹ {childFeeHistory.reduce((s, p) => s + p.amount, 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="text-lg font-bold">₹ {Math.max(0, child.feeAmount - childFeeHistory.reduce((s, p) => s + p.amount, 0)).toLocaleString()}</p>
                  </div>
                  {/* Quarter status */}
                  <div className="space-y-3">
                    {["Q1", "Q2", "Q3", "Q4"].map((q) => {
                      const qPayments = childFeeHistory.filter((f) => (f as any).quarter === q);
                      const paid = qPayments.length > 0;
                      const amt = qPayments.reduce((s, p) => s + p.amount, 0);
                      return (
                        <div key={q} className={`rounded-xl p-4 border ${paid ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${paid ? "bg-emerald-500" : "bg-gray-400"}`}>
                                {paid ? "✓" : q}
                              </div>
                              <div>
                                <p className="text-sm font-medium">Quarter {q.replace("Q", "")}</p>
                                {paid && <p className="text-xs text-muted-foreground">Paid on {qPayments[0]?.date || "—"}</p>}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${paid ? "text-emerald-600" : "text-gray-500"}`}>
                                ₹ {paid ? amt.toLocaleString() : (child.feeAmount / 4).toLocaleString()}
                              </p>
                              <Badge variant={paid ? "default" : "destructive"} className="text-[10px]">
                                {paid ? "Paid" : "Due"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ATTENDANCE TAB */}
            <TabsContent value="attendance" className="space-y-4 mt-4">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md animate-fade-in">
                <CardHeader><CardTitle className="font-display flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Attendance Record</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center mb-6">
                    <div className="bg-emerald-100 rounded-2xl p-4"><p className="text-3xl font-bold text-emerald-600">{attStats.present}</p><p className="text-xs text-muted-foreground mt-1">Present</p></div>
                    <div className="bg-rose-100 rounded-2xl p-4"><p className="text-3xl font-bold text-rose-600">{attStats.absent}</p><p className="text-xs text-muted-foreground mt-1">Absent</p></div>
                    <div className="bg-blue-100 rounded-2xl p-4"><p className="text-3xl font-bold text-blue-600">{attStats.percent}%</p><p className="text-xs text-muted-foreground mt-1">Percentage</p></div>
                  </div>
                  <div className="h-6 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${attStats.percent >= 75 ? "bg-emerald-500" : attStats.percent >= 50 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${attStats.percent}%` }} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* RESULTS TAB */}
            <TabsContent value="results" className="space-y-4 mt-4">
              {childResults.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground animate-fade-in">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No exam results available yet.</p>
                </div>
              ) : examinations.map((exam) => {
                const results = childResults.filter((r) => r.examination_id === exam.id);
                if (results.length === 0) return null;
                return (
                  <Card key={exam.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-md animate-fade-in">
                    <CardHeader><CardTitle className="font-display text-lg">{exam.name}</CardTitle></CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="text-xs text-muted-foreground uppercase border-b"><th className="text-left py-2 px-3">Subject</th><th className="text-center py-2 px-3">Marks</th><th className="text-center py-2 px-3">Max</th><th className="text-center py-2 px-3">%</th><th className="text-center py-2 px-3">Grade</th></tr></thead>
                          <tbody>
                            {results.map((r) => {
                              const percent = Math.round((r.marks_obtained / r.max_marks) * 100);
                              return (
                                <tr key={r.id} className="border-b border-border/50">
                                  <td className="py-2 px-3 font-medium">{r.subject}</td>
                                  <td className="py-2 px-3 text-center">{r.marks_obtained}</td>
                                  <td className="py-2 px-3 text-center">{r.max_marks}</td>
                                  <td className="py-2 px-3 text-center">{percent}%</td>
                                  <td className="py-2 px-3 text-center"><Badge variant={r.grade === "F" ? "destructive" : "default"}>{r.grade}</Badge></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            {/* MORE TAB */}
            <TabsContent value="more" className="space-y-4 mt-4">
              {/* Student Info */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md animate-fade-in">
                <CardHeader><CardTitle className="font-display flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Student Information</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-xs text-muted-foreground">Father</p><p className="font-medium">{child.fatherName || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Father Mobile</p><p className="font-medium">{child.fatherMobile || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Mother</p><p className="font-medium">{child.motherName || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Mother Mobile</p><p className="font-medium">{child.motherMobile || "—"}</p></div>
                    <div className="col-span-2"><p className="text-xs text-muted-foreground">Address</p><p className="font-medium">{child.address || "—"}</p></div>
                    {child.transportFacility && (
                      <>
                        <div><p className="text-xs text-muted-foreground">Bus Number</p><p className="font-medium">{child.busNumber || "—"}</p></div>
                        <div><p className="text-xs text-muted-foreground">Pickup</p><p className="font-medium">{child.pickupLocation || "—"}</p></div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Homework */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md animate-fade-in">
                <CardHeader><CardTitle className="font-display flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> Homework</CardTitle></CardHeader>
                <CardContent>
                  {childHomework.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No homework assigned yet.</p>
                  ) : childHomework.slice(0, 5).map((hw) => (
                    <div key={hw.id} className="p-3 bg-blue-50 rounded-xl border border-blue-100 mb-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{hw.title}</p>
                        <Badge variant="outline" className="text-[10px]">{hw.subject}</Badge>
                      </div>
                      {hw.description && <p className="text-xs text-muted-foreground mt-1">{hw.description}</p>}
                      {hw.due_date && <p className="text-[10px] text-muted-foreground mt-1">Due: {hw.due_date}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Seating */}
              {childSeating.length > 0 && (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md animate-fade-in">
                  <CardHeader><CardTitle className="font-display flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Exam Seating</CardTitle></CardHeader>
                  <CardContent>
                    {childSeating.map((sp) => (
                      <div key={sp.id} className="p-3 bg-violet-50 rounded-xl border border-violet-100 mb-2">
                        <p className="text-sm font-medium">Room: {sp.room}</p>
                        <p className="text-xs text-muted-foreground">Date: {sp.date} • Class: {sp.class}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Notices */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md animate-fade-in">
                <CardHeader><CardTitle className="font-display flex items-center gap-2"><Bell className="w-5 h-5 text-amber-500" /> All Notices</CardTitle></CardHeader>
                <CardContent>
                  {childNotices.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No notices.</p>
                  ) : childNotices.map((n) => (
                    <div key={n.id} className="p-3 bg-amber-50 rounded-xl border border-amber-100 mb-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{n.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString("en-IN")}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <ChangePassword userId={child.id} userType="student" />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
