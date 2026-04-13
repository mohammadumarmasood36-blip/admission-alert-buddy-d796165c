import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export type StaffRole = "principal" | "teacher" | "cashier" | "exam_incharge" | "manager";

export const ALL_CLASSES = [
  "Nursery", "L.K.G", "U.K.G",
  "1st", "2nd", "3rd", "4th", "5th", "6th",
  "7th", "8th", "9th", "10th", "11th", "12th",
] as const;

export type ClassName = typeof ALL_CLASSES[number];

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  salary: number;
  salaryPaid: boolean;
  joinDate: string;
  photoUrl?: string;
  photoFile?: string;
  resumeFileName?: string;
  resumeFile?: string;
  mobileNumber?: string;
  teachingClasses: ClassName[];
}

export interface Section {
  id: string;
  name: string;
}

export interface ClassData {
  name: ClassName;
  sections: Section[];
}

export type InstallmentStatus = "paid" | "unpaid";
export type PaymentMode = "cash" | "online" | "cheque" | "bank_transfer";

export interface Student {
  id: string;
  admissionNumber: string;
  rollNumber?: number;
  name: string;
  className: ClassName;
  section: string;
  feeAmount: number;
  feePaid: boolean;
  enrollDate: string;
  installments: InstallmentStatus[];
  paymentMode: PaymentMode;
  photoFile?: string;
  fatherName?: string;
  fatherMobile?: string;
  fatherEmail?: string;
  motherName?: string;
  motherMobile?: string;
  motherEmail?: string;
  address?: string;
  transportFacility?: boolean;
  pickupLocation?: string;
  busNumber?: string;
  parentName?: string;
  parentMobile?: string;
  parentPassword?: string;
}

export interface FeePayment {
  id: string;
  studentId: string;
  studentName: string;
  className: ClassName;
  section: string;
  amount: number;
  date: string;
  paymentMode: PaymentMode;
  cashierName: string;
}

