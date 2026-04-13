import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/portal/DashboardLayout";
import { useSchool, ALL_CLASSES, ClassName } from "@/context/SchoolContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Users, GraduationCap, Banknote, Wallet, TrendingUp, UserCheck, IndianRupee, Save, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Dashboard = () => {
  const { staff, students } = useSchool();
  const { user, session } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [classFees, setClassFees] = useState<Record<string, number>>({});
  const [editFees, setEditFees] = useState<Record<string, string>>({});
  const [savingFees, setSavingFees] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      const { data } = await supabase.from("fee_payments").select("amount").eq("session", session);
      setPayments(data || []);
    };
    fetchPayments();
  }, [session]);

  useEffect(() => {
    const fetchClassFees = async () => {
      const { data } = await supabase.from("class_fee_defaults").select("*");
      if (data) {
        const map: Record<string, number> = {};
        const editMap: Record<string, string> = {};
        data.forEach((r: any) => {
          map[r.class_name] = Number(r.annual_fee);
          editMap[r.class_name] = String(r.annual_fee);
        });
        setClassFees(map);
        setEditFees(editMap);
      }
    };
    fetchClassFees();
  }, []);

  const totalStaff = staff.length;
  const totalStudents = students.length;
  const feeCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const feePending = students.reduce((sum, s) => sum + s.feeAmount, 0) - feeCollected;
  const salaryPaid = staff.filter((s) => s.salaryPaid).length;
  const totalSalaryBudget = staff.reduce((sum, s) => sum + s.salary, 0);

  const handleSaveClassFees = async () => {
    setSavingFees(true);
    try {
      for (const cls of ALL_CLASSES) {
        const fee = Number(editFees[cls] || 0);
        if (fee > 0) {
          await supabase.from("class_fee_defaults").upsert(
            { class_name: cls, annual_fee: fee } as any,
            { onConflict: "class_name" }
          );
        }
      }
      const map: Record<string, number> = {};
      ALL_CLASSES.forEach((cls) => { map[cls] = Number(editFees[cls] || 0); });
      setClassFees(map);
      toast.success("Class fees saved!");
    } catch {
      toast.error("Failed to save class fees");
    }
    setSavingFees(false);
  };

  const statCards = [
    { title: "Total Staff", value: totalStaff, icon: Users, desc: `${staff.filter(s => s.role === 'teacher').length} teachers`, gradient: "from-blue-500 to-blue-600", iconBg: "bg-blue-400/30" },
    { title: "Total Students", value: totalStudents, icon: GraduationCap, desc: "All classes", gradient: "from-emerald-500 to-emerald-600", iconBg: "bg-emerald-400/30" },
    { title: "Fees Collected", value: `₹${feeCollected.toLocaleString("en-IN")}`, icon: Wallet, desc: `Session ${session}`, gradient: "from-violet-500 to-violet-600", iconBg: "bg-violet-400/30" },
    { title: "Fees Pending", value: `₹${Math.max(0, feePending).toLocaleString("en-IN")}`, icon: TrendingUp, desc: `${students.filter(s => !s.feePaid).length} students`, gradient: "from-rose-500 to-rose-600", iconBg: "bg-rose-400/30" },
    { title: "Salary Budget", value: `₹${totalSalaryBudget.toLocaleString("en-IN")}`, icon: Banknote, desc: "Monthly total", gradient: "from-amber-500 to-amber-600", iconBg: "bg-amber-400/30" },
    { title: "Salaries Paid", value: `${salaryPaid}/${totalStaff}`, icon: UserCheck, desc: salaryPaid === totalStaff ? "All paid ✓" : "Pending payments", gradient: "from-cyan-500 to-cyan-600", iconBg: "bg-cyan-400/30" },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-foreground">
          {user?.role === "principal" ? "Principal" : "Manager"} Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user?.name}. Here's your school overview.</p>
      </div>

      {/* Animated Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {statCards.map((card, i) => (
          <div
            key={card.title}
            className={`bg-gradient-to-br ${card.gradient} text-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-fade-in`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-white/80">{card.title}</p>
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold font-display">{card.value}</p>
            <p className="text-xs text-white/70 mt-1">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Class Fee Defaults - Manager only */}
      {user?.role === "manager" && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-8 animate-fade-in" style={{ animationDelay: "400ms" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold font-display flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-primary" /> Default Class Fees
              </h2>
              <p className="text-sm text-muted-foreground">Set default annual fee for each class. This will auto-fill when adding students.</p>
            </div>
            <Button size="sm" onClick={handleSaveClassFees} disabled={savingFees} className="gap-2">
              {savingFees ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Fees
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {ALL_CLASSES.map((cls) => (
              <div key={cls} className="space-y-1">
                <Label className="text-xs font-medium">{cls}</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={editFees[cls] || ""}
                  onChange={(e) => setEditFees((prev) => ({ ...prev, [cls]: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in" style={{ animationDelay: "500ms" }}>
          <h2 className="text-lg font-bold font-display mb-4">Recent Staff</h2>
          <div className="space-y-3">
            {staff.slice(-4).reverse().map((member) => (
              <div key={member.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{member.role.replace("_", " ")}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${member.salaryPaid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                  {member.salaryPaid ? "Paid" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in" style={{ animationDelay: "600ms" }}>
          <h2 className="text-lg font-bold font-display mb-4">Recent Students</h2>
          <div className="space-y-3">
            {students.slice(-4).reverse().map((student) => (
              <div key={student.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-xs font-bold text-secondary">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{student.name}</p>
                    <p className="text-xs text-muted-foreground">Class {student.className} ({student.section})</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${student.feePaid ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                  {student.feePaid ? "Fee Paid" : "Unpaid"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
