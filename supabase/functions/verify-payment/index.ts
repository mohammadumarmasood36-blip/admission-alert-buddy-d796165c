// Validates the UPI transaction reference (`tr`) against the locked
// payment_intents.expected_amount before recording fee_payments.
// Any mismatch (amount, status, ownership) is rejected.

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

  const tr = String(body?.tr ?? "").trim();
  const claimedAmount = Number(body?.claimedAmount);
  const transactionId = String(body?.transactionId ?? "").trim();
  const studentId = String(body?.studentId ?? "").trim();

  if (!tr) return json({ error: "tr required" }, 400);
  if (!transactionId) return json({ error: "transactionId required" }, 400);
  if (!Number.isFinite(claimedAmount) || claimedAmount <= 0) {
    return json({ error: "claimedAmount invalid" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Auth: caller must be signed in as cashier/manager/principal
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const { data: claims } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
  const uid = (claims as any)?.claims?.sub;
  if (!uid) return json({ error: "Unauthorized" }, 401);
  const { data: rolesRows } = await supabase.from("user_roles").select("role").eq("user_id", uid);
  const allowed = (rolesRows ?? []).some((r: any) => ["cashier","manager","principal"].includes(r.role));
  if (!allowed) return json({ error: "Forbidden" }, 403);

  const { data: intent, error: iErr } = await supabase
    .from("payment_intents")
    .select("*")
    .eq("tr", tr)
    .maybeSingle();
  if (iErr || !intent) return json({ error: "Unknown payment reference" }, 404);

  if (intent.status !== "pending") {
    return json({ error: `Payment reference already ${intent.status}` }, 409);
  }
  if (studentId && intent.student_id !== studentId) {
    return json({ error: "Reference does not belong to this student" }, 403);
  }

  // Strict amount match (tolerate 0.01 rounding)
  const expected = Number(intent.expected_amount);
  if (Math.abs(expected - claimedAmount) > 0.01) {
    return json({
      error: "Amount mismatch — payment rejected",
      expected,
      received: claimedAmount,
    }, 422);
  }

  const receiptNum = `RCP-${Date.now().toString(36).toUpperCase()}`;
  const quarters: string[] = Array.isArray(intent.quarters) ? intent.quarters : [];
  const perQuarter = Math.round((expected / Math.max(1, quarters.length)) * 100) / 100;

  // Insert fee_payments rows for each quarter
  for (const q of quarters) {
    const { error: pErr } = await supabase.from("fee_payments").insert({
      student_id: intent.student_id,
      student_name: intent.student_name,
      class_name: intent.class_name,
      section: intent.section,
      amount: perQuarter,
      payment_date: new Date().toISOString().split("T")[0],
      payment_mode: "online",
      cashier_name: intent.cashier_name,
      quarter: q,
      session: intent.session,
      receipt_number: receiptNum,
      transaction_id: transactionId,
    });
    if (pErr) {
      return json({ error: "Failed to record payment", detail: pErr.message }, 500);
    }
  }

  await supabase
    .from("payment_intents")
    .update({
      status: "used",
      transaction_id: transactionId,
      receipt_number: receiptNum,
      used_at: new Date().toISOString(),
    })
    .eq("tr", tr);

  return json({
    success: true,
    receiptNumber: receiptNum,
    amount: expected,
    quarters,
  });
});
