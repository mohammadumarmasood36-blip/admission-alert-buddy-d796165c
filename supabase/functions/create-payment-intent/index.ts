// Server issues the UPI `tr` reference and locks the expected amount.
// Client never gets to set the amount — it is computed here from the
// student's annual fee and the requested quarters.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const studentId = String(body?.studentId ?? "").trim();
  const session = String(body?.session ?? "").trim();
  const quarters: string[] = Array.isArray(body?.quarters) ? body.quarters : [];
  const cashierName = String(body?.cashierName ?? "Cashier").slice(0, 120);
  const cashierId = body?.cashierId ? String(body.cashierId) : null;

  if (!studentId) return json({ error: "studentId required" }, 400);
  if (quarters.length === 0) return json({ error: "At least one quarter required" }, 400);
  const validQuarters = ["Q1", "Q2", "Q3", "Q4"];
  if (!quarters.every((q) => validQuarters.includes(q))) {
    return json({ error: "Invalid quarters" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Auth: caller must be signed in as cashier/manager/principal
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const { data: userData, error: uErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  const uid = userData?.user?.id;
  if (uErr || !uid) return json({ error: "Unauthorized" }, 401);
  const { data: rolesRows } = await supabase.from("user_roles").select("role").eq("user_id", uid);
  const allowed = (rolesRows ?? []).some((r: any) => ["cashier","manager","principal"].includes(r.role));
  if (!allowed) return json({ error: "Forbidden" }, 403);

  // Fetch the student authoritative fee
  const { data: student, error: sErr } = await supabase
    .from("students")
    .select("id, name, class_name, section, fee_amount, admission_number")
    .eq("id", studentId)
    .maybeSingle();
  if (sErr || !student) return json({ error: "Student not found" }, 404);

  // Fetch already-paid amounts per quarter for this session to prevent double-billing
  const { data: priorPayments } = await supabase
    .from("fee_payments")
    .select("quarter, amount")
    .eq("student_id", studentId)
    .eq("session", session);

  const quarterlyFee = Math.round(Number(student.fee_amount) / 4);
  let expectedAmount = 0;
  const uniqQuarters = Array.from(new Set(quarters));
  for (const q of uniqQuarters) {
    const paid = (priorPayments || [])
      .filter((p: any) => p.quarter === q)
      .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
    const balance = Math.max(0, quarterlyFee - paid);
    if (balance <= 0) {
      return json({ error: `Quarter ${q} already paid in full` }, 409);
    }
    expectedAmount += balance;
  }
  if (expectedAmount <= 0) return json({ error: "Nothing payable" }, 400);

  // Build a hard-to-guess `tr` (UPI allows up to 35 alphanumeric chars)
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
  const tr = `FEE${String(student.admission_number || "").slice(0, 8)}${Date.now().toString(36).toUpperCase()}${rand}`.slice(0, 35);

  const { data: intent, error: iErr } = await supabase
    .from("payment_intents")
    .insert({
      tr,
      student_id: student.id,
      student_name: student.name,
      class_name: student.class_name,
      section: student.section,
      quarters: uniqQuarters,
      session: session || null,
      expected_amount: expectedAmount,
      status: "pending",
      cashier_id: cashierId,
      cashier_name: cashierName,
    })
    .select()
    .single();
  if (iErr || !intent) return json({ error: "Failed to create intent" }, 500);

  return json({
    tr,
    expectedAmount,
    quarters: uniqQuarters,
    studentName: student.name,
    admissionNumber: student.admission_number,
  });
});
