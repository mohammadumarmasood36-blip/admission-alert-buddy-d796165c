import { useRef, useEffect, useState } from "react";
import { Student } from "@/context/SchoolContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer } from "lucide-react";
import Barcode from "react-barcode";
import { supabase } from "@/integrations/supabase/client";

interface StudentIdCardProps {
  student: Student;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolName?: string;
  session?: string;
}

export default function StudentIdCard({ student, open, onOpenChange, schoolName = "Universal Public School", session = "2025-26" }: StudentIdCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [principalSignature, setPrincipalSignature] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      supabase.from("app_settings").select("value").eq("key", "principal_profile").maybeSingle().then(({ data }) => {
        if (data?.value) {
          try {
            const parsed = JSON.parse(data.value);
            setPrincipalSignature(parsed.signature || "");
          } catch {}
        }
      });
      supabase.from("student_subjects").select("subject_name").eq("student_id", student.id).then(({ data }) => {
        setSubjects((data || []).map((r: any) => r.subject_name));
      });
    }
  }, [open, student.id]);

  const handlePrint = () => {
    const printContent = cardRef.current;
    if (!printContent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>ID Card - ${student.name}</title>
      <style>@media print{@page{size:2.5in 4in;margin:0;}}body{margin:0;padding:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#fff;font-family:'Segoe UI',system-ui,sans-serif;}</style>
      </head><body>${printContent.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  const W = "2.5in";
  const H = "4in";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Student ID Card</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 mt-2">
          <div ref={cardRef}>
            <div style={{
              width: W, minHeight: H, borderRadius: "12px", overflow: "hidden",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              display: "flex", flexDirection: "column",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              border: "2px solid #1565c0",
              background: "linear-gradient(180deg, #e3f2fd 0%, #ffffff 25%, #f5f5f5 75%, #e8f5e9 100%)",
              position: "relative"
            }}>
              {/* Top wave decoration */}
              <svg viewBox="0 0 240 60" style={{ width: "100%", display: "block" }} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="hg1" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#1565c0" />
                    <stop offset="50%" stopColor="#0d47a1" />
                    <stop offset="100%" stopColor="#2e7d32" />
                  </linearGradient>
                  <linearGradient id="hg2" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#42a5f5" />
                    <stop offset="100%" stopColor="#66bb6a" />
                  </linearGradient>
                </defs>
                <path d="M0,0 L240,0 L240,45 Q180,60 120,42 Q60,25 0,50 Z" fill="url(#hg1)" />
                <path d="M0,48 Q60,22 120,40 Q180,58 240,42 L240,55 Q180,65 120,50 Q60,35 0,58 Z" fill="url(#hg2)" opacity="0.5" />
              </svg>

              {/* School header - overlaid on wave */}
              <div style={{
                position: "absolute", top: "4px", left: "0", right: "0",
                display: "flex", alignItems: "center", gap: "6px", padding: "0 10px",
                zIndex: 2
              }}>
                <img src="/school-logo.png" alt="Logo"
                  style={{ width: "34px", height: "34px", borderRadius: "50%", background: "rgba(255,255,255,0.9)", objectFit: "contain", padding: "2px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div style={{ flex: 1, textAlign: "center" }}>
                  <h2 style={{ fontSize: "13px", margin: 0, fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "1px", textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
                    {schoolName}
                  </h2>
                  <p style={{ fontSize: "5.5px", margin: "1px 0", color: "rgba(255,255,255,0.9)", fontStyle: "italic", letterSpacing: "0.3px" }}>
                    Knowledge Today • Success Tomorrow
                  </p>
                  <p style={{ fontSize: "6px", margin: 0, color: "#ffeb3b", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                    Motipur, Santha, Sant Kabir Nagar
                  </p>
                </div>
              </div>

              {/* Photo + Details row */}
              <div style={{ display: "flex", padding: "6px 10px 4px", gap: "8px", alignItems: "flex-start" }}>
                {/* Photo section */}
                <div style={{ flexShrink: 0 }}>
                  <div style={{
                    width: "68px", height: "82px", borderRadius: "8px",
                    border: "2.5px solid #1565c0", overflow: "hidden",
                    background: "#e3f2fd", display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(21,101,192,0.3)"
                  }}>
                    {student.photoFile ? (
                      <img src={student.photoFile} alt={student.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "30px", fontWeight: 700, color: "#1565c0" }}>{student.name.charAt(0)}</span>
                    )}
                  </div>
                  {/* Motto badge */}
                  <div style={{
                    background: "linear-gradient(135deg, #0d47a1, #1b5e20)",
                    borderRadius: "6px", padding: "3px 4px", marginTop: "4px",
                    textAlign: "center"
                  }}>
                    <span style={{ fontSize: "4.5px", color: "#ffeb3b", fontWeight: 700, letterSpacing: "0.3px" }}>
                      LEARN • GROW • SUCCEED
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div style={{ flex: 1, fontSize: "7.5px", lineHeight: 1.6 }}>
                  {/* Student Name */}
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                    <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#2e7d32", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "8px", color: "#fff" }}>👤</span>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: "9px", color: "#0d47a1" }}>{student.name}</span>
                  </div>

                  {/* Father */}
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "3px" }}>
                    <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#2e7d32", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "8px", color: "#fff" }}>👤</span>
                    </div>
                    <div>
                      <div style={{ fontSize: "5.5px", color: "#2e7d32", fontWeight: 700, textTransform: "uppercase" }}>Father's Name</div>
                      <div style={{ fontWeight: 700, color: "#111" }}>{student.fatherName || student.parentName || "N/A"}</div>
                    </div>
                  </div>

                  {/* Class */}
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "3px" }}>
                    <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#1565c0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "7px", color: "#fff" }}>🎓</span>
                    </div>
                    <div>
                      <span style={{ fontWeight: 800, color: "#0d47a1" }}>CLASS </span>
                      <span style={{ fontWeight: 800, color: "#111" }}>{student.className}-{student.section}</span>
                      <div style={{ fontSize: "6.5px", color: "#555" }}>Roll No: {student.rollNumber || "N/A"}</div>
                    </div>
                  </div>

                  {/* Address */}
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "3px" }}>
                    <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#c2185b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "7px", color: "#fff" }}>📍</span>
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: "#c2185b" }}>Address: </span>
                      <span style={{ color: "#333" }}>{student.address || "N/A"}</span>
                    </div>
                  </div>

                  {/* Mobile */}
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#e65100", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "7px", color: "#fff" }}>📞</span>
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: "#e65100", textTransform: "uppercase", fontSize: "6px" }}>Mobile </span>
                      <span style={{ fontWeight: 700, color: "#111" }}>{student.fatherMobile || student.parentMobile || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subjects strip */}
              {subjects.length > 0 && (
                <div style={{ padding: "2px 8px 4px" }}>
                  <div style={{ fontSize: "5.5px", color: "#0d47a1", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "2px" }}>
                    Subjects
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
                    {subjects.map((s) => (
                      <span key={s} style={{
                        fontSize: "5.5px", fontWeight: 700, color: "#fff",
                        background: "linear-gradient(135deg, #1565c0, #2e7d32)",
                        padding: "1px 4px", borderRadius: "3px"
                      }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom section: Barcode + Signature */}
              <div style={{ marginTop: "auto" }}>
                {/* Bottom wave */}
                <svg viewBox="0 0 240 20" style={{ width: "100%", display: "block" }} preserveAspectRatio="none">
                  <path d="M0,8 Q60,0 120,10 Q180,20 240,5 L240,20 L0,20 Z" fill="url(#hg2)" opacity="0.3" />
                  <path d="M0,14 Q60,5 120,15 Q180,22 240,10 L240,20 L0,20 Z" fill="url(#hg1)" opacity="0.15" />
                </svg>

                <div style={{
                  background: "linear-gradient(90deg, #e3f2fd, #e8f5e9)",
                  padding: "4px 10px 6px",
                  display: "flex", justifyContent: "space-between", alignItems: "flex-end"
                }}>
                  {/* Barcode + Adm No */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Barcode
                      value={student.admissionNumber || "0000"}
                      width={1}
                      height={18}
                      fontSize={0}
                      margin={0}
                      displayValue={false}
                    />
                    <div style={{
                      background: "#0d47a1", color: "#fff", fontSize: "7px", fontWeight: 800,
                      padding: "1px 8px", borderRadius: "3px", marginTop: "2px", letterSpacing: "0.5px"
                    }}>
                      ADM NO. {student.admissionNumber}
                    </div>
                  </div>

                  {/* Principal Signature */}
                  <div style={{ textAlign: "center" }}>
                    {principalSignature ? (
                      <img src={principalSignature} alt="Signature" style={{ height: "20px", objectFit: "contain", marginBottom: "1px" }} />
                    ) : (
                      <div style={{ fontFamily: "cursive", fontSize: "10px", color: "#333", marginBottom: "1px" }}>✍</div>
                    )}
                    <div style={{ borderTop: "1px solid #1565c0", width: "65px", marginBottom: "1px" }} />
                    <span style={{ fontSize: "5.5px", color: "#0d47a1", fontWeight: 700, textTransform: "uppercase" }}>Principal Signature</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={handlePrint} className="gap-2 w-full">
            <Printer className="w-4 h-4" /> Print ID Card
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
