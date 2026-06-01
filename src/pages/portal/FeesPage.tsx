import React, { useState, useMemo, useRef, useEffect } from "react";
import { format } from "date-fns";
import DashboardLayout from "@/components/portal/DashboardLayout";
import { useSchool, ALL_CLASSES, ClassName } from "@/context/SchoolContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Wallet, Printer, History, CheckCircle, CalendarIcon, X, IndianRupee } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import FeeSubmission from "@/components/portal/FeeSubmission";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function FeesPage() {
  const { students, classes } = useSchool();
  const { session, user } = useAuth();
  const [classFilter, setClassFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [quarterFilter, setQuarterFilter] = useState<string>("all");
  const [historyModeFilter, setHistoryModeFilter] = useState<string>("all");
  const [historyCashierFilter, setHistoryCashierFilter] = useState<string>("all");
  const tableRef = useRef<HTMLDivElement>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  // Load all payments for current session
  useEffect(() => {
    const fetchPayments = async () => {
      setLoadingPayments(true);
      const { data } = await supabase
        .from("fee_payments")
        .select("*")
        .eq("session", session)
        .order("payment_date", { ascending: false });
      setPayments(data || []);
      setLoadingPayments(false);
    };
    fetchPayments();
  }, [session]);

  const cashierNames = useMemo(() => {
    const names = new Set(payments.map((p) => p.cashier_name).filter(Boolean));
    return Array.from(names);
  }, [payments]);

  const filteredHistory = useMemo(() => {
    return payments.filter((p) => {
      const d = new Date(p.payment_date);
      if (dateFrom && d < dateFrom) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
      if (historyModeFilter !== "all" && p.payment_mode !== historyModeFilter) return false;
      if (historyCashierFilter !== "all" && p.cashier_name !== historyCashierFilter) return false;
      return true;
    });
  }, [payments, dateFrom, dateTo, historyModeFilter, historyCashierFilter]);

  const availableSections = useMemo(() => {
    if (classFilter === "all") return [];
    const cls = classes.find((c) => c.name === classFilter);
    return cls ? cls.sections : [];
  }, [classFilter, classes]);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (classFilter !== "all" && s.className !== classFilter) return false;
      if (sectionFilter !== "all" && s.section !== sectionFilter) return false;
      return true;
    });
  }, [students, classFilter, sectionFilter]);

  // Calculate quarter-wise paid status per student
  const getStudentQuarterStatus = (studentId: string) => {
    const quarters = ["Q1", "Q2", "Q3", "Q4"];
    return quarters.map((q) => {
      const qPayments = payments.filter((p) => p.student_id === studentId && p.quarter === q);
      const totalPaid = qPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      return { quarter: q, paid: totalPaid > 0, amount: totalPaid };
    });
  };

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalExpected = filtered.reduce((sum, s) => sum + s.feeAmount, 0);
  const totalPending = totalExpected - filtered.reduce((sum, s) => {
    const studentPayments = payments.filter((p) => p.student_id === s.id);
    return sum + studentPayments.reduce((ps: number, p: any) => ps + Number(p.amount), 0);
  }, 0);

  const handlePrint = () => {
    const printContent = tableRef.current;
    if (!printContent) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Fee Report</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 24px; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        p { color: #666; font-size: 13px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #ddd; font-size: 13px; }
        th { background: #f5f5f5; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
        .paid { color: #16a34a; } .unpaid { color: #dc2626; }
      </style></head><body>
      <h1>Fee Report — Session ${session}${classFilter !== "all" ? ` — ${classFilter}` : ""}${sectionFilter !== "all" ? ` (Section ${sectionFilter})` : ""}</h1>
      <p>Generated on ${new Date().toLocaleDateString()}</p>
      ${printContent.innerHTML}
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Fee Management</h1>
          <p className="text-muted-foreground mt-1">Session: {session} — Collect and track student fees</p>
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={handlePrint}>
          <Printer className="w-4 h-4" /> Print Report
        </Button>
      </div>

      {(() => {
        const canSubmit = user?.role !== "manager" && user?.role !== "principal";
        return (
      <Tabs defaultValue={canSubmit ? "submit" : "overview"} className="space-y-6">
        <TabsList>
          {canSubmit && (
            <TabsTrigger value="submit" className="gap-1.5">
              <IndianRupee className="w-3.5 h-3.5" /> Submit Fees
            </TabsTrigger>
          )}
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="w-3.5 h-3.5" /> Payment History
          </TabsTrigger>
        </TabsList>

        {canSubmit && (
        <TabsContent value="submit" className="mt-0">
          <ErrorBoundary fallbackTitle="Fee submission unavailable">
            <FeeSubmission />
          </ErrorBoundary>
        </TabsContent>
        )}

        <TabsContent value="overview" className="space-y-6 mt-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={classFilter} onValueChange={(v) => { setClassFilter(v); setSectionFilter("all"); }}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {ALL_CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={sectionFilter} onValueChange={setSectionFilter} disabled={classFilter === "all"}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="All Sections" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {availableSections.map((s) => <SelectItem key={s.id} value={s.name}>Section {s.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={quarterFilter} onValueChange={setQuarterFilter}>
              <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="All Quarters" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quarters</SelectItem>
                {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                  <React.Fragment key={q}>
                    <SelectItem value={`${q}-paid`}>{q} — Paid</SelectItem>
                    <SelectItem value={`${q}-unpaid`}>{q} — Unpaid</SelectItem>
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-success text-success-foreground rounded-xl p-5">
              <p className="text-sm opacity-80 mb-1">Total Collected</p>
              <p className="text-2xl font-bold font-display">₹ {totalCollected.toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-sm text-muted-foreground mb-1">Total Pending</p>
              <p className="text-2xl font-bold font-display text-destructive">₹ {Math.max(0, totalPending).toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto" ref={tableRef}>
              <table className="w-full min-w-[750px]">
                <thead>
                  <tr className="bg-muted text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="text-left px-6 py-3">Student</th>
                    <th className="text-left px-4 py-3">Adm. No.</th>
                    <th className="text-left px-4 py-3">Class</th>
                    <th className="text-left px-4 py-3">Amount</th>
                    {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                      <th key={q} className="text-center px-2 py-3">{q}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-muted-foreground">
                        <Wallet className="w-10 h-10 mb-3 opacity-40 mx-auto" />
                        <p>No students found</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.filter((student) => {
                      if (quarterFilter === "all") return true;
                      const [q, status] = quarterFilter.split("-");
                      const qStatus = getStudentQuarterStatus(student.id);
                      const quarter = qStatus.find((qs) => qs.quarter === q);
                      if (status === "paid") return quarter?.paid;
                      return !quarter?.paid;
                    }).map((student) => {
                      const qStatus = getStudentQuarterStatus(student.id);
                      return (
                        <tr key={student.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-sm">{student.name}</td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">{student.admissionNumber}</td>
                          <td className="px-4 py-4 text-sm">{student.className} ({student.section})</td>
                          <td className="px-4 py-4 text-sm">₹ {student.feeAmount.toLocaleString("en-IN")}</td>
                          {qStatus.map((qs) => (
                            <td key={qs.quarter} className="px-2 py-4 text-center">
                              {qs.paid ? (
                                <div>
                                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-success/20 text-success">Paid</span>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">₹{qs.amount.toLocaleString("en-IN")}</p>
                                </div>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-destructive/20 text-destructive">Unpaid</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-[180px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : "From date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-[180px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : "To date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>

            <Select value={historyModeFilter} onValueChange={setHistoryModeFilter}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="All Modes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>

            <Select value={historyCashierFilter} onValueChange={setHistoryCashierFilter}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="All Cashiers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cashiers</SelectItem>
                {cashierNames.map((name) => <SelectItem key={name} value={name!}>{name}</SelectItem>)}
              </SelectContent>
            </Select>

            {(dateFrom || dateTo || historyModeFilter !== "all" || historyCashierFilter !== "all") && (
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => { setDateFrom(undefined); setDateTo(undefined); setHistoryModeFilter("all"); setHistoryCashierFilter("all"); }}>
                <X className="w-3.5 h-3.5" /> Clear
              </Button>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px]">
                <thead>
                  <tr className="bg-muted text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="text-left px-6 py-3">Date</th>
                    <th className="text-left px-4 py-3">Receipt</th>
                    <th className="text-left px-4 py-3">Student</th>
                    <th className="text-left px-4 py-3">Class</th>
                    <th className="text-left px-4 py-3">Quarter</th>
                    <th className="text-left px-4 py-3">Mode</th>
                    <th className="text-left px-4 py-3">Details</th>
                    <th className="text-left px-4 py-3">Cashier</th>
                    <th className="text-right px-6 py-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-16 text-muted-foreground">
                        <History className="w-10 h-10 mb-3 opacity-40 mx-auto" />
                        <p>No payments found for this range</p>
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((payment) => (
                      <tr key={payment.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm">{payment.payment_date}</td>
                        <td className="px-4 py-4 text-xs font-mono">{payment.receipt_number || "—"}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-success" />
                            <span className="font-medium text-sm">{payment.student_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">{payment.class_name} ({payment.section})</td>
                        <td className="px-4 py-4 text-sm font-medium">{payment.quarter || "—"}</td>
                        <td className="px-4 py-4 text-sm capitalize">{payment.payment_mode || "—"}</td>
                        <td className="px-4 py-4 text-xs text-muted-foreground">
                          {payment.payment_mode === "online" && payment.transaction_id && (
                            <span>Txn: {payment.transaction_id}</span>
                          )}
                          {payment.payment_mode === "cheque" && (
                            <div>
                              {payment.cheque_bank && <span>{payment.cheque_bank}</span>}
                              {payment.cheque_number && <span> #{payment.cheque_number}</span>}
                              {payment.cheque_date && <span> ({payment.cheque_date})</span>}
                            </div>
                          )}
                          {payment.payment_mode === "cash" && "—"}
                        </td>
                        <td className="px-4 py-4 text-sm">{payment.cashier_name}</td>
                        <td className="px-6 py-4 text-sm text-right font-medium">₹ {Number(payment.amount).toLocaleString("en-IN")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredHistory.length > 0 && (
              <div className="border-t border-border px-6 py-4 flex justify-between items-center bg-muted/30">
                <span className="text-sm text-muted-foreground">{filteredHistory.length} payment(s)</span>
                <span className="text-sm font-bold font-display">Total: ₹ {filteredHistory.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString("en-IN")}</span>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      );
      })()}
    </DashboardLayout>
  );
}
