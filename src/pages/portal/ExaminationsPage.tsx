import { useState, useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/portal/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useSchool } from "@/context/SchoolContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ClipboardList, Calendar, Award, FileText, MapPin, Clock, Download, Printer, ArrowLeft, Eye, Loader2, Sparkles, GraduationCap, ChevronDown, ChevronRight } from "lucide-react";
import { exportSeatingPlanPDF, exportTimetablePDF, exportReportCardPDF } from "@/lib/pdfExport";
import { supabase } from "@/integrations/supabase/client";
import SeatingArrangement from "@/components/portal/SeatingArrangement";

// ──── Types ────
interface Examination {
  id: string;
  name: string;
  type: string;
  start_date: string;
  classes: string[];
  status: string;
  description: string | null;
  created_at: string;
}

interface ExamSchedule {
  id: string;
  examination_id: string;
  subject: string;
  date: string;
  start_time: string;
  end_time: string;
  room: string | null;
  class: string;
}

interface SeatingPlan {
  id: string;
  examination_id: string;
  class: string;
  room: string;
  date: string;
  students: string[];
  capacity: number;
}

interface ExamResult {
  id: string;
  examination_id: string;
  student_name: string;
  admission_no: string;
  subject: string;
  marks_obtained: number;
  max_marks: number;
  grade: string;
}

const examTypes = [
  { value: "unit_test", label: "Unit Test" },
  { value: "half_yearly", label: "Half Yearly" },
  { value: "annual", label: "Annual" },
  { value: "weekly_test", label: "Weekly Test" },
];

const allClasses = ["Nursery", "L.K.G", "U.K.G", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];
const subjects = ["Mathematics", "Science", "English", "Hindi", "Social Science", "Computer Science", "Sanskrit"];
const rooms = ["Room 101", "Room 102", "Room 103", "Room 104", "Room 201", "Room 202", "Hall A", "Hall B", "Lab 1", "Lab 2"];

function getGrade(marks: number, max: number): string {
  const pct = (marks / max) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
}

function getStatusColor(status: string) {
  switch (status) {
    case "upcoming": return "bg-info text-info-foreground border-0";
    case "ongoing": return "bg-warning text-warning-foreground border-0 animate-pulse";
    case "completed": return "bg-success text-success-foreground border-0";
    default: return "";
  }
}

function getExamGradient(status: string) {
  switch (status) {
    case "upcoming": return "from-info/80 to-info";
    case "ongoing": return "from-warning/80 to-warning";
    case "completed": return "from-success/80 to-success";
    default: return "from-primary/80 to-primary";
  }
}

