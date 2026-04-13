import { useState } from "react";
import DashboardLayout from "@/components/portal/DashboardLayout";
import { useSchool, StaffRole, ALL_CLASSES, ClassName } from "@/context/SchoolContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Users, Pencil, Eye, FileText, Camera } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const roleBadgeStyles: Record<StaffRole, string> = {
  principal: "bg-primary/10 text-primary",
  manager: "bg-warning/10 text-warning",
  teacher: "bg-info/10 text-info",
  cashier: "bg-secondary/10 text-secondary",
  exam_incharge: "bg-accent/10 text-accent-foreground",
};

export default function StaffPage() {
  const { staff, addStaff, removeStaff, updateStaffSalary, updateStaff } = useSchool();
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editSalaryOpen, setEditSalaryOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState<StaffRole>("teacher");
  const [salary, setSalary] = useState("");
  const [editSalary, setEditSalary] = useState("");
  const [teachingClasses, setTeachingClasses] = useState<ClassName[]>([]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<string>("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeFile, setResumeFile] = useState<string>("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [joinDate, setJoinDate] = useState("");

  const handleAdd = () => {
    if (!name.trim() || !salary) {
      toast.error("Please fill all required fields");
      return;
    }
    if ((role === "teacher" || role === "exam_incharge") && !mobileNumber.trim()) {
      toast.error("Please enter mobile number");
      return;
    }
    if ((role === "teacher" || role === "exam_incharge") && !password.trim()) {
      toast.error("Please create a password for login");
      return;
    }
    addStaff({
      name: name.trim(),
      role,
      salary: Number(salary),
      teachingClasses,
      photoUrl: photoUrl || undefined,
      photoFile: photoFile || undefined,
      resumeFileName: resumeFileName || undefined,
      resumeFile: resumeFile || undefined,
      mobileNumber: mobileNumber || undefined,
      loginPassword: password || undefined,
      joinDate: joinDate || undefined,
    });
    toast.success(`${name} added as ${role}. Login credentials will be sent to mobile.`);
    resetForm();
    setOpen(false);
  };

  const resetForm = () => {
    setName("");
    setRole("teacher");
    setSalary("");
    setTeachingClasses([]);
    setPhotoUrl("");
    setPhotoFile("");
    setResumeFileName("");
    setResumeFile("");
    setMobileNumber("");
    setPassword("");
    setJoinDate("");
  };

  const handleEditSalary = () => {
    if (!selectedStaff || !editSalary) return;
    updateStaffSalary(selectedStaff, Number(editSalary));
    toast.success("Salary updated");
    setEditSalaryOpen(false);
    setSelectedStaff(null);
  };

  const toggleClass = (cls: ClassName) => {
    setTeachingClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );
  };

  const viewedStaff = staff.find((s) => s.id === selectedStaff);

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Staff Management</h1>
          <p className="text-muted-foreground mt-1">Add and manage your school staff</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" /> Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">Add New Staff Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Full Name *</Label>
                <Input placeholder="Enter full name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label>Role *</Label>
                <Select value={role} onValueChange={(v) => setRole(v as StaffRole)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="principal">Principal</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="exam_incharge">Exam Incharge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Monthly Salary (₨) *</Label>
                <Input type="number" placeholder="e.g. 45000" value={salary} onChange={(e) => setSalary(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label>Photo (PNG/JPG/JPEG)</Label>
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (!file.name.match(/\.(jpg|jpeg|png)$/i)) {
                        toast.error("Only PNG/JPG/JPEG files are allowed for photo");
                        e.target.value = "";
                        return;
                      }
                      setPhotoUrl(file.name);
                      const reader = new FileReader();
                      reader.onload = (ev) => setPhotoFile(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Resume (PDF only)</Label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (!file.name.match(/\.pdf$/i)) {
                        toast.error("Only PDF files are allowed for resume");
                        e.target.value = "";
                        return;
                      }
                      setResumeFileName(file.name);
                      const reader = new FileReader();
                      reader.onload = (ev) => setResumeFile(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Joining Date</Label>
                <Input type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label>Mobile Number *</Label>
                <Input
                  type="tel"
                  placeholder="e.g. 03001234567"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Login Password *</Label>
                <Input
                  type="password"
                  placeholder="Create a password for login"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              {(role === "teacher" || role === "exam_incharge") && (
                <div>
                  <Label>Teaching Classes</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ALL_CLASSES.map((cls) => (
                      <button
                        key={cls}
                        onClick={() => toggleClass(cls)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          teachingClasses.includes(cls)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted text-muted-foreground border-border hover:bg-accent"
                        }`}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <Button onClick={handleAdd} className="w-full">Add Staff Member</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Responsive table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-muted text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="text-left px-6 py-3">Name</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Salary</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Classes</th>
                <th className="text-right px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-muted-foreground">
                    <Users className="w-10 h-10 mb-3 opacity-40 mx-auto" />
                    <p>No staff members yet</p>
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {member.photoFile ? (
                          <img src={member.photoFile} alt={member.name} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {member.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-sm block">{member.name}</span>
                          {member.resumeFileName && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <FileText className="w-3 h-3" /> {member.resumeFileName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${roleBadgeStyles[member.role]}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">₨ {member.salary.toLocaleString()}</td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      {member.teachingClasses.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {member.teachingClasses.map((c) => (
                            <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedStaff(member.id); setViewOpen(true); }}>
                          <Eye className="w-4 h-4 text-info" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedStaff(member.id); setEditSalary(String(member.salary)); setEditSalaryOpen(true); }}>
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { removeStaff(member.id); toast.success("Staff removed"); }}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Staff Detail */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Staff Details</DialogTitle>
          </DialogHeader>
          {viewedStaff && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-4">
                {viewedStaff.photoFile ? (
                  <img src={viewedStaff.photoFile} alt={viewedStaff.name} className="w-20 h-20 rounded-xl object-cover border-2 border-primary/20" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                    {viewedStaff.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold">{viewedStaff.name}</h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${roleBadgeStyles[viewedStaff.role]}`}>
                    {viewedStaff.role.replace("_", " ")}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Salary</p>
                  <p className="font-medium">₨ {viewedStaff.salary.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Join Date</p>
                  <p className="font-medium">{viewedStaff.joinDate || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Salary Status</p>
                  <p className={`font-medium ${viewedStaff.salaryPaid ? "text-success" : "text-warning"}`}>
                    {viewedStaff.salaryPaid ? "Paid" : "Pending"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Mobile Number</p>
                  <p className="font-medium">{viewedStaff.mobileNumber || "—"}</p>
                </div>
              </div>
              {viewedStaff.teachingClasses.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs mb-2">Teaching Classes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {viewedStaff.teachingClasses.map((c) => (
                      <Badge key={c} variant="outline">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {/* Photo Display */}
              {viewedStaff.photoFile && (
                <div>
                  <p className="text-muted-foreground text-xs mb-2 flex items-center gap-1"><Camera className="w-3 h-3" /> Photo</p>
                  <img src={viewedStaff.photoFile} alt={viewedStaff.name} className="w-full max-w-[300px] rounded-lg border border-border" />
                </div>
              )}
              {/* Resume PDF Viewer */}
              {viewedStaff.resumeFile && (
                <div>
                  <p className="text-muted-foreground text-xs mb-2 flex items-center gap-1"><FileText className="w-3 h-3" /> Resume (PDF)</p>
                  <iframe
                    src={viewedStaff.resumeFile}
                    className="w-full h-[400px] rounded-lg border border-border"
                    title="Resume PDF"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Salary Dialog */}
      <Dialog open={editSalaryOpen} onOpenChange={setEditSalaryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Edit Salary</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>New Salary (₨)</Label>
              <Input type="number" value={editSalary} onChange={(e) => setEditSalary(e.target.value)} className="mt-1.5" />
            </div>
            <Button onClick={handleEditSalary} className="w-full">Update Salary</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
