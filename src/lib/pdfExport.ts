import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const SCHOOL_NAME = "Universal Public School";
const SCHOOL_TAGLINE = "Excellence in Education";

function addHeader(doc: jsPDF, title: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(30, 58, 138); // primary blue
  doc.rect(0, 0, pageWidth, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(SCHOOL_NAME, pageWidth / 2, 16, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(SCHOOL_TAGLINE, pageWidth / 2, 24, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth / 2, 33, { align: "center" });
  doc.setTextColor(0, 0, 0);
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated on ${new Date().toLocaleDateString("en-IN")}`, 14, pageHeight - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: "right" });
    doc.text(SCHOOL_NAME, pageWidth / 2, pageHeight - 10, { align: "center" });
  }
}

export interface SeatingPlanData {
  examName: string;
  class: string;
  room: string;
  date: string;
  students: string[];
  capacity: number;
}

export function exportSeatingPlanPDF(plans: SeatingPlanData[]) {
  const doc = new jsPDF();
  addHeader(doc, "Seating Plan");

  let y = 46;

  plans.forEach((plan, idx) => {
    if (idx > 0 && y > 230) {
      doc.addPage();
      addHeader(doc, "Seating Plan");
      y = 46;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${plan.examName} — Class ${plan.class}`, 14, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Room: ${plan.room}  |  Date: ${new Date(plan.date).toLocaleDateString("en-IN")}  |  Capacity: ${plan.capacity}`, 14, y);
    y += 8;

    const tableData = plan.students.map((s, i) => [String(i + 1), s]);
    autoTable(doc, {
      startY: y,
      head: [["S.No", "Student Name"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 9, fontStyle: "bold" },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
      tableWidth: "auto",
    });
    y = (doc as any).lastAutoTable.finalY + 14;
  });

  addFooter(doc);
  doc.save("Seating_Plan.pdf");
}

export interface TimetableData {
  examName: string;
  class: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
}

export function exportTimetablePDF(entries: TimetableData[]) {
  const doc = new jsPDF("landscape");
  addHeader(doc, "Exam Timetable");

  const tableData = entries.map((e, i) => [
    String(i + 1),
    e.examName,
    e.class,
    e.subject,
    new Date(e.date).toLocaleDateString("en-IN"),
    `${e.startTime} - ${e.endTime}`,
    e.room,
  ]);

  autoTable(doc, {
    startY: 46,
    head: [["S.No", "Exam Name", "Class", "Subject", "Date", "Time", "Room"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 10, fontStyle: "bold" },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
    columnStyles: { 0: { cellWidth: 15 } },
  });

  addFooter(doc);
  doc.save("Exam_Timetable.pdf");
}

export interface ResultData {
  studentName: string;
  admissionNo: string;
  examName: string;
  subject: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
}

export function exportReportCardPDF(
  studentName: string,
  admissionNo: string,
  className: string,
  results: ResultData[]
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, 44, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(SCHOOL_NAME, pageWidth / 2, 16, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(SCHOOL_TAGLINE, pageWidth / 2, 24, { align: "center" });
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("REPORT CARD", pageWidth / 2, 36, { align: "center" });

  // Student info box
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, 50, pageWidth - 28, 28, 3, 3, "S");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Student Name:", 20, 60);
  doc.setFont("helvetica", "normal");
  doc.text(studentName, 60, 60);

  doc.setFont("helvetica", "bold");
  doc.text("Admission No:", 20, 70);
  doc.setFont("helvetica", "normal");
  doc.text(admissionNo, 62, 70);

  doc.setFont("helvetica", "bold");
  doc.text("Class:", pageWidth / 2 + 10, 60);
  doc.setFont("helvetica", "normal");
  doc.text(className, pageWidth / 2 + 30, 60);

  doc.setFont("helvetica", "bold");
  doc.text("Date:", pageWidth / 2 + 10, 70);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString("en-IN"), pageWidth / 2 + 30, 70);

  // Results table
  const tableData = results.map((r, i) => [
    String(i + 1),
    r.examName,
    r.subject,
    String(r.marksObtained),
    String(r.maxMarks),
    `${((r.marksObtained / r.maxMarks) * 100).toFixed(1)}%`,
    r.grade,
  ]);

  // Calculate totals
  const totalObtained = results.reduce((sum, r) => sum + r.marksObtained, 0);
  const totalMax = results.reduce((sum, r) => sum + r.maxMarks, 0);
  const overallPct = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : "0";

  tableData.push(["", "", "TOTAL", String(totalObtained), String(totalMax), `${overallPct}%`, ""]);

  autoTable(doc, {
    startY: 86,
    head: [["S.No", "Exam", "Subject", "Obtained", "Max Marks", "Percentage", "Grade"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
    didParseCell: (data: any) => {
      // Bold the total row
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [240, 240, 250];
      }
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Overall result box
  doc.setFillColor(240, 245, 255);
  doc.roundedRect(14, finalY, pageWidth - 28, 22, 3, 3, "F");
  doc.setDrawColor(30, 58, 138);
  doc.roundedRect(14, finalY, pageWidth - 28, 22, 3, 3, "S");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Overall Percentage: ${overallPct}%`, 24, finalY + 9);
  doc.text(`Total: ${totalObtained}/${totalMax}`, pageWidth / 2, finalY + 9);

  const overallGrade = Number(overallPct) >= 90 ? "A+" : Number(overallPct) >= 80 ? "A" : Number(overallPct) >= 70 ? "B+" : Number(overallPct) >= 60 ? "B" : Number(overallPct) >= 50 ? "C" : Number(overallPct) >= 40 ? "D" : "F";
  doc.text(`Grade: ${overallGrade}`, pageWidth - 60, finalY + 9);

  // Signature lines
  const sigY = finalY + 40;
  doc.setLineWidth(0.3);
  doc.setDrawColor(100, 100, 100);
  doc.line(20, sigY, 80, sigY);
  doc.line(pageWidth / 2 - 30, sigY, pageWidth / 2 + 30, sigY);
  doc.line(pageWidth - 80, sigY, pageWidth - 20, sigY);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Class Teacher", 50, sigY + 5, { align: "center" });
  doc.text("Exam Incharge", pageWidth / 2, sigY + 5, { align: "center" });
  doc.text("Principal", pageWidth - 50, sigY + 5, { align: "center" });

  addFooter(doc);
  doc.save(`Report_Card_${admissionNo}.pdf`);
}