export default function ExaminationsPage() {
  const { user } = useAuth();
  const { students } = useSchool();
  const isExamIncharge = user?.role === "exam_incharge";
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<Examination | null>(null);
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Examination | null>(null);
  const [examForm, setExamForm] = useState({ name: "", type: "unit_test", start_date: "", classes: [] as string[], description: "" });

  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ subject: "", date: "", startTime: "", endTime: "", room: "", class: "" });
  const [autoScheduleOpen, setAutoScheduleOpen] = useState(false);
  const [autoStartDate, setAutoStartDate] = useState("");
  const [autoStartTime, setAutoStartTime] = useState("09:00");
  const [autoEndTime, setAutoEndTime] = useState("12:00");
  const [autoSubjects, setAutoSubjects] = useState<string[]>([]);
  const [availableAutoSubjects, setAvailableAutoSubjects] = useState<string[]>([]);
  const [perClassSubjects, setPerClassSubjects] = useState<Record<string, string[]>>({});
  const [loadingAutoSubjects, setLoadingAutoSubjects] = useState(false);
  const [admitCardClass, setAdmitCardClass] = useState<string | null>(null);
  const [expandedPreviewClasses, setExpandedPreviewClasses] = useState<Record<string, boolean>>({});

  // Compute exact entries (subject + date + room) per class — mirrors handleAutoGenerateSchedule
  const previewByClass = useMemo(() => {
    const result: Record<string, { subject: string; date: string; room: string }[]> = {};
    if (!selectedExam || !autoStartDate || autoSubjects.length === 0) return result;
    const examClasses = selectedExam.classes || [];
    let roomCursor = 0;
    for (const cls of examClasses) {
      const classSubs = perClassSubjects[cls] || [];
      const subsForClass = autoSubjects.filter((s) => classSubs.includes(s));
      const items: { subject: string; date: string; room: string }[] = [];
      if (subsForClass.length === 0) { result[cls] = items; continue; }
      const currentDate = new Date(autoStartDate);
      for (let i = 0; i < subsForClass.length; i++) {
        items.push({
          subject: subsForClass[i],
          date: currentDate.toISOString().split("T")[0],
          room: rooms[roomCursor % rooms.length],
        });
        roomCursor++;
        currentDate.setDate(currentDate.getDate() + 1);
        if (currentDate.getDay() === 0) currentDate.setDate(currentDate.getDate() + 1);
      }
      result[cls] = items;
    }
    return result;
  }, [selectedExam, autoStartDate, autoSubjects, perClassSubjects]);


  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [resultForm, setResultForm] = useState({ studentName: "", admissionNo: "", subject: "", marksObtained: "", maxMarks: "100" });

  const fetchExaminations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("examinations").select("*").order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load examinations"); console.error(error); }
    else setExaminations((data || []) as unknown as Examination[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchExaminations(); }, [fetchExaminations]);

  const fetchExamDetails = useCallback(async (examId: string) => {
    setDetailLoading(true);
    const [schedRes, resRes] = await Promise.all([
      supabase.from("exam_schedules").select("*").eq("examination_id", examId).order("date"),
      supabase.from("exam_results").select("*").eq("examination_id", examId),
    ]);
    setSchedules((schedRes.data || []) as unknown as ExamSchedule[]);
    setResults((resRes.data || []) as unknown as ExamResult[]);
    setDetailLoading(false);
  }, []);

  useEffect(() => {
    if (selectedExam) fetchExamDetails(selectedExam.id);
  }, [selectedExam, fetchExamDetails]);

  // Load actual subjects assigned to students per class. Falls back to class_subjects master list per class.
  useEffect(() => {
    if (!autoScheduleOpen || !selectedExam) return;
    const examClasses = selectedExam.classes || [];
    if (examClasses.length === 0) {
      setAvailableAutoSubjects([]);
      setPerClassSubjects({});
      return;
    }
    setLoadingAutoSubjects(true);
    (async () => {
      const perClass: Record<string, Set<string>> = {};
      examClasses.forEach((c) => { perClass[c] = new Set(); });

      // Map student.id -> className for the exam's classes
      const examStudents = students.filter((s) => examClasses.includes(s.className));
      const idToClass: Record<string, string> = {};
      examStudents.forEach((s) => { idToClass[s.id] = s.className; });
      const studentIds = examStudents.map((s) => s.id);

      if (studentIds.length > 0) {
        const { data } = await supabase
          .from("student_subjects")
          .select("student_id, subject_name")
          .in("student_id", studentIds);
        (data || []).forEach((r: any) => {
          const cls = idToClass[r.student_id];
          if (cls) perClass[cls].add(r.subject_name);
        });
      }

      // For any class with no student-assigned subjects, fall back to class_subjects master
      const fallbackClasses = examClasses.filter((c) => perClass[c].size === 0);
      if (fallbackClasses.length > 0) {
        const { data } = await supabase
          .from("class_subjects")
          .select("class_name, subject_name")
          .in("class_name", fallbackClasses);
        (data || []).forEach((r: any) => {
          if (perClass[r.class_name]) perClass[r.class_name].add(r.subject_name);
        });
      }

      const perClassObj: Record<string, string[]> = {};
      const union = new Set<string>();
      Object.entries(perClass).forEach(([cls, set]) => {
        const arr = Array.from(set).sort();
        perClassObj[cls] = arr;
        arr.forEach((s) => union.add(s));
      });
      setPerClassSubjects(perClassObj);
      setAvailableAutoSubjects(Array.from(union).sort());
      setLoadingAutoSubjects(false);
    })();
  }, [autoScheduleOpen, selectedExam, students]);

  // ── Examination CRUD ──
  const handleSaveExam = async () => {
    if (!examForm.name || !examForm.start_date || examForm.classes.length === 0) {
      toast.error("Please fill name, start date, and select at least one class"); return;
    }
    if (editingExam) {
      const { error } = await supabase.from("examinations").update({
        name: examForm.name, type: examForm.type, start_date: examForm.start_date,
        classes: examForm.classes, description: examForm.description || null,
      }).eq("id", editingExam.id);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Examination updated");
    } else {
      const { error } = await supabase.from("examinations").insert({
        name: examForm.name, type: examForm.type, start_date: examForm.start_date,
        classes: examForm.classes, status: "upcoming", description: examForm.description || null,
      });
      if (error) { toast.error("Failed to create"); return; }
      toast.success("Examination created");
    }
    setEditingExam(null);
    setExamForm({ name: "", type: "unit_test", start_date: "", classes: [], description: "" });
    setExamDialogOpen(false);
    fetchExaminations();
  };

  const handleEditExam = (exam: Examination) => {
    setEditingExam(exam);
    setExamForm({ name: exam.name, type: exam.type, start_date: exam.start_date, classes: exam.classes || [], description: exam.description || "" });
    setExamDialogOpen(true);
  };

  const handleDeleteExam = async (id: string) => {
    const { error } = await supabase.from("examinations").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Examination deleted");
    fetchExaminations();
  };

  // ── Schedule CRUD ──
  const handleSaveSchedule = async () => {
    if (!selectedExam || !scheduleForm.subject || !scheduleForm.date || !scheduleForm.startTime || !scheduleForm.endTime || !scheduleForm.class) {
      toast.error("Please fill all required fields"); return;
    }
    const { error } = await supabase.from("exam_schedules").insert({
      examination_id: selectedExam.id, subject: scheduleForm.subject, date: scheduleForm.date,
      start_time: scheduleForm.startTime, end_time: scheduleForm.endTime, room: scheduleForm.room || null, class: scheduleForm.class,
    });
    if (error) { toast.error("Failed to add schedule"); return; }
    toast.success("Schedule entry added");
    setScheduleForm({ subject: "", date: "", startTime: "", endTime: "", room: "", class: "" });
    setScheduleDialogOpen(false);
    fetchExamDetails(selectedExam.id);
  };

  const handleDeleteSchedule = async (id: string) => {
    await supabase.from("exam_schedules").delete().eq("id", id);
    if (selectedExam) fetchExamDetails(selectedExam.id);
    toast.success("Schedule entry deleted");
  };

  const handleAutoGenerateSchedule = async () => {
    if (!selectedExam || !autoStartDate || autoSubjects.length === 0) {
      toast.error("Please select start date and at least one subject");
      return;
    }
    const examClasses = selectedExam.classes || [];
    const entries: any[] = [];
    const perClassCounts: { cls: string; count: number }[] = [];
    let roomCursor = 0;

    // Generate per-class: each class advances its own date pointer using only its own subjects.
    for (const cls of examClasses) {
      // Subjects this class actually has, in the order the user picked
      const classSubs = perClassSubjects[cls] || [];
      const subsForClass = autoSubjects.filter((s) => classSubs.includes(s));
      if (subsForClass.length === 0) {
        perClassCounts.push({ cls, count: 0 });
        continue;
      }
      let currentDate = new Date(autoStartDate);
      for (let i = 0; i < subsForClass.length; i++) {
        const dateStr = currentDate.toISOString().split("T")[0];
        entries.push({
          examination_id: selectedExam.id,
          subject: subsForClass[i],
          date: dateStr,
          start_time: autoStartTime,
          end_time: autoEndTime,
          room: rooms[roomCursor % rooms.length],
          class: cls,
        });
        roomCursor++;
        // Advance to next day, skip Sundays
        currentDate.setDate(currentDate.getDate() + 1);
        if (currentDate.getDay() === 0) currentDate.setDate(currentDate.getDate() + 1);
      }
      perClassCounts.push({ cls, count: subsForClass.length });
    }

    if (entries.length === 0) {
      toast.error("None of the selected subjects match any class. Pick subjects assigned to these classes.");
      return;
    }

    const { error } = await supabase.from("exam_schedules").insert(entries);
    if (error) { toast.error("Failed to generate schedule"); return; }
    const summary = perClassCounts
      .filter((p) => p.count > 0)
      .map((p) => `${p.cls}: ${p.count}`)
      .join(" • ");
    toast.success(`Generated ${entries.length} entries — ${summary}`);
    setAutoScheduleOpen(false);
    setAutoSubjects([]);
    setAutoStartDate("");
    fetchExamDetails(selectedExam.id);
  };

  const toggleAutoSubject = (sub: string) => {
    setAutoSubjects(prev => prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]);
  };

  // Print admit cards - 9 per A4
  const printAdmitCards = (classFilter: string) => {
    const classStudents = students.filter(s => s.className === classFilter);
    if (classStudents.length === 0) { toast.error("No students in this class"); return; }
    const classSchedules = schedules.filter(s => s.class === classFilter);
    
    const win = window.open("", "_blank");
    if (!win) return;
    const esc = (v: unknown) => String(v ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    
    const cards = classStudents.map((student, idx) => `
      <div class="admit-card" style="break-inside: avoid; border: 2px solid #1a2744; border-radius: 8px; padding: 12px; margin-bottom: 8px; width: 100%; box-sizing: border-box;">
        <div style="text-align:center; border-bottom: 2px solid #c49a3c; padding-bottom: 6px; margin-bottom: 8px;">
          <h3 style="margin:0; color:#1a2744; font-size:14px;">Universal Public School</h3>
          <p style="margin:2px 0 0; font-size:10px; color:#666;">ADMIT CARD — ${esc(selectedExam?.name || "")}</p>
        </div>
        <div style="display:flex; gap:10px; margin-bottom:8px;">
          <div style="flex:1;">
            <table style="font-size:10px; width:100%;">
              <tr><td style="color:#888; padding:2px 4px;">Name:</td><td style="font-weight:bold;">${esc(student.name)}</td></tr>
              <tr><td style="color:#888; padding:2px 4px;">Father:</td><td>${esc(student.fatherName || "—")}</td></tr>
              <tr><td style="color:#888; padding:2px 4px;">Class:</td><td>${esc(student.className)} (${esc(student.section)})</td></tr>
              <tr><td style="color:#888; padding:2px 4px;">Adm No:</td><td>${esc(student.admissionNumber)}</td></tr>
            </table>
          </div>
          <div style="width:55px; height:65px; border:1px solid #ddd; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:8px; color:#999; overflow:hidden;">
            ${student.photoFile ? `<img src="${esc(student.photoFile)}" style="width:100%;height:100%;object-fit:cover;" />` : "Photo"}
          </div>
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:9px; margin-bottom:6px;">
          <thead><tr style="background:#1a2744; color:white;"><th style="padding:3px 4px; text-align:left;">Subject</th><th style="padding:3px 4px;">Date</th><th style="padding:3px 4px;">Time</th></tr></thead>
          <tbody>
            ${classSchedules.map(s => `<tr style="border-bottom:1px solid #eee;"><td style="padding:3px 4px;">${esc(s.subject)}</td><td style="padding:3px 4px; text-align:center;">${esc(new Date(s.date).toLocaleDateString("en-IN"))}</td><td style="padding:3px 4px; text-align:center;">${esc(s.start_time)}-${esc(s.end_time)}</td></tr>`).join("")}
          </tbody>
        </table>
        <div style="display:flex; justify-content:space-between; font-size:8px; color:#888; border-top:1px solid #eee; padding-top:4px;">
          <span>Class Teacher Sign.</span>
          <span>Principal Sign.</span>
        </div>
      </div>
    `).join("");
    
    win.document.write(`
      <html><head><title>Admit Cards - ${esc(classFilter)}</title>
      <style>
        @page { size: A4; margin: 10mm; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 10px; }
        .page { display: grid; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr 1fr; gap: 6px; page-break-after: always; min-height: calc(297mm - 20mm); }
        .page:last-child { page-break-after: auto; }
        @media print { body { padding: 0; } }
      </style></head><body>
      ${(() => {
        const pages = [];
        for (let i = 0; i < classStudents.length; i += 9) {
          const pageCards = cards.split("</div>\n    ").slice(i, i + 9);
          pages.push(`<div class="page">${classStudents.slice(i, i + 9).map((student, idx) => {
            const cardIdx = i + idx;
            const classSchedules2 = schedules.filter(s2 => s2.class === classFilter);
            return `
              <div class="admit-card" style="border: 2px solid #1a2744; border-radius: 8px; padding: 8px; box-sizing: border-box;">
                <div style="text-align:center; border-bottom: 2px solid #c49a3c; padding-bottom: 4px; margin-bottom: 6px;">
                  <h3 style="margin:0; color:#1a2744; font-size:11px;">Universal Public School</h3>
                  <p style="margin:1px 0 0; font-size:8px; color:#666;">ADMIT CARD — ${esc(selectedExam?.name || "")}</p>
                </div>
                <div style="display:flex; gap:6px; margin-bottom:6px;">
                  <div style="flex:1;">
                    <table style="font-size:8px; width:100%;">
                      <tr><td style="color:#888; padding:1px 2px;">Name:</td><td style="font-weight:bold;">${esc(student.name)}</td></tr>
                      <tr><td style="color:#888; padding:1px 2px;">Guardian:</td><td>${esc(student.fatherName || student.motherName || "—")}</td></tr>
                      <tr><td style="color:#888; padding:1px 2px;">Class:</td><td>${esc(student.className)} (${esc(student.section)})</td></tr>
                      <tr><td style="color:#888; padding:1px 2px;">Adm No:</td><td>${esc(student.admissionNumber)}</td></tr>
                    </table>
                  </div>
                  <div style="width:40px; height:50px; border:1px solid #ddd; border-radius:3px; display:flex; align-items:center; justify-content:center; font-size:6px; color:#999; overflow:hidden;">
                    ${student.photoFile ? `<img src="${esc(student.photoFile)}" style="width:100%;height:100%;object-fit:cover;" />` : "Photo"}
                  </div>
                </div>
                <table style="width:100%; border-collapse:collapse; font-size:7px; margin-bottom:4px;">
                  <thead><tr style="background:#1a2744; color:white;"><th style="padding:2px;">Subject</th><th style="padding:2px;">Date</th><th style="padding:2px;">Time</th></tr></thead>
                  <tbody>
                    ${classSchedules2.slice(0, 6).map(s2 => `<tr style="border-bottom:1px solid #eee;"><td style="padding:2px;">${esc(s2.subject)}</td><td style="padding:2px; text-align:center;">${esc(new Date(s2.date).toLocaleDateString("en-IN"))}</td><td style="padding:2px; text-align:center;">${esc(s2.start_time)}-${esc(s2.end_time)}</td></tr>`).join("")}
                  </tbody>
                </table>
                <div style="display:flex; justify-content:space-between; font-size:6px; color:#888; border-top:1px solid #eee; padding-top:2px;">
                  <span>Class Teacher</span>
                  <span>Principal</span>
                </div>
              </div>
            `;
          }).join("")}</div>`);
        }
        return pages.join("");
      })()}
      </body></html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const handleSaveResult = async () => {
    if (!selectedExam || !resultForm.studentName || !resultForm.admissionNo || !resultForm.subject || !resultForm.marksObtained || !resultForm.maxMarks) {
      toast.error("Please fill all fields"); return;
    }
    const marks = Number(resultForm.marksObtained);
    const max = Number(resultForm.maxMarks);
    if (marks > max) { toast.error(`Marks cannot exceed ${max}`); return; }
    const { error } = await supabase.from("exam_results").insert({
      examination_id: selectedExam.id, student_name: resultForm.studentName, admission_no: resultForm.admissionNo,
      subject: resultForm.subject, marks_obtained: marks, max_marks: max, grade: getGrade(marks, max),
    });
    if (error) { toast.error("Failed to add result"); return; }
    toast.success("Result added");
    setResultForm({ studentName: "", admissionNo: "", subject: "", marksObtained: "", maxMarks: "100" });
    setResultDialogOpen(false);
    fetchExamDetails(selectedExam.id);
  };


  const handleExportTimetable = () => {
    if (schedules.length === 0) { toast.error("No schedule entries to export"); return; }
    exportTimetablePDF(schedules.map(s => ({ examName: selectedExam?.name || "", class: s.class, subject: s.subject, date: s.date, startTime: s.start_time, endTime: s.end_time, room: s.room || "" })));
    toast.success("Timetable PDF downloaded");
  };

  const handleGenerateReportCard = (admissionNo: string) => {
    const studentResults = results.filter(r => r.admission_no === admissionNo);
    if (studentResults.length === 0) { toast.error("No results found"); return; }
    const first = studentResults[0];
    const reportData = studentResults.map(r => ({
      studentName: r.student_name, admissionNo: r.admission_no, examName: selectedExam?.name || "",
      subject: r.subject, marksObtained: r.marks_obtained, maxMarks: r.max_marks, grade: r.grade,
    }));
    exportReportCardPDF(first.student_name, admissionNo, selectedExam?.classes?.join(", ") || "", reportData);
    toast.success("Report Card PDF downloaded");
  };

  const toggleClassSelection = (cls: string) => {
    setExamForm(f => ({ ...f, classes: f.classes.includes(cls) ? f.classes.filter(c => c !== cls) : [...f.classes, cls] }));
  };

  const uniqueStudents = Array.from(new Map(results.map(r => [r.admission_no, { name: r.student_name, admissionNo: r.admission_no }])).values());
  const upcomingExams = examinations.filter(e => e.status === "upcoming");
  const ongoingExams = examinations.filter(e => e.status === "ongoing");

  // ═══════════════════════════════════════════
  // DETAIL VIEW
  // ═══════════════════════════════════════════
  if (selectedExam) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedExam(null)}><ArrowLeft className="w-5 h-5" /></Button>
            <div>
              <h1 className="text-3xl font-bold font-display">{selectedExam.name}</h1>
              <p className="text-muted-foreground mt-1">
                {examTypes.find(t => t.value === selectedExam.type)?.label} • Started {new Date(selectedExam.start_date).toLocaleDateString("en-IN")} • Classes: {selectedExam.classes?.join(", ")}
              </p>
            </div>
            <Badge className={`ml-auto ${getStatusColor(selectedExam.status)}`}>{selectedExam.status.charAt(0).toUpperCase() + selectedExam.status.slice(1)}</Badge>
          </div>

          {detailLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <Tabs defaultValue="schedule" className="space-y-4">
              <TabsList className="flex-wrap">
                <TabsTrigger value="schedule">Exam Schedule</TabsTrigger>
                <TabsTrigger value="seating">Seating Arrangement</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="reportcard">Report Card</TabsTrigger>
                <TabsTrigger value="admitcard">Admit Card</TabsTrigger>
              </TabsList>

              {/* ── SCHEDULE ── */}
              <TabsContent value="schedule" className="space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <h3 className="text-lg font-semibold">Exam Schedule / Timetable</h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleExportTimetable} disabled={schedules.length === 0}><Download className="w-4 h-4 mr-1" /> Export PDF</Button>
                    {isExamIncharge && <Button size="sm" variant="secondary" onClick={() => setAutoScheduleOpen(true)} className="gap-1"><Sparkles className="w-4 h-4" /> Auto Generate</Button>}
                    {isExamIncharge && <Dialog open={scheduleDialogOpen} onOpenChange={o => { setScheduleDialogOpen(o); if (!o) setScheduleForm({ subject: "", date: "", startTime: "", endTime: "", room: "", class: "" }); }}>
                      <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Entry</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Add Schedule Entry</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-2">
                          <div className="grid grid-cols-2 gap-3">
                            <div><Label>Subject</Label><Select value={scheduleForm.subject} onValueChange={v => setScheduleForm(f => ({ ...f, subject: v }))}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                            <div><Label>Class</Label><Select value={scheduleForm.class} onValueChange={v => setScheduleForm(f => ({ ...f, class: v }))}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{(selectedExam.classes || []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                          </div>
                          <div><Label>Date</Label><Input type="date" value={scheduleForm.date} onChange={e => setScheduleForm(f => ({ ...f, date: e.target.value }))} className="mt-1" /></div>
                          <div className="grid grid-cols-2 gap-3">
                            <div><Label>Start Time</Label><Input type="time" value={scheduleForm.startTime} onChange={e => setScheduleForm(f => ({ ...f, startTime: e.target.value }))} className="mt-1" /></div>
                            <div><Label>End Time</Label><Input type="time" value={scheduleForm.endTime} onChange={e => setScheduleForm(f => ({ ...f, endTime: e.target.value }))} className="mt-1" /></div>
                          </div>
                          <Button onClick={handleSaveSchedule} className="w-full">Add Schedule</Button>
                        </div>
                      </DialogContent>
                    </Dialog>}
                  </div>
                </div>
                <Card><CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Class</TableHead><TableHead>Date</TableHead><TableHead>Time</TableHead>{isExamIncharge && <TableHead className="text-right">Actions</TableHead>}</TableRow></TableHeader>
                    <TableBody>
                      {schedules.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No schedule entries yet</TableCell></TableRow>
                      ) : schedules.map(entry => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.subject}</TableCell>
                          <TableCell>{entry.class}</TableCell>
                          <TableCell>{new Date(entry.date).toLocaleDateString("en-IN")}</TableCell>
                          <TableCell><div className="flex items-center gap-1"><Clock className="w-3 h-3 text-muted-foreground" />{entry.start_time} - {entry.end_time}</div></TableCell>
                          {isExamIncharge && <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDeleteSchedule(entry.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent></Card>
              </TabsContent>

              {/* ── SEATING ── */}
              <TabsContent value="seating" className="space-y-4">
                <SeatingArrangement examId={selectedExam.id} examClasses={selectedExam.classes || []} />
              </TabsContent>

              {/* ── RESULTS ── */}
              <TabsContent value="results" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Exam Results</h3>
                  {isExamIncharge && <Dialog open={resultDialogOpen} onOpenChange={o => { setResultDialogOpen(o); if (!o) setResultForm({ studentName: "", admissionNo: "", subject: "", marksObtained: "", maxMarks: "100" }); }}>
                    <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Result</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Add Exam Result</DialogTitle></DialogHeader>
                      <div className="space-y-4 pt-2">
                        <div><Label>Student Name</Label><Input value={resultForm.studentName} onChange={e => setResultForm(f => ({ ...f, studentName: e.target.value }))} placeholder="Enter student name" className="mt-1" /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label>Admission No</Label><Input value={resultForm.admissionNo} onChange={e => setResultForm(f => ({ ...f, admissionNo: e.target.value }))} placeholder="ADM-001" className="mt-1" /></div>
                          <div><Label>Subject</Label><Select value={resultForm.subject} onValueChange={v => setResultForm(f => ({ ...f, subject: v }))}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label>Marks Obtained</Label><Input type="number" value={resultForm.marksObtained} onChange={e => setResultForm(f => ({ ...f, marksObtained: e.target.value }))} className="mt-1" /></div>
                          <div><Label>Max Marks</Label><Input type="number" value={resultForm.maxMarks} onChange={e => setResultForm(f => ({ ...f, maxMarks: e.target.value }))} className="mt-1" /></div>
                        </div>
                        <Button onClick={handleSaveResult} className="w-full">Save Result</Button>
                      </div>
                    </DialogContent>
                  </Dialog>}
                </div>
                <Card><CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Admission No</TableHead><TableHead>Subject</TableHead><TableHead>Marks</TableHead><TableHead>Grade</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {results.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No results added yet</TableCell></TableRow>
                      ) : results.map(r => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.student_name}</TableCell>
                          <TableCell>{r.admission_no}</TableCell>
                          <TableCell>{r.subject}</TableCell>
                          <TableCell>{r.marks_obtained}/{r.max_marks}</TableCell>
                          <TableCell><Badge variant="secondary" className={
                            r.grade === "A+" || r.grade === "A" ? "bg-primary/10 text-primary" :
                            r.grade === "B+" || r.grade === "B" ? "bg-accent text-accent-foreground" :
                            r.grade === "F" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                          }>{r.grade}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent></Card>
              </TabsContent>

              {/* ── REPORT CARD ── */}
              <TabsContent value="reportcard" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Report Card Generation</h3>
                  <p className="text-sm text-muted-foreground">Select a student to generate their report card PDF</p>
                </div>
                {uniqueStudents.length === 0 ? (
                  <Card><CardContent className="py-12 text-center text-muted-foreground"><Award className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>No results available. Add exam results first.</p></CardContent></Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {uniqueStudents.map(student => {
                      const sr = results.filter(r => r.admission_no === student.admissionNo);
                      const totalObt = sr.reduce((s, r) => s + r.marks_obtained, 0);
                      const totalMax = sr.reduce((s, r) => s + r.max_marks, 0);
                      const pct = totalMax > 0 ? ((totalObt / totalMax) * 100).toFixed(1) : "0";
                      return (
                        <Card key={student.admissionNo} className="hover:border-primary/30 transition-colors">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div><CardTitle className="text-base">{student.name}</CardTitle><p className="text-sm text-muted-foreground mt-0.5">{student.admissionNo}</p></div>
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{student.name.charAt(0)}</div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                              <div className="bg-muted rounded-lg p-2"><p className="text-lg font-bold">{sr.length}</p><p className="text-[10px] text-muted-foreground">Subjects</p></div>
                              <div className="bg-muted rounded-lg p-2"><p className="text-lg font-bold">{totalObt}/{totalMax}</p><p className="text-[10px] text-muted-foreground">Marks</p></div>
                              <div className="bg-muted rounded-lg p-2"><p className="text-lg font-bold">{pct}%</p><p className="text-[10px] text-muted-foreground">Percentage</p></div>
                            </div>
                            <Button size="sm" className="w-full gap-1.5" onClick={() => handleGenerateReportCard(student.admissionNo)}><Printer className="w-4 h-4" /> Generate Report Card</Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* ── ADMIT CARD ── */}
              <TabsContent value="admitcard" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2"><GraduationCap className="w-5 h-5 text-primary" /> Admit Cards</h3>
                  <p className="text-sm text-muted-foreground">Select a class to print 9 admit cards per A4 page</p>
                </div>
                {schedules.length === 0 ? (
                  <Card><CardContent className="py-12 text-center text-muted-foreground"><FileText className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>Add exam schedule entries first.</p></CardContent></Card>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {(selectedExam.classes || []).map((cls, i) => {
                      const count = students.filter(s => s.className === cls).length;
                      const colors = ["from-blue-500 to-blue-600", "from-emerald-500 to-emerald-600", "from-violet-500 to-violet-600", "from-rose-500 to-rose-600", "from-amber-500 to-amber-600"];
                      return (
                        <div
                          key={cls}
                          onClick={() => printAdmitCards(cls)}
                          className={`bg-gradient-to-br ${colors[i % colors.length]} text-white rounded-xl p-4 cursor-pointer hover:scale-[1.03] transition-all shadow-md hover:shadow-lg`}
                        >
                          <GraduationCap className="w-6 h-6 mb-2 opacity-80" />
                          <h4 className="font-bold text-sm">Class {cls}</h4>
                          <p className="text-xs opacity-80">{count} students</p>
                          <div className="flex items-center gap-1 mt-2 text-xs opacity-90">
                            <Printer className="w-3 h-3" /> Print Cards
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      {/* Auto Schedule Dialog */}
      <Dialog open={autoScheduleOpen} onOpenChange={setAutoScheduleOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Auto Generate Schedule</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Start Date</Label><Input type="date" value={autoStartDate} onChange={e => setAutoStartDate(e.target.value)} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Time</Label><Input type="time" value={autoStartTime} onChange={e => setAutoStartTime(e.target.value)} className="mt-1" /></div>
              <div><Label>End Time</Label><Input type="time" value={autoEndTime} onChange={e => setAutoEndTime(e.target.value)} className="mt-1" /></div>
            </div>
            <div>
              <Label>Select Subjects (one per day)</Label>
              {loadingAutoSubjects ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading subjects from students…
                </div>
              ) : availableAutoSubjects.length === 0 ? (
                <p className="text-sm text-destructive mt-2">
                  No subjects found for these classes. Assign subjects to students first (Students page → Bulk Assign Subjects), or add them to the class master list (Subjects page).
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableAutoSubjects.map(s => (
                      <button key={s} onClick={() => toggleAutoSubject(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${autoSubjects.includes(s) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-accent"}`}>
                        {autoSubjects.includes(s) ? `${autoSubjects.indexOf(s) + 1}. ` : ""}{s}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pulled from each class's enrolled subjects. Order = exam day order. Sundays auto-skipped.
                  </p>
                </>
              )}
            </div>

            {/* Per-class breakdown — clickable preview of generated entries */}
            {!loadingAutoSubjects && (selectedExam?.classes?.length || 0) > 0 && autoSubjects.length > 0 && autoStartDate && (
              <div className="border border-border rounded-lg p-3 bg-muted/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <GraduationCap className="w-3.5 h-3.5 text-primary" />
                  Per-class timetable preview
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Click a class to see the exact subjects, dates and rooms that will be created. Sundays auto-skipped.
                </p>
                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {(selectedExam?.classes || []).map((cls) => {
                    const items = previewByClass[cls] || [];
                    const isOpen = !!expandedPreviewClasses[cls];
                    const empty = items.length === 0;
                    return (
                      <div key={cls} className="border border-border rounded-md bg-background">
                        <button
                          type="button"
                          onClick={() => setExpandedPreviewClasses(p => ({ ...p, [cls]: !p[cls] }))}
                          className="w-full flex items-center gap-2 p-2 text-left hover:bg-accent/50 transition-colors rounded-md"
                          disabled={empty}
                        >
                          {empty ? (
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-30" />
                          ) : isOpen ? (
                            <ChevronDown className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                          <Badge variant="outline" className="text-[10px] shrink-0">{cls}</Badge>
                          <span className={`text-[11px] flex-1 ${empty ? "text-destructive italic" : "text-muted-foreground"}`}>
                            {empty
                              ? "No matching subjects — will be skipped"
                              : `${items.length} day${items.length !== 1 ? "s" : ""} • ${items[0].date} → ${items[items.length - 1].date}`}
                          </span>
                        </button>
                        {isOpen && !empty && (
                          <div className="border-t border-border px-2 py-1.5 space-y-1">
                            {items.map((it, idx) => {
                              const d = new Date(it.date);
                              const dayName = d.toLocaleDateString(undefined, { weekday: "short" });
                              return (
                                <div key={idx} className="grid grid-cols-[24px_1fr_auto_auto] gap-2 items-center text-[11px] py-1 border-b border-border/50 last:border-0">
                                  <span className="text-muted-foreground font-mono">{idx + 1}.</span>
                                  <span className="font-medium truncate">{it.subject}</span>
                                  <span className="text-muted-foreground whitespace-nowrap">{dayName} {it.date}</span>
                                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{it.room}</Badge>
                                </div>
                              );
                            })}
                            <div className="text-[10px] text-muted-foreground pt-1">
                              {autoStartTime}–{autoEndTime}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="text-[11px] font-medium text-foreground pt-1 border-t border-border">
                  Total entries to create: {Object.values(previewByClass).reduce((sum, arr) => sum + arr.length, 0)}
                </div>
              </div>
            )}

            <Button onClick={handleAutoGenerateSchedule} className="w-full gap-2"><Sparkles className="w-4 h-4" /> Generate per-class for {selectedExam?.classes?.length || 0} class{(selectedExam?.classes?.length || 0) !== 1 ? "es" : ""}</Button>
          </div>
        </DialogContent>
      </Dialog>
      </DashboardLayout>
    );
  }

  // ═══════════════════════════════════════════
  // DASHBOARD VIEW
  // ═══════════════════════════════════════════
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Vibrant Hero Header */}
        <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-primary via-primary/90 to-secondary text-primary-foreground shadow-lg">
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-secondary/30 blur-3xl floating" />
          <div className="absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-accent/30 blur-3xl floating-delayed" />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center glow-secondary">
                <GraduationCap className="w-7 h-7 text-secondary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold font-display flex items-center gap-2">
                  Examination Hub
                  <Sparkles className="w-6 h-6 text-secondary animate-pulse" />
                </h1>
                <p className="text-primary-foreground/80 mt-1">Schedules • Results • Seating • Report Cards</p>
              </div>
            </div>
            {isExamIncharge && <Dialog open={examDialogOpen} onOpenChange={o => { setExamDialogOpen(o); if (!o) { setEditingExam(null); setExamForm({ name: "", type: "unit_test", start_date: "", classes: [], description: "" }); } }}>
            <DialogTrigger asChild><Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-md gap-2 font-semibold"><Plus className="w-4 h-4" /> Add New Exam</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editingExam ? "Edit Examination" : "Create New Examination"}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Examination Name</Label><Input value={examForm.name} onChange={e => setExamForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Half Yearly Exam 2026" className="mt-1" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Examination Type</Label><Select value={examForm.type} onValueChange={v => setExamForm(f => ({ ...f, type: v }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{examTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Start Date</Label><Input type="date" value={examForm.start_date} onChange={e => setExamForm(f => ({ ...f, start_date: e.target.value }))} className="mt-1" /></div>
                </div>
                <div>
                  <Label>Select Classes</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {allClasses.map(cls => (
                      <label key={cls} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={examForm.classes.includes(cls)} onCheckedChange={() => toggleClassSelection(cls)} />
                        {cls}
                      </label>
                    ))}
                  </div>
                </div>
                <div><Label>Description (optional)</Label><Input value={examForm.description} onChange={e => setExamForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." className="mt-1" /></div>
                <Button onClick={handleSaveExam} className="w-full">{editingExam ? "Update Examination" : "Create Examination"}</Button>
              </div>
            </DialogContent>
          </Dialog>}
          </div>
        </div>

        {/* Colorful Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="overflow-hidden border-0 shadow-md hover-lift bg-gradient-to-br from-info/90 to-info text-info-foreground">
            <CardContent className="p-5 relative">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
              <div className="relative flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-90">Total Exams</p>
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"><ClipboardList className="w-5 h-5" /></div>
              </div>
              <p className="text-3xl font-bold font-display">{examinations.length}</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-0 shadow-md hover-lift bg-gradient-to-br from-warning/90 to-warning text-warning-foreground">
            <CardContent className="p-5 relative">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
              <div className="relative flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-90">Upcoming</p>
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"><Calendar className="w-5 h-5" /></div>
              </div>
              <p className="text-3xl font-bold font-display">{upcomingExams.length}</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-0 shadow-md hover-lift bg-gradient-to-br from-success/90 to-success text-success-foreground">
            <CardContent className="p-5 relative">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
              <div className="relative flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-90">Ongoing</p>
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"><FileText className="w-5 h-5" /></div>
              </div>
              <p className="text-3xl font-bold font-display">{ongoingExams.length}</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-0 shadow-md hover-lift bg-gradient-to-br from-secondary to-accent text-secondary-foreground">
            <CardContent className="p-5 relative">
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
              <div className="relative flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-90">Completed</p>
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"><Award className="w-5 h-5" /></div>
              </div>
              <p className="text-3xl font-bold font-display">{examinations.filter(e => e.status === "completed").length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Examination Cards */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : examinations.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-muted-foreground">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">No examinations yet</p>
            <p className="text-sm mt-1">Click "Add New Exam" to create your first examination</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {examinations.map(exam => (
              <Card key={exam.id} className="relative overflow-hidden border hover:border-secondary/50 transition-all hover-lift cursor-pointer group">
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${getExamGradient(exam.status)}`} />
                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0" onClick={() => setSelectedExam(exam)}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getExamGradient(exam.status)} flex items-center justify-center shadow-sm`}>
                          <ClipboardList className="w-4 h-4 text-white" />
                        </div>
                        <CardTitle className="text-lg truncate">{exam.name}</CardTitle>
                      </div>
                      <p className="text-sm text-muted-foreground ml-11">{examTypes.find(t => t.value === exam.type)?.label}</p>
                    </div>
                    <Badge className={getStatusColor(exam.status)}>{exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 text-secondary" />
                      <span>Starts: {new Date(exam.start_date).toLocaleDateString("en-IN")}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(exam.classes || []).slice(0, 5).map(c => (<Badge key={c} variant="secondary" className="text-xs">{c}</Badge>))}
                      {(exam.classes || []).length > 5 && <Badge variant="secondary" className="text-xs">+{exam.classes.length - 5}</Badge>}
                    </div>
                    {exam.description && <p className="text-xs text-muted-foreground line-clamp-2">{exam.description}</p>}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1 gap-1 group-hover:bg-secondary group-hover:text-secondary-foreground group-hover:border-secondary transition-colors" onClick={() => setSelectedExam(exam)}><Eye className="w-3.5 h-3.5" /> View Details</Button>
                      {isExamIncharge && <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); handleEditExam(exam); }}><Pencil className="w-3.5 h-3.5" /></Button>}
                      {isExamIncharge && <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); handleDeleteExam(exam.id); }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
