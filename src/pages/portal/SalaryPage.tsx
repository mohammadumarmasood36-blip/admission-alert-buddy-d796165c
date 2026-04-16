import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/portal/DashboardLayout";
import { useSchool } from "@/context/SchoolContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle, Banknote, Pencil, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const MONTHS = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];

function getFinancialYear(session: string): { months: { month: string; year: number }[] } {
  const parts = session.split("-");
  const startYear = Number(parts[0]);
  const endYearShort = Number(parts[1]);
  const endYear = endYearShort < 100 ? 2000 + endYearShort : endYearShort;
  return {
    months: MONTHS.map((m, i) => ({
      month: m,
      year: i < 9 ? startYear : endYear,
    })),
  };
}

export default function SalaryPage() {
  const { staff, updateStaffSalary } = useSchool();
  const { session } = useAuth();
  const [salaryPayments, setSalaryPayments] = useState<any[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[0]);

  const fy = useMemo(() => getFinancialYear(session), [session]);
  const currentMonthData = fy.months.find((m) => m.month === selectedMonth);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("salary_payments").select("*");
      if (data) setSalaryPayments(data);
    };
    load();
  }, []);

  const isMonthPaid = (staffId: string, month: string, year: number) => {
    return salaryPayments.some((p) => p.staff_id === staffId && p.month === month && p.year === year && p.paid);
  };

  const handlePay = async (staffId: string, name: string) => {
    if (!currentMonthData) return;
    const member = staff.find((s) => s.id === staffId);
    if (!member) return;

    const { error } = await supabase.from("salary_payments").upsert({
      staff_id: staffId,
      month: currentMonthData.month,
      year: currentMonthData.year,
      amount: member.salary,
      paid: true,
      paid_date: new Date().toISOString().split("T")[0],
    } as any, { onConflict: "staff_id,month,year" });

    if (error) { toast.error("Failed to record payment"); return; }

    setSalaryPayments((prev) => {
      const existing = prev.findIndex((p) => p.staff_id === staffId && p.month === currentMonthData.month && p.year === currentMonthData.year);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], paid: true, amount: member.salary, paid_date: new Date().toISOString().split("T")[0] };
        return updated;
      }
      return [...prev, { staff_id: staffId, month: currentMonthData.month, year: currentMonthData.year, amount: member.salary, paid: true }];
    });
    toast.success(`Salary sent to ${name} for ${selectedMonth}`);
  };

  const handleEditSalary = () => {
    if (!selectedId || !editValue) return;
    updateStaffSalary(selectedId, Number(editValue));
    toast.success("Salary updated");
    setEditOpen(false);
  };

  const totalBudget = staff.reduce((sum, s) => sum + s.salary, 0);
  const monthPaidCount = currentMonthData
    ? staff.filter((s) => isMonthPaid(s.id, currentMonthData.month, currentMonthData.year)).length
    : 0;
  const monthPaidAmount = currentMonthData
    ? salaryPayments
        .filter((p) => p.month === currentMonthData.month && p.year === currentMonthData.year && p.paid)
        .reduce((sum, p) => sum + Number(p.amount), 0)
    : 0;

  // Monthly overview for each staff
  const getStaffMonthlyStatus = (staffId: string) => {
    return fy.months.map(({ month, year }) => ({
      month,
      year,
      paid: isMonthPaid(staffId, month, year),
    }));
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Salary Management</h1>
          <p className="text-muted-foreground mt-1">Monthly salary tracking — Session {session}</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-primary text-primary-foreground rounded-xl p-5">
          <p className="text-sm opacity-80 mb-1">Monthly Budget</p>
          <p className="text-2xl font-bold font-display">₹ {totalBudget.toLocaleString()}</p>
        </div>
        <div className="bg-emerald-600 text-white rounded-xl p-5">
          <p className="text-sm opacity-80 mb-1">{selectedMonth} Paid</p>
          <p className="text-2xl font-bold font-display">₹ {monthPaidAmount.toLocaleString()}</p>
          <p className="text-xs opacity-70 mt-1">{monthPaidCount}/{staff.length} staff paid</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground mb-1">{selectedMonth} Remaining</p>
          <p className="text-2xl font-bold font-display">₹ {(totalBudget - monthPaidAmount).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-muted text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="text-left px-6 py-3">Staff Member</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Salary</th>
                <th className="text-center px-2 py-3">Monthly Status</th>
                <th className="text-right px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-muted-foreground">
                    <Banknote className="w-10 h-10 mb-3 opacity-40 mx-auto" />
                    <p>No staff members</p>
                  </td>
                </tr>
              ) : (
                staff.map((member) => {
                  const monthlyStatus = getStaffMonthlyStatus(member.id);
                  const isPaidThisMonth = currentMonthData ? isMonthPaid(member.id, currentMonthData.month, currentMonthData.year) : false;
                  return (
                    <tr key={member.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {member.photoUrl ? (
                            <img src={member.photoUrl} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {member.name.charAt(0)}
                            </div>
                          )}
                          <span className="font-medium text-sm">{member.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm capitalize">{member.role.replace("_", " ")}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <span className="text-sm">₹ {member.salary.toLocaleString()}</span>
                          <button
                            onClick={() => { setSelectedId(member.id); setEditValue(String(member.salary)); setEditOpen(true); }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-4">
                        <div className="flex gap-0.5 justify-center flex-wrap">
                          {monthlyStatus.map((ms, i) => (
                            <div
                              key={ms.month}
                              title={`${ms.month} ${ms.year}: ${ms.paid ? "Paid" : "Pending"}`}
                              className={`w-5 h-5 rounded text-[8px] flex items-center justify-center font-bold cursor-default ${
                                ms.paid ? "bg-emerald-500 text-white" : ms.month === selectedMonth ? "bg-amber-100 text-amber-700 border border-amber-300" : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {ms.month.charAt(0)}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isPaidThisMonth ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-0 gap-1">
                            <CheckCircle className="w-3 h-3" /> Paid
                          </Badge>
                        ) : (
                          <Button size="sm" onClick={() => handlePay(member.id, member.name)}>
                            Send Salary
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Edit Salary</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>New Salary (₹)</Label>
              <Input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="mt-1.5" />
            </div>
            <Button onClick={handleEditSalary} className="w-full">Update Salary</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
