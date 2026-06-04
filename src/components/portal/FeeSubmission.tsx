import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useSchool, Student } from "@/context/SchoolContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Search, User, CreditCard, IndianRupee, Printer, QrCode, ArrowLeft, Loader2, Eye } from "lucide-react";

interface QuarterData {
  label: string;
  dueAmount: number;
  conAmount: number;
  paidAmount: number;
  excessAmount: number;
  balAmount: number;
}

function getQuarterlyData(student: Student, payments: any[]): QuarterData[] {
  const quarterlyFee = Math.round(student.feeAmount / 4);
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  
  return quarters.map((q, idx) => {
    const quarterPayments = payments.filter((p: any) => p.quarter === q);
    const totalPaid = quarterPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const due = quarterlyFee;
    const excess = Math.max(0, totalPaid - due);
    const bal = Math.max(0, due - totalPaid);
    
    return {
      label: q,
      dueAmount: due,
      conAmount: 0,
      paidAmount: totalPaid,
      excessAmount: excess,
      balAmount: bal,
    };
  });
}

// ─── Fee Details Dashboard (Image 1) ───
function FeeDetailsDashboard({ student, quarters, onSubmitFee }: { student: Student; quarters: QuarterData[]; onSubmitFee: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold font-display">Fee Details</h3>
        <p className="text-sm text-muted-foreground">{student.name} — {student.className} ({student.section})</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quarters.map((q) => (
          <Card key={q.label} className="border-border overflow-hidden">
            <CardHeader className="bg-muted/60 py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-primary">{q.label}</CardTitle>
              <Info />
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Row label="Due Amt" value={q.dueAmount} color="text-primary" />
              <Row label="Con Amt" value={q.conAmount} />
              <Row label="Paid Amt" value={q.paidAmount} />
              <Row label="Excess Amt" value={q.excessAmount} />
              <Row label="Bal Amt" value={q.balAmount} color={q.balAmount > 0 ? "text-destructive" : "text-success"} bold />
            </CardContent>
            <div className="bg-muted/40 px-4 py-2 flex justify-center">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Button onClick={onSubmitFee} size="lg" className="gap-2 px-8">
          <IndianRupee className="w-4 h-4" /> Submit Fees
        </Button>
      </div>
    </div>
  );
}

function Info() {
  return <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-bold">i</div>;
}

function Row({ label, value, color, bold }: { label: string; value: number; color?: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={`${color || "text-muted-foreground"}`}>{label}</span>
      <span className={`${color || "text-foreground"} ${bold ? "font-bold" : ""}`}>{value.toLocaleString("en-IN")}</span>
    </div>
  );
}

// ─── Quarter Selection (Image 2) ───
function QuarterSelection({
  student,
  quarters,
  onProceedToPay,
  onBack,
}: {
  student: Student;
  quarters: QuarterData[];
  onProceedToPay: (selectedQuarters: string[], totalAmount: number) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const unpaidQuarters = quarters.filter((q) => q.balAmount > 0);

  const toggleQuarter = (label: string) => {
    setSelected((prev) => (prev.includes(label) ? prev.filter((q) => q !== label) : [...prev, label]));
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelected(checked ? unpaidQuarters.map((q) => q.label) : []);
  };

  const totalPayable = selected.reduce((sum, ql) => {
    const q = quarters.find((qq) => qq.label === ql);
    return sum + (q?.balAmount || 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </div>

      <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground">{student.name.toUpperCase()}</p>
            <p className="text-xs text-muted-foreground">{student.className} ({student.section}) — {student.admissionNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectAll}
            onCheckedChange={(c) => handleSelectAll(!!c)}
            id="selectAll"
          />
          <Label htmlFor="selectAll" className="text-sm font-medium">Select All</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quarters.map((q) => {
          const isUnpaid = q.balAmount > 0;
          const isSelected = selected.includes(q.label);
          const bgColor = isSelected
            ? "bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-800"
            : isUnpaid
            ? "bg-card border-border"
            : "bg-muted/30 border-border opacity-60";

          return (
            <div
              key={q.label}
              className={`rounded-xl border p-4 relative transition-all ${bgColor}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                  isSelected ? "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100" : 
                  q.balAmount > 0 ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200" : 
                  "bg-muted text-muted-foreground"
                }`}>
                  {q.label}
                </span>
                {isUnpaid && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleQuarter(q.label)}
                  />
                )}
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">Late Fee : 0</p>
                <p className="text-muted-foreground">ReAdm Fee : 0</p>
              </div>
              <div className="flex items-center justify-end gap-1 mt-3">
                <span className={`font-bold text-sm ${isSelected ? "text-green-700 dark:text-green-300" : q.balAmount > 0 ? "text-primary" : "text-muted-foreground"}`}>
                  Amount: {q.balAmount.toLocaleString("en-IN")}
                </span>
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center space-y-4">
        <Button variant="secondary" size="lg" className="w-full max-w-md" disabled>
          Fee To Be Paid
        </Button>

        <div className="bg-card border border-border rounded-xl p-4 max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Payable Amount :</span>
            <span className="text-xl font-bold text-primary">{totalPayable.toLocaleString("en-IN")} ₹</span>
          </div>
        </div>

        <Button
          onClick={() => onProceedToPay(selected, totalPayable)}
          disabled={selected.length === 0}
          size="lg"
          className="gap-2 px-8 bg-green-600 hover:bg-green-700 text-white"
        >
          Proceed To Pay ›
        </Button>
      </div>
    </div>
  );
}

// ─── Payment Mode Dialog ───
function PaymentModeDialog({
  open,
  onClose,
  student,
  selectedQuarters,
  totalAmount,
  session,
  cashierName,
  onPaymentComplete,
}: {
  open: boolean;
  onClose: () => void;
  student: Student;
  selectedQuarters: string[];
  totalAmount: number;
  session: string;
  cashierName: string;
  onPaymentComplete: () => void;
}) {
  const [mode, setMode] = useState<"select" | "cash" | "online" | "cheque">("select");
  const [processing, setProcessing] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [chequeDetails, setChequeDetails] = useState({
    bankName: "",
    accountNumber: "",
    chequeNumber: "",
    chequeDate: "",
    branchName: "",
    ifscCode: "",
  });
  const [receiptData, setReceiptData] = useState<any>(null);
  const [intent, setIntent] = useState<{ tr: string; expectedAmount: number } | null>(null);
  const [intentLoading, setIntentLoading] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);

  // Load UPI id when dialog opens
  useEffect(() => {
    if (open && mode === "select") {
      supabase.from("app_settings").select("value").eq("key", "director_upi").maybeSingle()
        .then(({ data }) => {
          if (data?.value) {
            try { setUpiId(JSON.parse(data.value)); } catch { setUpiId(data.value); }
          }
        });
    }
  }, [open, mode]);

  // Server-issued payment intent: regenerates whenever student / quarters / amount change
  // while the online tab is active. Guarantees the QR's `tr` always matches the
  // backend-locked expected amount.
  useEffect(() => {
    if (!open || mode !== "online") return;
    let cancelled = false;
    setIntent(null);
    setIntentError(null);
    setIntentLoading(true);
    supabase.functions.invoke("create-payment-intent", {
      body: {
        studentId: student.id,
        session,
        quarters: selectedQuarters,
        cashierName,
      },
    }).then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data?.tr) {
        setIntentError(data?.error || error?.message || "Failed to create payment reference");
      } else {
        setIntent({ tr: data.tr, expectedAmount: Number(data.expectedAmount) });
      }
      setIntentLoading(false);
    });
    return () => { cancelled = true; };
  }, [open, mode, student.id, JSON.stringify(selectedQuarters), totalAmount, session, cashierName]);

  const recordPayment = async (paymentMode: string, chequeInfo?: any, txnId?: string) => {
    setProcessing(true);
    try {
      const receiptNum = `RCP-${Date.now().toString(36).toUpperCase()}`;
      
      for (const quarter of selectedQuarters) {
        const qData = { dueAmount: Math.round(student.feeAmount / 4) };
        await supabase.from("fee_payments").insert({
          student_id: student.id,
          student_name: student.name,
          class_name: student.className,
          section: student.section,
          amount: qData.dueAmount,
          payment_date: new Date().toISOString().split("T")[0],
          payment_mode: paymentMode,
          cashier_name: cashierName,
          quarter,
          session,
          receipt_number: receiptNum,
          cheque_bank: chequeInfo?.bankName || null,
          cheque_number: chequeInfo?.chequeNumber || null,
          cheque_date: chequeInfo?.chequeDate || null,
          transaction_id: txnId || null,
        });
      }

      const receipt = {
        receiptNumber: receiptNum,
        studentName: student.name,
        admissionNumber: student.admissionNumber,
        className: student.className,
        section: student.section,
        quarters: selectedQuarters,
        totalAmount,
        paymentMode,
        cashierName,
        date: new Date().toLocaleDateString("en-IN"),
        session,
        chequeInfo,
        transactionId: txnId,
      };

      setReceiptData(receipt);
      toast.success("Payment recorded successfully!");
      setTimeout(() => printReceipt(receipt), 500);
    } catch (err) {
      console.error(err);
      toast.error("Failed to record payment");
    }
    setProcessing(false);
  };

  const printReceipt = (data: any) => {
    if (!data) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const e = (v: unknown) => String(v ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    win.document.write(`
      <html><head><title>Fee Receipt</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 3px double #1a2744; padding-bottom: 16px; margin-bottom: 16px; }
        .header h1 { font-size: 22px; color: #1a2744; }
        .header p { font-size: 12px; color: #666; }
        .receipt-title { text-align: center; font-size: 16px; font-weight: bold; color: #1a2744; margin: 12px 0; text-transform: uppercase; letter-spacing: 2px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
        .info-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
        .info-row .label { color: #666; } .info-row .value { font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        th, td { padding: 8px 12px; text-align: left; border: 1px solid #ddd; font-size: 13px; }
        th { background: #1a2744; color: white; font-size: 11px; text-transform: uppercase; }
        .total-row { font-weight: bold; background: #f0f4ff; }
        .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 12px; }
        .signature { display: flex; justify-content: space-between; margin-top: 40px; }
        .signature div { text-align: center; }
        .signature .line { width: 120px; border-top: 1px solid #333; margin-bottom: 4px; }
        .signature .label { font-size: 11px; color: #666; }
        @media print { body { padding: 10px; } }
      </style></head><body>
      <div class="header">
        <h1>Universal Public School</h1>
        <p>Excellence in Education</p>
      </div>
      <div class="receipt-title">Fee Receipt</div>
      <div class="info-grid">
        <div class="info-row"><span class="label">Receipt No:</span><span class="value">${e(data.receiptNumber)}</span></div>
        <div class="info-row"><span class="label">Date:</span><span class="value">${e(data.date)}</span></div>
        <div class="info-row"><span class="label">Student:</span><span class="value">${e(data.studentName)}</span></div>
        <div class="info-row"><span class="label">Adm. No:</span><span class="value">${e(data.admissionNumber)}</span></div>
        <div class="info-row"><span class="label">Class:</span><span class="value">${e(data.className)} (${e(data.section)})</span></div>
        <div class="info-row"><span class="label">Session:</span><span class="value">${e(data.session)}</span></div>
        <div class="info-row"><span class="label">Payment Mode:</span><span class="value" style="text-transform:capitalize">${e(data.paymentMode)}</span></div>
        <div class="info-row"><span class="label">Cashier:</span><span class="value">${e(data.cashierName)}</span></div>
      </div>
      ${data.transactionId ? `
        <div style="background:#f0f4ff;padding:8px 12px;border-radius:6px;margin-bottom:12px;font-size:12px;">
          <strong>Transaction ID:</strong> ${e(data.transactionId)}
        </div>
      ` : ""}
      ${data.chequeInfo ? `
        <div style="background:#f9f9f9;padding:8px 12px;border-radius:6px;margin-bottom:12px;font-size:12px;">
          <strong>Cheque Details:</strong> ${e(data.chequeInfo.bankName)} — No. ${e(data.chequeInfo.chequeNumber)} — Date: ${e(data.chequeInfo.chequeDate)}
          ${data.chequeInfo.branchName ? ` — Branch: ${e(data.chequeInfo.branchName)}` : ""}
          ${data.chequeInfo.ifscCode ? ` — IFSC: ${e(data.chequeInfo.ifscCode)}` : ""}
          ${data.chequeInfo.accountNumber ? ` — A/C: ${e(data.chequeInfo.accountNumber)}` : ""}
        </div>
      ` : ""}
      <table>
        <thead><tr><th>S.No</th><th>Quarter</th><th>Amount (₹)</th></tr></thead>
        <tbody>
          ${data.quarters.map((q: string, i: number) => `<tr><td>${i + 1}</td><td>${e(q)}</td><td>₹ ${Math.round(data.totalAmount / data.quarters.length).toLocaleString("en-IN")}</td></tr>`).join("")}
          <tr class="total-row"><td colspan="2">Total</td><td>₹ ${Number(data.totalAmount).toLocaleString("en-IN")}</td></tr>
        </tbody>
      </table>
      <div class="signature">
        <div><div class="line"></div><div class="label">Parent/Guardian</div></div>
        <div><div class="line"></div><div class="label">Cashier</div></div>
        <div><div class="line"></div><div class="label">Principal</div></div>
      </div>
      <div class="footer">
        <p>This is a computer-generated receipt. Thank you for your payment.</p>
      </div>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  const handlePrintReceipt = () => printReceipt(receiptData);

  const handleClose = () => {
    setMode("select");
    setReceiptData(null);
    setTransactionId("");
    setChequeDetails({ bankName: "", accountNumber: "", chequeNumber: "", chequeDate: "", branchName: "", ifscCode: "" });
    onClose();
    if (receiptData) onPaymentComplete();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {receiptData ? "Payment Successful" : mode === "select" ? "Select Payment Mode" : mode === "cash" ? "Cash Payment" : mode === "online" ? "Online Payment" : "Cheque Payment"}
          </DialogTitle>
        </DialogHeader>

        {receiptData ? (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <IndianRupee className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-lg font-bold text-foreground">₹ {receiptData.totalAmount.toLocaleString("en-IN")} Paid</p>
            <p className="text-sm text-muted-foreground">Receipt: {receiptData.receiptNumber}</p>
            <Button onClick={handlePrintReceipt} className="w-full gap-2">
              <Printer className="w-4 h-4" /> Print Receipt
            </Button>
          </div>
        ) : mode === "select" ? (
          <div className="grid grid-cols-1 gap-3 mt-4">
            <p className="text-sm text-muted-foreground text-center mb-2">
              Paying ₹ {totalAmount.toLocaleString("en-IN")} for {selectedQuarters.join(", ")}
            </p>
            {[
              { key: "cash", label: "Cash", icon: "💵", desc: "Pay with cash at counter" },
              { key: "online", label: "Online (UPI)", icon: "📱", desc: "Scan QR code to pay via UPI" },
              { key: "cheque", label: "Cheque", icon: "📝", desc: "Pay via bank cheque" },
            ].map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key as any)}
                className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/40 transition-all text-left bg-card"
              >
                <span className="text-2xl">{m.icon}</span>
                <div>
                  <p className="font-semibold text-foreground">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
        ) : mode === "cash" ? (
          <div className="space-y-4 mt-4">
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <p className="text-sm text-muted-foreground">Amount to Collect</p>
              <p className="text-3xl font-bold text-foreground mt-1">₹ {totalAmount.toLocaleString("en-IN")}</p>
              <p className="text-xs text-muted-foreground mt-2">{student.name} — {selectedQuarters.join(", ")}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMode("select")} className="flex-1">Back</Button>
              <Button onClick={() => recordPayment("cash")} disabled={processing} className="flex-1 gap-2">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <IndianRupee className="w-4 h-4" />}
                Confirm Payment
              </Button>
            </div>
          </div>
        ) : mode === "online" ? (
          <div className="space-y-4 mt-4 text-center">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
              🔒 Amount is fixed at ₹{totalAmount.toLocaleString("en-IN")} and cannot be changed by the cashier or payer. Any short payment will be rejected by the server.
            </div>
            <div className="bg-white rounded-xl p-4 inline-flex items-center justify-center mx-auto" style={{ minWidth: 232, minHeight: 232 }}>
              {!upiId ? (
                <div className="w-[200px] h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                  UPI ID not configured.<br />Ask director to add it in settings.
                </div>
              ) : intentLoading || !intent ? (
                <div className="w-[200px] h-[200px] flex flex-col items-center justify-center text-sm text-muted-foreground gap-2">
                  {intentError ? (
                    <span className="text-destructive text-center px-2">{intentError}</span>
                  ) : (
                    <><Loader2 className="w-6 h-6 animate-spin" /> Generating secure QR…</>
                  )}
                </div>
              ) : (() => {
                const fixedAmount = Number(intent.expectedAmount).toFixed(2);
                const note = `Fee ${student.admissionNumber} ${selectedQuarters.join("-")}`;
                const upiUri =
                  `upi://pay?pa=${encodeURIComponent(upiId)}` +
                  `&pn=${encodeURIComponent("Universal Public School")}` +
                  `&am=${fixedAmount}` +
                  `&cu=INR` +
                  `&tn=${encodeURIComponent(note)}` +
                  `&tr=${encodeURIComponent(intent.tr)}`;
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&qzone=2&data=${encodeURIComponent(upiUri)}`;
                return <img src={qrUrl} alt="UPI QR Code" className="w-[200px] h-[200px]" />;
              })()}
            </div>
            {upiId && <p className="text-sm text-muted-foreground">UPI: {upiId}</p>}
            <div className="space-y-1">
              <p className="text-lg font-bold">₹ {totalAmount.toLocaleString("en-IN")}</p>
              {intent && (
                <p className="text-[11px] text-muted-foreground font-mono">Ref: {intent.tr}</p>
              )}
            </div>
            <div className="text-left max-w-xs mx-auto">
              <Label className="text-sm">UPI Transaction ID *</Label>
              <Input
                placeholder="Enter UPI transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="mt-1"
                disabled={!intent}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMode("select")} className="flex-1">Back</Button>
              <Button
                onClick={async () => {
                  if (!intent) { toast.error("Payment reference not ready yet"); return; }
                  if (!transactionId.trim()) { toast.error("Please enter the transaction ID"); return; }
                  setProcessing(true);
                  const { data, error } = await supabase.functions.invoke("verify-payment", {
                    body: {
                      tr: intent.tr,
                      claimedAmount: totalAmount,
                      transactionId: transactionId.trim(),
                      studentId: student.id,
                    },
                  });
                  setProcessing(false);
                  if (error || !data?.success) {
                    toast.error(data?.error || error?.message || "Payment verification failed");
                    return;
                  }
                  const receipt = {
                    receiptNumber: data.receiptNumber,
                    studentName: student.name,
                    admissionNumber: student.admissionNumber,
                    className: student.className,
                    section: student.section,
                    quarters: selectedQuarters,
                    totalAmount,
                    paymentMode: "online",
                    cashierName,
                    date: new Date().toLocaleDateString("en-IN"),
                    session,
                    transactionId: transactionId.trim(),
                  };
                  setReceiptData(receipt);
                  toast.success("Payment verified and recorded!");
                  setTimeout(() => printReceipt(receipt), 500);
                }}
                disabled={processing || !intent}
                className="flex-1 gap-2"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Verify & Record
              </Button>
            </div>
          </div>
        ) : mode === "cheque" ? (
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground text-center">Enter cheque details for ₹ {totalAmount.toLocaleString("en-IN")}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Bank Name *</Label>
                <Input value={chequeDetails.bankName} onChange={(e) => setChequeDetails({ ...chequeDetails, bankName: e.target.value })} placeholder="e.g. State Bank of India" className="mt-1" />
              </div>
              <div>
                <Label>Cheque Number *</Label>
                <Input value={chequeDetails.chequeNumber} onChange={(e) => setChequeDetails({ ...chequeDetails, chequeNumber: e.target.value })} placeholder="e.g. 123456" className="mt-1" />
              </div>
              <div>
                <Label>Cheque Date *</Label>
                <Input type="date" value={chequeDetails.chequeDate} onChange={(e) => setChequeDetails({ ...chequeDetails, chequeDate: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Account Number</Label>
                <Input value={chequeDetails.accountNumber} onChange={(e) => setChequeDetails({ ...chequeDetails, accountNumber: e.target.value })} placeholder="Account No." className="mt-1" />
              </div>
              <div>
                <Label>Branch Name</Label>
                <Input value={chequeDetails.branchName} onChange={(e) => setChequeDetails({ ...chequeDetails, branchName: e.target.value })} placeholder="Branch" className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label>IFSC Code</Label>
                <Input value={chequeDetails.ifscCode} onChange={(e) => setChequeDetails({ ...chequeDetails, ifscCode: e.target.value })} placeholder="IFSC" className="mt-1" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMode("select")} className="flex-1">Back</Button>
              <Button
                onClick={() => {
                  if (!chequeDetails.bankName || !chequeDetails.chequeNumber || !chequeDetails.chequeDate) {
                    toast.error("Please fill bank name, cheque number & date");
                    return;
                  }
                  recordPayment("cheque", chequeDetails);
                }}
                disabled={processing}
                className="flex-1 gap-2"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Submit Cheque
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Fee Submission Component ───
export default function FeeSubmission() {
  const { user, session } = useAuth();
  const { students } = useSchool();
  const [searchType, setSearchType] = useState<"admission" | "mobile">("admission");
  const [searchValue, setSearchValue] = useState("");
  const [foundStudents, setFoundStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [quarters, setQuarters] = useState<QuarterData[]>([]);
  const [step, setStep] = useState<"search" | "details" | "select_quarters">("search");
  const [loading, setLoading] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [payQuarters, setPayQuarters] = useState<string[]>([]);
  const [payAmount, setPayAmount] = useState(0);

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast.error("Please enter a search value");
      return;
    }
    setLoading(true);
    
    if (searchType === "admission") {
      const found = students.filter((s) => s.admissionNumber.toLowerCase().includes(searchValue.trim().toLowerCase()));
      if (found.length === 0) {
        toast.error("No student found with this admission number");
      } else {
        setFoundStudents(found);
      }
    } else {
      // Search by parent mobile
      const found = students.filter((s) => {
        const mobile = searchValue.trim();
        return (
          s.parentMobile?.includes(mobile) ||
          s.fatherMobile?.includes(mobile) ||
          s.motherMobile?.includes(mobile)
        );
      });
      if (found.length === 0) {
        toast.error("No students found with this mobile number");
      } else {
        setFoundStudents(found);
      }
    }
    setLoading(false);
  };

  const selectStudent = async (student: Student) => {
    setSelectedStudent(student);
    // Fetch payments for this student in current session
    const { data: payments } = await supabase
      .from("fee_payments")
      .select("*")
      .eq("student_id", student.id)
      .eq("session", session);
    
    const qData = getQuarterlyData(student, payments || []);
    setQuarters(qData);
    setStep("details");
  };

  const handleReset = () => {
    setSearchValue("");
    setFoundStudents([]);
    setSelectedStudent(null);
    setQuarters([]);
    setStep("search");
  };

  return (
    <div className="space-y-6">
      {step === "search" && (
        <>
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold font-display flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" /> Search Student
            </h3>
            <div className="flex gap-2">
              <Button
                variant={searchType === "admission" ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchType("admission")}
              >
                By Admission No.
              </Button>
              <Button
                variant={searchType === "mobile" ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchType("mobile")}
              >
                By Parent Mobile
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={searchType === "admission" ? "Enter admission number..." : "Enter parent mobile number..."}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </Button>
            </div>
          </div>

          {foundStudents.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-muted/50 border-b border-border">
                <p className="text-sm font-medium">{foundStudents.length} student(s) found</p>
              </div>
              <div className="divide-y divide-border">
                {foundStudents.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => selectStudent(s)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.admissionNumber} — {s.className} ({s.section})</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">₹ {s.feeAmount.toLocaleString("en-IN")}</p>
                      <p className="text-xs text-muted-foreground">Annual Fee</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {foundStudents.length === 0 && (
            <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <User className="w-6 h-6 text-primary" />
              </div>
              <p className="font-medium text-sm text-foreground">No student selected</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Search by admission number or parent mobile to load fee details. The payment form will appear after you pick a student.
              </p>
            </div>
          )}
        </>
      )}

      {step === "details" && selectedStudent && (
        <div>
          <Button variant="ghost" size="sm" onClick={handleReset} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Search
          </Button>
          <FeeDetailsDashboard
            student={selectedStudent}
            quarters={quarters}
            onSubmitFee={() => setStep("select_quarters")}
          />
        </div>
      )}

      {step === "select_quarters" && selectedStudent && (
        <QuarterSelection
          student={selectedStudent}
          quarters={quarters}
          onBack={() => setStep("details")}
          onProceedToPay={(selected, amount) => {
            setPayQuarters(selected);
            setPayAmount(amount);
            setPaymentDialogOpen(true);
          }}
        />
      )}

      {selectedStudent && (
        <PaymentModeDialog
          open={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          student={selectedStudent}
          selectedQuarters={payQuarters}
          totalAmount={payAmount}
          session={session}
          cashierName={user?.name || "Cashier"}
          onPaymentComplete={() => {
            if (selectedStudent) selectStudent(selectedStudent);
            setStep("details");
          }}
        />
      )}
    </div>
  );
}
