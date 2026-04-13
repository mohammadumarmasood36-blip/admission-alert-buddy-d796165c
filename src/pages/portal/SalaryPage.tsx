import { useState } from "react";
import DashboardLayout from "@/components/portal/DashboardLayout";
import { useSchool } from "@/context/SchoolContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CheckCircle, Banknote, RotateCcw, Pencil } from "lucide-react";
import { toast } from "sonner";

export default function SalaryPage() {
  const { staff, paySalary, resetSalaries, updateStaffSalary } = useSchool();
  const [editOpen, setEditOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handlePay = (id: string, name: string) => {
    paySalary(id);
    toast.success(`Salary sent to ${name}`);
  };

  const handleEditSalary = () => {
    if (!selectedId || !editValue) return;
    updateStaffSalary(selectedId, Number(editValue));
    toast.success("Salary updated");
    setEditOpen(false);
  };

  const totalBudget = staff.reduce((sum, s) => sum + s.salary, 0);
  const totalPaid = staff.filter((s) => s.salaryPaid).reduce((sum, s) => sum + s.salary, 0);

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Salary Management</h1>
          <p className="text-muted-foreground mt-1">Send monthly salaries to staff</p>
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={() => { resetSalaries(); toast.info("Salary statuses reset for new month"); }}>
          <RotateCcw className="w-4 h-4" /> New Month
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-primary text-primary-foreground rounded-xl p-5">
          <p className="text-sm opacity-80 mb-1">Total Budget</p>
          <p className="text-2xl font-bold font-display">₨ {totalBudget.toLocaleString()}</p>
        </div>
        <div className="bg-success text-success-foreground rounded-xl p-5">
          <p className="text-sm opacity-80 mb-1">Paid Out</p>
          <p className="text-2xl font-bold font-display">₨ {totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground mb-1">Remaining</p>
          <p className="text-2xl font-bold font-display">₨ {(totalBudget - totalPaid).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[550px]">
            <thead>
              <tr className="bg-muted text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="text-left px-6 py-3">Staff Member</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Salary</th>
                <th className="text-left px-4 py-3">Status</th>
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
                staff.map((member) => (
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
                    <td className="px-4 py-4 text-sm capitalize">{member.role}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <span className="text-sm">₨ {member.salary.toLocaleString()}</span>
                        <button
                          onClick={() => { setSelectedId(member.id); setEditValue(String(member.salary)); setEditOpen(true); }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${member.salaryPaid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {member.salaryPaid ? "Paid" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {member.salaryPaid ? (
                        <CheckCircle className="w-5 h-5 text-success inline-block" />
                      ) : (
                        <Button size="sm" onClick={() => handlePay(member.id, member.name)}>
                          Send Salary
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Salary Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Edit Salary</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>New Salary (₨)</Label>
              <Input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="mt-1.5" />
            </div>
            <Button onClick={handleEditSalary} className="w-full">Update Salary</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