interface SchoolContextType {
  staff: StaffMember[];
  students: Student[];
  classes: ClassData[];
  feeHistory: FeePayment[];
  loading: boolean;
  addStaff: (staff: Omit<StaffMember, "id" | "salaryPaid"> & { loginPassword?: string }) => void;
  removeStaff: (id: string) => void;
  updateStaffSalary: (id: string, salary: number) => void;
  updateStaff: (id: string, updates: Partial<StaffMember>) => void;
  addStudent: (data: Omit<Student, "id" | "admissionNumber" | "rollNumber" | "feePaid" | "enrollDate" | "installments" | "paymentMode">) => Promise<{ admissionNumber: string; password: string; studentName: string } | null>;
  removeStudent: (id: string) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  submitFee: (studentId: string) => void;
  paySalary: (staffId: string) => void;
  resetSalaries: () => void;
  addSection: (className: ClassName, sectionName: string) => void;
  removeSection: (className: ClassName, sectionId: string) => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

const ROLE_MAP: Record<string, string> = {
  principal: "Principal",
  manager: "Manager",
  teacher: "Teacher",
  cashier: "Cashier",
  exam_incharge: "Exam Incharge",
};

const ROLE_MAP_REVERSE: Record<string, StaffRole> = {
  Principal: "principal",
  Manager: "manager",
  Teacher: "teacher",
  Cashier: "cashier",
  "Exam Incharge": "exam_incharge",
};

function mapStaffRow(row: any): StaffMember {
  return {
    id: row.id,
    name: row["Full Name"],
    role: (ROLE_MAP_REVERSE[row.Role] || row.Role) as StaffRole,
    salary: row["Monthly Salary"] || 0,
    salaryPaid: row.salary_paid || false,
    joinDate: row.join_date || new Date().toISOString().split("T")[0],
    photoFile: row.Photo || undefined,
    resumeFile: row.Resume || undefined,
    mobileNumber: row["Mobile number"] ? String(row["Mobile number"]) : undefined,
    teachingClasses: (row.teaching_classes || []) as ClassName[],
  };
}

function mapStudentRow(row: any): Student {
  return {
    id: row.id,
    admissionNumber: row.admission_number,
    rollNumber: row.roll_number || undefined,
    name: row.name,
    className: row.class_name as ClassName,
    section: row.section,
    feeAmount: Number(row.fee_amount) || 0,
    feePaid: row.fee_paid || false,
    enrollDate: row.enroll_date || new Date().toISOString().split("T")[0],
    installments: (row.installments || []) as InstallmentStatus[],
    paymentMode: (row.payment_mode || "cash") as PaymentMode,
    photoFile: row.photo_file || undefined,
    fatherName: row.father_name || undefined,
    fatherMobile: row.father_mobile || undefined,
    fatherEmail: row.father_email || undefined,
    motherName: row.mother_name || undefined,
    motherMobile: row.mother_mobile || undefined,
    motherEmail: row.mother_email || undefined,
    address: row.address || undefined,
    transportFacility: row.transport_facility || false,
    pickupLocation: row.pickup_location || undefined,
    busNumber: row.bus_number || undefined,
    parentName: row.parent_name || undefined,
    parentMobile: row.parent_mobile || undefined,
    parentPassword: row.parent_password || undefined,
  };
}

function mapFeeRow(row: any): FeePayment {
  return {
    id: row.id,
    studentId: row.student_id || "",
    studentName: row.student_name,
    className: row.class_name as ClassName,
    section: row.section,
    amount: Number(row.amount) || 0,
    date: row.payment_date || "",
    paymentMode: (row.payment_mode || "cash") as PaymentMode,
    cashierName: row.cashier_name || "",
  };
}

export function SchoolProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<{ id: string; class_name: string; name: string }[]>([]);
  const [feeHistory, setFeeHistory] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);

  const classes: ClassData[] = ALL_CLASSES.map((name) => ({
    name,
    sections: sections
      .filter((s) => s.class_name === name)
      .map((s) => ({ id: s.id, name: s.name })),
  }));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [staffRes, studentsRes, sectionsRes, feeRes] = await Promise.all([
        supabase.from("staff").select('id, "Full Name", Role, "Monthly Salary", salary_paid, join_date, Photo, Resume, "Mobile number", teaching_classes'),
        supabase.from("students").select("id, admission_number, name, class_name, section, fee_amount, fee_paid, enroll_date, installments, payment_mode, parent_name, parent_mobile, parent_password, roll_number, photo_file, father_name, father_mobile, father_email, mother_name, mother_mobile, mother_email, address, transport_facility, pickup_location, bus_number"),
        supabase.from("sections").select("*"),
        supabase.from("fee_payments").select("*").order("payment_date", { ascending: false }),
      ]);

      if (staffRes.data) setStaff(staffRes.data.map(mapStaffRow));
      if (studentsRes.data) setStudents(studentsRes.data.map(mapStudentRow));
      if (sectionsRes.data) setSections(sectionsRes.data);
      if (feeRes.data) setFeeHistory(feeRes.data.map(mapFeeRow));
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addStaff = async (data: Omit<StaffMember, "id" | "salaryPaid"> & { loginPassword?: string }) => {
    try {
      const dbRole = ROLE_MAP[data.role] || data.role;
      const { data: result, error } = await supabase.from("staff").insert([{
        "Full Name": data.name,
        Role: dbRole,
        "Monthly Salary": data.salary,
        "Mobile number": data.mobileNumber ? Number(data.mobileNumber) : null,
        Photo: data.photoFile || null,
        Resume: data.resumeFile || null,
        teaching_classes: data.teachingClasses,
        "Login Password": data.loginPassword || null,
        join_date: data.joinDate || new Date().toISOString().split("T")[0],
        salary_paid: false,
      }).select().single();
      if (error) throw error;
      if (result) setStaff((prev) => [...prev, mapStaffRow(result)]);
      toast.success("Staff added successfully");
    } catch (err: any) {
      console.error("Failed to add staff:", err);
      toast.error("Failed to add staff");
    }
  };

  const removeStaff = async (id: string) => {
    try {
      const { error } = await supabase.from("staff").delete().eq("id", id);
      if (error) throw error;
      setStaff((prev) => prev.filter((s) => s.id !== id));
      toast.success("Staff removed");
    } catch {
      toast.error("Failed to remove staff");
    }
  };

  const updateStaffSalary = async (id: string, salary: number) => {
    try {
      const { error } = await supabase.from("staff").update({ "Monthly Salary": salary }).eq("id", id);
      if (error) throw error;
      setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, salary } : s)));
      toast.success("Salary updated");
    } catch {
      toast.error("Failed to update salary");
    }
  };

  const updateStaff = async (id: string, updates: Partial<StaffMember>) => {
    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates["Full Name"] = updates.name;
      if (updates.role !== undefined) dbUpdates.Role = ROLE_MAP[updates.role] || updates.role;
      if (updates.salary !== undefined) dbUpdates["Monthly Salary"] = updates.salary;
      if (updates.mobileNumber !== undefined) dbUpdates["Mobile number"] = updates.mobileNumber ? Number(updates.mobileNumber) : null;
      if (updates.photoFile !== undefined) dbUpdates.Photo = updates.photoFile;
      if (updates.resumeFile !== undefined) dbUpdates.Resume = updates.resumeFile;
      if (updates.teachingClasses !== undefined) dbUpdates.teaching_classes = updates.teachingClasses;
      
      const { error } = await supabase.from("staff").update(dbUpdates as any).eq("id", id);
      if (error) throw error;
      setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
      toast.success("Staff updated");
    } catch {
      toast.error("Failed to update staff");
    }
  };

  const addStudent = async (data: Omit<Student, "id" | "admissionNumber" | "rollNumber" | "feePaid" | "enrollDate" | "installments" | "paymentMode">): Promise<{ admissionNumber: string; password: string; studentName: string } | null> => {
    try {
      // Get next admission number
      const counterRes = await supabase.from("app_settings").select("value").eq("key", "admission_counter").single();
      let counter = counterRes.data ? parseInt(counterRes.data.value) : 0;
      counter += 1;
      const admissionNumber = String(counter).padStart(4, "0");

      const { data: result, error } = await supabase.from("students").insert({
        admission_number: admissionNumber,
        name: data.name,
        class_name: data.className,
        section: data.section,
        fee_amount: data.feeAmount,
        fee_paid: false,
        enroll_date: new Date().toISOString().split("T")[0],
        installments: [],
        payment_mode: "cash",
        photo_file: data.photoFile || null,
        father_name: data.fatherName || null,
        father_mobile: data.fatherMobile || null,
        father_email: data.fatherEmail || null,
        mother_name: data.motherName || null,
        mother_mobile: data.motherMobile || null,
        mother_email: data.motherEmail || null,
        address: data.address || null,
        transport_facility: data.transportFacility || false,
        pickup_location: data.pickupLocation || null,
        bus_number: data.busNumber || null,
        parent_password: data.parentPassword || null,
      }).select().single();
      if (error) throw error;

      // Update counter
      await supabase.from("app_settings").upsert({ key: "admission_counter", value: String(counter) });

      if (result) setStudents((prev) => [...prev, mapStudentRow(result)]);

      toast.success(`Student added — Admission No: ${admissionNumber}`);
      return { admissionNumber, password: data.parentPassword || "", studentName: data.name };
    } catch (err: any) {
      console.error("Failed to add student:", err);
      toast.error("Failed to add student");
      return null;
    }
  };

  const removeStudent = async (id: string) => {
    try {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
      setStudents((prev) => prev.filter((s) => s.id !== id));
      toast.success("Student removed");
    } catch {
      toast.error("Failed to remove student");
    }
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.className !== undefined) dbUpdates.class_name = updates.className;
      if (updates.section !== undefined) dbUpdates.section = updates.section;
      if (updates.feeAmount !== undefined) dbUpdates.fee_amount = updates.feeAmount;
      if (updates.feePaid !== undefined) dbUpdates.fee_paid = updates.feePaid;
      if (updates.installments !== undefined) dbUpdates.installments = updates.installments;
      if (updates.paymentMode !== undefined) dbUpdates.payment_mode = updates.paymentMode;
      if (updates.photoFile !== undefined) dbUpdates.photo_file = updates.photoFile;
      if (updates.fatherName !== undefined) dbUpdates.father_name = updates.fatherName;
      if (updates.fatherMobile !== undefined) dbUpdates.father_mobile = updates.fatherMobile;
      if (updates.fatherEmail !== undefined) dbUpdates.father_email = updates.fatherEmail;
      if (updates.motherName !== undefined) dbUpdates.mother_name = updates.motherName;
      if (updates.motherMobile !== undefined) dbUpdates.mother_mobile = updates.motherMobile;
      if (updates.motherEmail !== undefined) dbUpdates.mother_email = updates.motherEmail;
      if (updates.address !== undefined) dbUpdates.address = updates.address;
      if (updates.transportFacility !== undefined) dbUpdates.transport_facility = updates.transportFacility;
      if (updates.pickupLocation !== undefined) dbUpdates.pickup_location = updates.pickupLocation;
      if (updates.busNumber !== undefined) dbUpdates.bus_number = updates.busNumber;
      if (updates.rollNumber !== undefined) dbUpdates.roll_number = updates.rollNumber;
      if (updates.parentName !== undefined) dbUpdates.parent_name = updates.parentName;
      if (updates.parentMobile !== undefined) dbUpdates.parent_mobile = updates.parentMobile;

      const { error } = await supabase.from("students").update(dbUpdates as any).eq("id", id);
      if (error) throw error;
      setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
      toast.success("Student updated");
    } catch {
      toast.error("Failed to update student");
    }
  };

  const submitFee = async (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;
    try {
      const { data: result, error } = await supabase.from("fee_payments").insert({
        student_id: studentId,
        student_name: student.name,
        class_name: student.className,
        section: student.section,
        amount: student.feeAmount,
        payment_date: new Date().toISOString().split("T")[0],
        payment_mode: student.paymentMode,
        cashier_name: "Cashier",
      }).select().single();
      if (error) throw error;

      await supabase.from("students").update({ fee_paid: true }).eq("id", studentId);

      if (result) setFeeHistory((prev) => [mapFeeRow(result), ...prev]);
      setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, feePaid: true } : s)));
      toast.success("Fee submitted");
    } catch {
      toast.error("Failed to submit fee");
    }
  };

  const paySalary = async (staffId: string) => {
    try {
      const { error } = await supabase.from("staff").update({ salary_paid: true }).eq("id", staffId);
      if (error) throw error;
      setStaff((prev) => prev.map((s) => (s.id === staffId ? { ...s, salaryPaid: true } : s)));
      toast.success("Salary marked as paid");
    } catch {
      toast.error("Failed to update salary status");
    }
  };

  const resetSalaries = async () => {
    try {
      const { error } = await supabase.from("staff").update({ salary_paid: false }).neq("id", "");
      if (error) throw error;
      setStaff((prev) => prev.map((s) => ({ ...s, salaryPaid: false })));
      toast.success("Salaries reset");
    } catch {
      toast.error("Failed to reset salaries");
    }
  };

  const addSection = async (className: ClassName, sectionName: string) => {
    try {
      const { data: result, error } = await supabase.from("sections").insert({
        class_name: className,
        name: sectionName,
      }).select().single();
      if (error) throw error;
      if (result) setSections((prev) => [...prev, result]);
      toast.success("Section added");
    } catch {
      toast.error("Failed to add section");
    }
  };

  const removeSection = async (className: ClassName, sectionId: string) => {
    try {
      const { error } = await supabase.from("sections").delete().eq("id", sectionId);
      if (error) throw error;
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
      toast.success("Section removed");
    } catch {
      toast.error("Failed to remove section");
    }
  };

  return (
    <SchoolContext.Provider
      value={{ staff, students, classes, feeHistory, loading, addStaff, removeStaff, updateStaffSalary, updateStaff, addStudent, removeStudent, updateStudent, submitFee, paySalary, resetSalaries, addSection, removeSection }}
    >
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (!context) throw new Error("useSchool must be used within SchoolProvider");
  return context;
}
