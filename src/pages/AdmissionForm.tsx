import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send, User, Phone, Mail, MapPin, BookOpen, Calendar, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import TopBar from "@/components/TopBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const classOptions = [
  "Nursery", "LKG", "UKG", "Class I", "Class II", "Class III",
  "Class IV", "Class V", "Class VI", "Class VII", "Class VIII",
  "Class IX", "Class X", "Class XI", "Class XII",
];

const AdmissionForm = () => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    studentName: "", dob: "", gender: "", classApplied: "", fatherName: "", motherName: "",
    guardianPhone: "", alternatePhone: "", email: "", address: "", city: "", state: "Uttar Pradesh",
    pincode: "", previousSchool: "", aadharNumber: "", category: "", religion: "",
    nationality: "Indian", bloodGroup: "", medicalConditions: "", siblings: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const required = ["studentName", "dob", "gender", "classApplied", "fatherName", "motherName", "guardianPhone", "address", "pincode"];
    const missing = required.filter((f) => !formData[f as keyof typeof formData]);
    if (missing.length > 0) {
      toast({ title: "Missing Fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast({ title: "Application Submitted!", description: "We will contact you shortly regarding the admission process." });
      setFormData({
        studentName: "", dob: "", gender: "", classApplied: "", fatherName: "", motherName: "",
        guardianPhone: "", alternatePhone: "", email: "", address: "", city: "", state: "Uttar Pradesh",
        pincode: "", previousSchool: "", aadharNumber: "", category: "", religion: "",
        nationality: "Indian", bloodGroup: "", medicalConditions: "", siblings: "",
      });
    }, 1500);
  };

  const FieldGroup = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-6 space-y-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-bold text-foreground">{title}</h3>
      </div>
      {children}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Navbar />

      <section className="pt-32 pb-20 bg-dot-pattern relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

        <div className="container px-4 relative max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-secondary font-semibold tracking-widest uppercase text-xs mb-4">Session 2026–27</p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Online <span className="text-shimmer">Admission Form</span>
            </h1>
            <div className="section-divider mb-6" />
            <p className="text-muted-foreground text-lg">
              Fill in the details below to apply for admission at Universal Public School.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <FieldGroup icon={User} title="Student Information">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Student Full Name *</Label><Input value={formData.studentName} onChange={(e) => handleChange("studentName", e.target.value)} placeholder="Enter student's full name" required /></div>
                <div><Label>Date of Birth *</Label><Input type="date" value={formData.dob} onChange={(e) => handleChange("dob", e.target.value)} required /></div>
                <div><Label>Gender *</Label><Select value={formData.gender} onValueChange={(v) => handleChange("gender", v)}><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
                <div><Label>Class Applied For *</Label><Select value={formData.classApplied} onValueChange={(v) => handleChange("classApplied", v)}><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>{classOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Blood Group</Label><Select value={formData.bloodGroup} onValueChange={(v) => handleChange("bloodGroup", v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Aadhar Number</Label><Input value={formData.aadharNumber} onChange={(e) => handleChange("aadharNumber", e.target.value)} placeholder="12-digit Aadhar number" maxLength={12} /></div>
              </div>
            </FieldGroup>

            <FieldGroup icon={Users} title="Parent / Guardian Information">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Father's Name *</Label><Input value={formData.fatherName} onChange={(e) => handleChange("fatherName", e.target.value)} placeholder="Father's full name" required /></div>
                <div><Label>Mother's Name *</Label><Input value={formData.motherName} onChange={(e) => handleChange("motherName", e.target.value)} placeholder="Mother's full name" required /></div>
                <div><Label>Guardian Phone *</Label><Input type="tel" value={formData.guardianPhone} onChange={(e) => handleChange("guardianPhone", e.target.value)} placeholder="+91 XXXXXXXXXX" required maxLength={13} /></div>
                <div><Label>Alternate Phone</Label><Input type="tel" value={formData.alternatePhone} onChange={(e) => handleChange("alternatePhone", e.target.value)} placeholder="+91 XXXXXXXXXX" maxLength={13} /></div>
                <div className="sm:col-span-2"><Label>Email Address</Label><Input type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="parent@email.com" /></div>
              </div>
            </FieldGroup>

            <FieldGroup icon={MapPin} title="Address Details">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><Label>Full Address *</Label><Textarea value={formData.address} onChange={(e) => handleChange("address", e.target.value)} placeholder="House/Village, Locality" required /></div>
                <div><Label>City / Town</Label><Input value={formData.city} onChange={(e) => handleChange("city", e.target.value)} placeholder="e.g. Motipur" /></div>
                <div><Label>State</Label><Input value={formData.state} onChange={(e) => handleChange("state", e.target.value)} /></div>
                <div><Label>Pincode *</Label><Input value={formData.pincode} onChange={(e) => handleChange("pincode", e.target.value)} placeholder="272153" required maxLength={6} /></div>
                <div><Label>Nationality</Label><Input value={formData.nationality} onChange={(e) => handleChange("nationality", e.target.value)} /></div>
              </div>
            </FieldGroup>

            <FieldGroup icon={BookOpen} title="Academic & Other Details">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Previous School Name</Label><Input value={formData.previousSchool} onChange={(e) => handleChange("previousSchool", e.target.value)} placeholder="If applicable" /></div>
                <div><Label>Category</Label><Select value={formData.category} onValueChange={(v) => handleChange("category", v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="general">General</SelectItem><SelectItem value="obc">OBC</SelectItem><SelectItem value="sc">SC</SelectItem><SelectItem value="st">ST</SelectItem><SelectItem value="ews">EWS</SelectItem></SelectContent></Select></div>
                <div><Label>Religion</Label><Input value={formData.religion} onChange={(e) => handleChange("religion", e.target.value)} placeholder="Enter religion" /></div>
                <div><Label>Siblings at UPS</Label><Input value={formData.siblings} onChange={(e) => handleChange("siblings", e.target.value)} placeholder="Name & class (if any)" /></div>
                <div className="sm:col-span-2"><Label>Medical Conditions (if any)</Label><Textarea value={formData.medicalConditions} onChange={(e) => handleChange("medicalConditions", e.target.value)} placeholder="Any allergies, conditions, or special needs" /></div>
              </div>
            </FieldGroup>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center">
              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground font-bold px-10 py-4 rounded-xl text-base transition-all disabled:opacity-50"
                style={{ boxShadow: "var(--gold-glow)" }}
              >
                {submitting ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-secondary-foreground/30 border-t-secondary-foreground rounded-full" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                {submitting ? "Submitting..." : "Submit Application"}
              </motion.button>
              <p className="text-xs text-muted-foreground mt-3">* Fields marked with asterisk are mandatory</p>
            </motion.div>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AdmissionForm;