import { useState, useMemo, useRef, useEffect } from "react";
import DashboardLayout from "@/components/portal/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useSchool, ALL_CLASSES, ClassName } from "@/context/SchoolContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, GraduationCap, Users, Trash2, Settings, CreditCard, Bus, Upload, Pencil, UserCheck, Copy, Printer, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import StudentIdCard from "@/components/portal/StudentIdCard";
import SubjectMultiSelect from "@/components/portal/SubjectMultiSelect";
import { isSeniorClass } from "@/lib/seniorClasses";
import type { Student } from "@/context/SchoolContext";

export default function StudentsPage() {
  const { students, addStudent, removeStudent, updateStudent, classes, addSection, removeSection } = useSchool();
  const { user } = useAuth();
  const canAddStudents = user?.role === "cashier" || user?.role === "teacher";
  const isViewOnly = !canAddStudents;
  const [addOpen, setAddOpen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassName | null>(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [viewClass, setViewClass] = useState<ClassName | null>(null);
  const [viewSectionFilter, setViewSectionFilter] = useState<string>("all");
  const [idCardStudent, setIdCardStudent] = useState<Student | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [classTeachers, setClassTeachers] = useState<any[]>([]);
  const [classFeeDefaults, setClassFeeDefaults] = useState<Record<string, number>>({});
  const [credentialsDialog, setCredentialsDialog] = useState<{ admissionNumber: string; password: string; studentName: string } | null>(null);
  const { staff } = useSchool();

  useEffect(() => {
    const load = async () => {
      const [ctRes, feeRes] = await Promise.all([
        supabase.from("class_teacher_assignments").select("*"),
        supabase.from("class_fee_defaults").select("*"),
      ]);
      if (ctRes.data) setClassTeachers(ctRes.data);
      if (feeRes.data) {
        const map: Record<string, number> = {};
        feeRes.data.forEach((r: any) => { map[r.class_name] = Number(r.annual_fee); });
        setClassFeeDefaults(map);
      }
    };
    load();
  }, []);

  const getClassTeacher = (className: string, sectionName: string) => {
    const assignment = classTeachers.find((a) => a.class_name === className && a.section_name === sectionName);
    if (!assignment?.staff_id) return null;
    return staff.find((s) => s.id === assignment.staff_id);
  };

  // New student form state
  const [formData, setFormData] = useState({
    name: "",
    className: "Nursery" as ClassName,
    feeAmount: "",
    photoFile: "",
    fatherName: "",
    fatherMobile: "",
    fatherEmail: "",
    motherName: "",
    motherMobile: "",
    motherEmail: "",
    address: "",
    transportFacility: false,
    pickupLocation: "",
    busNumber: "",
    parentPassword: "",
  });
  const [formSubjects, setFormSubjects] = useState<string[]>([]);
  const [editSubjects, setEditSubjects] = useState<string[]>([]);

  // Reset selected subjects when class changes
  useEffect(() => { setFormSubjects([]); }, [formData.className]);

  const updateForm = (field: string, value: any) => setFormData((prev) => ({ ...prev, [field]: value }));

  const currentClassData = classes.find((c) => c.name === formData.className);
  const selectedClassData = classes.find((c) => c.name === selectedClass);

  // Auto-generate admission number (4-digit numeric only)
  const nextAdmissionNumber = useMemo(() => {
    const existingNums = students
      .map((s) => parseInt(s.admissionNumber, 10))
      .filter((n) => !isNaN(n));
    const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
    return String(maxNum + 1).padStart(4, "0");
  }, [students]);

  // Auto-assign section (pick the section with fewest students)
  const getAutoSection = (className: ClassName): string => {
    const classSections = classes.find((c) => c.name === className)?.sections || [];
    if (classSections.length === 0) return "";
    if (classSections.length === 1) return classSections[0].name;

    const sectionCounts = classSections.map((sec) => ({
      name: sec.name,
      count: students.filter((s) => s.className === className && s.section === sec.name).length,
    }));
    sectionCounts.sort((a, b) => a.count - b.count);
    return sectionCounts[0].name;
  };

  // Auto roll number: count students in that class+section sorted by name, assign next
  const getAutoRollNumber = (className: ClassName, section: string): number => {
    const classStudents = students.filter((s) => s.className === className && s.section === section);
    return classStudents.length + 1;
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => updateForm("photoFile", reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveStudentSubjects = async (studentId: string, subjects: string[]) => {
    // Replace existing subjects: delete all, then insert new
    await supabase.from("student_subjects").delete().eq("student_id", studentId);
    if (subjects.length > 0) {
      await supabase.from("student_subjects").insert(
        subjects.map((s) => ({ student_id: studentId, subject_name: s }))
      );
    }
  };

  const handleAdd = async () => {
    if (!formData.name.trim() || !formData.feeAmount) {
      toast.error("Please fill required fields (Name & Fee Amount)");
      return;
    }
    if (!formData.parentPassword.trim()) {
      toast.error("Please create a parent login password");
      return;
    }
    if (isSeniorClass(formData.className) && formSubjects.length === 0) {
      toast.error("Please select at least one subject for this class");
      return;
    }
    const autoSection = getAutoSection(formData.className);
    if (!autoSection) {
      toast.error("Please add at least one section to this class first");
      return;
    }

    const result = await addStudent({
      name: formData.name.trim(),
      className: formData.className,
      section: autoSection,
      feeAmount: Number(formData.feeAmount),
      photoFile: formData.photoFile || undefined,
      fatherName: formData.fatherName || undefined,
      fatherMobile: formData.fatherMobile || undefined,
      fatherEmail: formData.fatherEmail || undefined,
      motherName: formData.motherName || undefined,
      motherMobile: formData.motherMobile || undefined,
      motherEmail: formData.motherEmail || undefined,
      address: formData.address || undefined,
      transportFacility: formData.transportFacility,
      pickupLocation: formData.transportFacility ? formData.pickupLocation || undefined : undefined,
      busNumber: formData.transportFacility ? formData.busNumber || undefined : undefined,
      parentPassword: formData.parentPassword || undefined,
    });

    if (result && formSubjects.length > 0) {
      // Find the new student id by admission number
      const { data } = await supabase
        .from("students")
        .select("id")
        .eq("admission_number", result.admissionNumber)
        .single();
      if (data?.id) await saveStudentSubjects(data.id, formSubjects);
    }

    setFormData({
      name: "", className: "Nursery", feeAmount: "", photoFile: "",
      fatherName: "", fatherMobile: "", fatherEmail: "",
      motherName: "", motherMobile: "", motherEmail: "",
      address: "", transportFacility: false, pickupLocation: "", busNumber: "",
      parentPassword: "",
    });
    setFormSubjects([]);
    setAddOpen(false);

    if (result) {
      setCredentialsDialog(result);
    }
  };

  const handleAddSection = () => {
    if (!newSectionName.trim() || !selectedClass) return;
    addSection(selectedClass, newSectionName.trim().toUpperCase());
    toast.success(`Section ${newSectionName.toUpperCase()} added to ${selectedClass}`);
    setNewSectionName("");
  };

  // Sort students by section then by name within section, assign roll from 1 per section
  const getSortedStudents = (cls: ClassName) => {
    let classStudents = [...students.filter((s) => s.className === cls)];
    // Sort by section, then by name
    classStudents.sort((a, b) => {
      if (a.section !== b.section) return a.section.localeCompare(b.section);
      return a.name.localeCompare(b.name);
    });
    // Apply section filter
    if (viewSectionFilter !== "all") {
      classStudents = classStudents.filter((s) => s.section === viewSectionFilter);
    }
    return classStudents;
  };

  // Get roll number (1-based per section)
  const getRollNumber = (student: { className: string; section: string; name: string }) => {
    const sectionStudents = students
      .filter((s) => s.className === student.className && s.section === student.section)
      .sort((a, b) => a.name.localeCompare(b.name));
    return sectionStudents.findIndex((s) => s.name === student.name) + 1;
  };

  const openEdit = async (student: Student) => {
    setEditStudent(student);
    setEditFormData({
      name: student.name,
      feeAmount: String(student.feeAmount),
      photoFile: student.photoFile || "",
      fatherName: student.fatherName || "",
      fatherMobile: student.fatherMobile || "",
      fatherEmail: student.fatherEmail || "",
      motherName: student.motherName || "",
      motherMobile: student.motherMobile || "",
      motherEmail: student.motherEmail || "",
      address: student.address || "",
      transportFacility: student.transportFacility || false,
      pickupLocation: student.pickupLocation || "",
      busNumber: student.busNumber || "",
    });
    // Load student subjects
    const { data } = await supabase
      .from("student_subjects")
      .select("subject_name")
      .eq("student_id", student.id);
    setEditSubjects((data || []).map((r: any) => r.subject_name));
    setEditOpen(true);
  };

  const handleEditPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setEditFormData((p: any) => ({ ...p, photoFile: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleEditSave = async () => {
    if (!editStudent) return;
    if (isSeniorClass(editStudent.className) && editSubjects.length === 0) {
      toast.error("Please select at least one subject for this class");
      return;
    }
    updateStudent(editStudent.id, {
      name: editFormData.name,
      feeAmount: Number(editFormData.feeAmount),
      photoFile: editFormData.photoFile || undefined,
      fatherName: editFormData.fatherName || undefined,
      fatherMobile: editFormData.fatherMobile || undefined,
      fatherEmail: editFormData.fatherEmail || undefined,
      motherName: editFormData.motherName || undefined,
      motherMobile: editFormData.motherMobile || undefined,
      motherEmail: editFormData.motherEmail || undefined,
      address: editFormData.address || undefined,
      transportFacility: editFormData.transportFacility,
      pickupLocation: editFormData.transportFacility ? editFormData.pickupLocation || undefined : undefined,
      busNumber: editFormData.transportFacility ? editFormData.busNumber || undefined : undefined,
    });
    await saveStudentSubjects(editStudent.id, editSubjects);
    toast.success(`${editFormData.name} updated`);
    setEditOpen(false);
    setEditStudent(null);
  };

  const handleDeleteStudent = (student: Student) => {
    if (confirm(`Are you sure you want to remove ${student.name}?`)) {
      removeStudent(student.id);
      toast.success(`${student.name} removed`);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Students</h1>
          <p className="text-muted-foreground mt-1">Manage classes, sections & students</p>
        </div>
        {!isViewOnly && <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto"><Plus className="w-4 h-4" /> Add Student</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">Enroll New Student</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              {/* Auto Admission Number */}
              <div className="bg-muted/50 border border-border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Admission Number (Auto)</p>
                  <p className="font-bold font-mono text-lg">{nextAdmissionNumber}</p>
                </div>
                <Badge variant="secondary">Auto Generated</Badge>
              </div>

              {/* Student Photo */}
              <div>
                <Label className="text-sm font-semibold">Student Photo</Label>
                <div className="mt-2 flex items-center gap-4">
                  {formData.photoFile ? (
                    <img src={formData.photoFile} alt="Student" className="w-20 h-20 rounded-lg object-cover border border-border" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <Input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-sm" />
                    <p className="text-xs text-muted-foreground mt-1">Upload passport-size photo</p>
                  </div>
                </div>
              </div>

              {/* Student Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name <span className="text-destructive">*</span></Label>
                  <Input placeholder="Student full name" value={formData.name} onChange={(e) => updateForm("name", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Class <span className="text-destructive">*</span></Label>
                  <Select value={formData.className} onValueChange={(v) => {
                    updateForm("className", v);
                    // Auto-fill fee from class defaults
                    const defaultFee = classFeeDefaults[v];
                    if (defaultFee) updateForm("feeAmount", String(defaultFee));
                  }}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {ALL_CLASSES.map((cls) => (
                        <SelectItem key={cls} value={cls}>Class {cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Auto Section Info */}
              <div className="bg-muted/50 border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Section (Auto-assigned for equal distribution)</p>
                <div className="flex flex-wrap gap-2">
                  {currentClassData?.sections.map((s) => {
                    const count = students.filter((st) => st.className === formData.className && st.section === s.name).length;
                    const isNext = getAutoSection(formData.className) === s.name;
                    return (
                      <Badge key={s.id} variant={isNext ? "default" : "outline"} className="gap-1">
                        {s.name} ({count} students) {isNext && "← Next"}
                      </Badge>
                    );
                  })}
                  {(!currentClassData?.sections.length) && (
                    <p className="text-sm text-destructive">No sections! Add sections to this class first.</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Fee Amount (₨) <span className="text-destructive">*</span></Label>
                <Input type="number" placeholder="e.g. 5000" value={formData.feeAmount} onChange={(e) => updateForm("feeAmount", e.target.value)} className="mt-1.5" />
              </div>

              {/* Father Details */}
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">F</span>
                  Father's Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input placeholder="Father's name" value={formData.fatherName} onChange={(e) => updateForm("fatherName", e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Mobile</Label>
                    <Input placeholder="Mobile number" value={formData.fatherMobile} onChange={(e) => updateForm("fatherMobile", e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input type="email" placeholder="Email ID" value={formData.fatherEmail} onChange={(e) => updateForm("fatherEmail", e.target.value)} className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Mother Details */}
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-accent/50 text-accent-foreground flex items-center justify-center text-xs">M</span>
                  Mother's Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input placeholder="Mother's name" value={formData.motherName} onChange={(e) => updateForm("motherName", e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Mobile</Label>
                    <Input placeholder="Mobile number" value={formData.motherMobile} onChange={(e) => updateForm("motherMobile", e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input type="email" placeholder="Email ID" value={formData.motherEmail} onChange={(e) => updateForm("motherEmail", e.target.value)} className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <Label>Address</Label>
                <Textarea placeholder="Full residential address" value={formData.address} onChange={(e) => updateForm("address", e.target.value)} className="mt-1.5" rows={2} />
              </div>

              {/* Transport */}
              <div className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bus className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm font-semibold">Transport Facility</Label>
                  </div>
                  <Switch checked={formData.transportFacility} onCheckedChange={(v) => updateForm("transportFacility", v)} />
                </div>
                {formData.transportFacility && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <Label className="text-xs">Pickup Location</Label>
                      <Input placeholder="e.g. Sector 21, Main Road" value={formData.pickupLocation} onChange={(e) => updateForm("pickupLocation", e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Bus Number</Label>
                      <Input placeholder="e.g. Bus 03" value={formData.busNumber} onChange={(e) => updateForm("busNumber", e.target.value)} className="mt-1" />
                    </div>
                  </div>
                )}
              </div>

              {/* Parent Login Password */}
              <div>
                <Label>Parent Login Password <span className="text-destructive">*</span></Label>
                <Input type="password" placeholder="Create password for parent portal login" value={formData.parentPassword} onChange={(e) => updateForm("parentPassword", e.target.value)} className="mt-1.5" />
                <p className="text-xs text-muted-foreground mt-1">This password along with admission number will be sent to father & mother mobile</p>
              </div>

              <Button onClick={handleAdd} className="w-full" size="lg">Enroll Student</Button>
            </div>
          </DialogContent>
        </Dialog>}
      </div>

      {/* Class Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
        {classes.map((cls, index) => {
          const studentCount = students.filter((s) => s.className === cls.name).length;
          const colorPalette = [
            { bg: "bg-rose-600/25", border: "border-rose-600/50", text: "text-rose-800 dark:text-rose-300", accent: "bg-rose-600" },
            { bg: "bg-sky-600/25", border: "border-sky-600/50", text: "text-sky-800 dark:text-sky-300", accent: "bg-sky-600" },
            { bg: "bg-amber-600/25", border: "border-amber-600/50", text: "text-amber-800 dark:text-amber-300", accent: "bg-amber-600" },
            { bg: "bg-emerald-600/25", border: "border-emerald-600/50", text: "text-emerald-800 dark:text-emerald-300", accent: "bg-emerald-600" },
            { bg: "bg-violet-600/25", border: "border-violet-600/50", text: "text-violet-800 dark:text-violet-300", accent: "bg-violet-600" },
            { bg: "bg-pink-600/25", border: "border-pink-600/50", text: "text-pink-800 dark:text-pink-300", accent: "bg-pink-600" },
            { bg: "bg-teal-600/25", border: "border-teal-600/50", text: "text-teal-800 dark:text-teal-300", accent: "bg-teal-600" },
            { bg: "bg-orange-600/25", border: "border-orange-600/50", text: "text-orange-800 dark:text-orange-300", accent: "bg-orange-600" },
            { bg: "bg-cyan-600/25", border: "border-cyan-600/50", text: "text-cyan-800 dark:text-cyan-300", accent: "bg-cyan-600" },
            { bg: "bg-fuchsia-600/25", border: "border-fuchsia-600/50", text: "text-fuchsia-800 dark:text-fuchsia-300", accent: "bg-fuchsia-600" },
            { bg: "bg-lime-600/25", border: "border-lime-600/50", text: "text-lime-800 dark:text-lime-300", accent: "bg-lime-600" },
            { bg: "bg-indigo-600/25", border: "border-indigo-600/50", text: "text-indigo-800 dark:text-indigo-300", accent: "bg-indigo-600" },
            { bg: "bg-red-600/25", border: "border-red-600/50", text: "text-red-800 dark:text-red-300", accent: "bg-red-600" },
            { bg: "bg-blue-600/25", border: "border-blue-600/50", text: "text-blue-800 dark:text-blue-300", accent: "bg-blue-600" },
            { bg: "bg-yellow-600/25", border: "border-yellow-600/50", text: "text-yellow-800 dark:text-yellow-300", accent: "bg-yellow-600" },
          ];
          const color = colorPalette[index % colorPalette.length];
          const isSelected = viewClass === cls.name;

          return (
            <div
              key={cls.name}
              className={`${color.bg} border ${isSelected ? `${color.border} ring-2 ring-offset-1` : color.border} rounded-xl p-4 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]`}
              onClick={() => setViewClass(viewClass === cls.name ? null : cls.name)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${color.accent}`} />
                  <h3 className={`font-bold text-sm font-display ${color.text}`}>Class {cls.name}</h3>
                </div>
                {!isViewOnly && <button
                  onClick={(e) => { e.stopPropagation(); setSelectedClass(cls.name); setSectionOpen(true); }}
                  className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Users className="w-3 h-3" /> {studentCount} students
              </div>
              <div className="flex flex-wrap gap-1">
                {cls.sections.map((s) => {
                  const ct = getClassTeacher(cls.name, s.name);
                  return (
                    <div key={s.id} className="flex flex-col">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${color.border} ${color.text}`}>{s.name}</Badge>
                      {ct && (
                        <span className="text-[9px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                          <UserCheck className="w-2.5 h-2.5" /> {ct.name.split(" ")[0]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Students list for selected class */}
      {viewClass && (
        <div className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
          <div className="px-6 py-4 border-b border-border bg-muted/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-bold font-display">Class {viewClass} — Students</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Section:</span>
              <Select value={viewSectionFilter} onValueChange={setViewSectionFilter}>
                <SelectTrigger className="w-[120px] h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {classes.find((c) => c.name === viewClass)?.sections.map((s) => (
                    <SelectItem key={s.id} value={s.name}>Section {s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Roll</th>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Section</th>
                  <th className="text-left px-4 py-3">Adm. No.</th>
                  <th className="text-left px-4 py-3">Father</th>
                      <th className="text-left px-4 py-3">Mobile</th>
                      <th className="text-left px-4 py-3">Transport</th>
                      <th className="text-left px-4 py-3">ID Card</th>
                  {!isViewOnly && <th className="text-left px-4 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {getSortedStudents(viewClass).length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-10 text-muted-foreground">
                      <GraduationCap className="w-8 h-8 mb-2 opacity-40 mx-auto" />
                      <p className="text-sm">No students in this class</p>
                    </td>
                  </tr>
                ) : (
                  getSortedStudents(viewClass).map((student, idx) => (
                    <tr key={student.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono font-bold">{getRollNumber(student)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {student.photoFile ? (
                            <img src={student.photoFile} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-xs font-bold text-secondary">
                              {student.name.charAt(0)}
                            </div>
                          )}
                          <span className="font-medium text-sm">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{student.section}</td>
                      <td className="px-4 py-3 text-xs font-mono">{student.admissionNumber}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{student.fatherName || "—"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{student.fatherMobile || student.motherMobile || "—"}</td>
                      <td className="px-4 py-3">
                        {student.transportFacility ? (
                          <Badge variant="outline" className="text-xs gap-1"><Bus className="w-3 h-3" />{student.busNumber || "Yes"}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setIdCardStudent(student)}>
                          <CreditCard className="w-3.5 h-3.5" /> Print
                        </Button>
                      </td>
                      {!isViewOnly && <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="text-xs h-7 w-7 p-0" onClick={() => openEdit(student)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-xs h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteStudent(student)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!viewClass && (
        <div className="text-center py-10 text-muted-foreground">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Select a class above to view its students</p>
        </div>
      )}

      {/* Manage Sections Dialog */}
      <Dialog open={sectionOpen} onOpenChange={setSectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Manage Sections — Class {selectedClass}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-2">
              {selectedClassData?.sections.map((s) => (
                <div key={s.id} className="flex items-center gap-1 bg-muted rounded-full px-3 py-1.5">
                  <span className="text-sm font-medium">Section {s.name}</span>
                  {selectedClassData.sections.length > 1 && (
                    <button
                      onClick={() => { if (selectedClass) { removeSection(selectedClass, s.id); toast.success(`Section ${s.name} removed`); } }}
                      className="text-destructive hover:text-destructive/80 ml-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. B"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
              />
              <Button onClick={handleAddSection} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {idCardStudent && (
        <StudentIdCard
          student={idCardStudent}
          open={!!idCardStudent}
          onOpenChange={(open) => { if (!open) setIdCardStudent(null); }}
        />
      )}

      {/* Edit Student Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Student — {editStudent?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Photo Update */}
            <div>
              <Label className="text-sm font-semibold">Student Photo</Label>
              <div className="mt-2 flex items-center gap-4">
                {editFormData.photoFile ? (
                  <img src={editFormData.photoFile} alt="Student" className="w-20 h-20 rounded-lg object-cover border border-border" />
                ) : (
                  <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Input type="file" accept="image/*" onChange={handleEditPhotoUpload} className="text-sm" />
                  <p className="text-xs text-muted-foreground mt-1">Update student photo</p>
                </div>
              </div>
            </div>
            <div>
              <Label>Full Name</Label>
              <Input value={editFormData.name || ""} onChange={(e) => setEditFormData((p: any) => ({ ...p, name: e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label>Fee Amount (₨)</Label>
              <Input type="number" value={editFormData.feeAmount || ""} onChange={(e) => setEditFormData((p: any) => ({ ...p, feeAmount: e.target.value }))} className="mt-1.5" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Father's Name</Label>
                <Input value={editFormData.fatherName || ""} onChange={(e) => setEditFormData((p: any) => ({ ...p, fatherName: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Father's Mobile</Label>
                <Input value={editFormData.fatherMobile || ""} onChange={(e) => setEditFormData((p: any) => ({ ...p, fatherMobile: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Father's Email</Label>
                <Input value={editFormData.fatherEmail || ""} onChange={(e) => setEditFormData((p: any) => ({ ...p, fatherEmail: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Mother's Name</Label>
                <Input value={editFormData.motherName || ""} onChange={(e) => setEditFormData((p: any) => ({ ...p, motherName: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Mother's Mobile</Label>
                <Input value={editFormData.motherMobile || ""} onChange={(e) => setEditFormData((p: any) => ({ ...p, motherMobile: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Mother's Email</Label>
                <Input value={editFormData.motherEmail || ""} onChange={(e) => setEditFormData((p: any) => ({ ...p, motherEmail: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Textarea value={editFormData.address || ""} onChange={(e) => setEditFormData((p: any) => ({ ...p, address: e.target.value }))} className="mt-1.5" rows={2} />
            </div>
            <div className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bus className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-semibold">Transport Facility</Label>
                </div>
                <Switch checked={editFormData.transportFacility || false} onCheckedChange={(v) => setEditFormData((p: any) => ({ ...p, transportFacility: v }))} />
              </div>
              {editFormData.transportFacility && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <Label className="text-xs">Pickup Location</Label>
                    <Input value={editFormData.pickupLocation || ""} onChange={(e) => setEditFormData((p: any) => ({ ...p, pickupLocation: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Bus Number</Label>
                    <Input value={editFormData.busNumber || ""} onChange={(e) => setEditFormData((p: any) => ({ ...p, busNumber: e.target.value }))} className="mt-1" />
                  </div>
                </div>
              )}
            </div>
            <Button onClick={handleEditSave} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog open={!!credentialsDialog} onOpenChange={(open) => !open && setCredentialsDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <UserCheck className="h-5 w-5 text-primary" />
              Student Enrolled Successfully
            </DialogTitle>
          </DialogHeader>
          {credentialsDialog && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Share these login credentials with the parent of <strong>{credentialsDialog.studentName}</strong>:
              </p>
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Admission Number</p>
                    <p className="text-lg font-bold tracking-wider">{credentialsDialog.admissionNumber}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(credentialsDialog.admissionNumber);
                      toast.success("Admission number copied");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Password</p>
                    <p className="text-lg font-bold tracking-wider">{credentialsDialog.password}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(credentialsDialog.password);
                      toast.success("Password copied");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Student: ${credentialsDialog.studentName}\nAdmission No: ${credentialsDialog.admissionNumber}\nPassword: ${credentialsDialog.password}`
                    );
                    toast.success("All credentials copied to clipboard");
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" /> Copy All
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const student = students.find(s => s.admissionNumber === credentialsDialog.admissionNumber);
                    const phone = student?.fatherMobile || student?.motherMobile || "";
                    if (!phone) {
                      toast.error("No parent mobile number found for this student");
                      return;
                    }
                    const message = encodeURIComponent(
                      `Dear Parent,\n\nYour child ${credentialsDialog.studentName} has been enrolled.\n\nLogin Credentials:\nAdmission No: ${credentialsDialog.admissionNumber}\nPassword: ${credentialsDialog.password}\n\nPlease use these to login to the Parent Portal.\n\nThank you!`
                    );
                    let formattedPhone = phone.replace(/[\s\-\(\)]/g, "");
                    if (!formattedPhone.startsWith("+")) {
                      formattedPhone = "+91" + formattedPhone;
                    }
                    window.open(`https://wa.me/${formattedPhone.replace("+", "")}?text=${message}`, "_blank");
                    toast.success("Opening WhatsApp...");
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    const printWindow = window.open("", "_blank");
                    if (printWindow) {
                      printWindow.document.write(`
                        <html><head><title>Student Credentials</title>
                        <style>body{font-family:Arial,sans-serif;padding:40px;text-align:center}
                        h2{margin-bottom:30px}.field{margin:15px 0;font-size:18px}
                        .label{color:#666;font-size:13px}.value{font-size:24px;font-weight:bold;letter-spacing:2px}</style>
                        </head><body>
                        <h2>Parent Portal Login Credentials</h2>
                        <p style="color:#666">Student: <strong>${credentialsDialog.studentName}</strong></p>
                        <div class="field"><div class="label">Admission Number</div><div class="value">${credentialsDialog.admissionNumber}</div></div>
                        <div class="field"><div class="label">Password</div><div class="value">${credentialsDialog.password}</div></div>
                        <p style="margin-top:30px;color:#999;font-size:12px">Please keep these credentials safe.</p>
                        </body></html>`);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" /> Print
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
