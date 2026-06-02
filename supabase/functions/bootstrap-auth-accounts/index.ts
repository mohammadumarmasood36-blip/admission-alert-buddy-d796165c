// One-time migration: creates Supabase Auth accounts for every existing
// staff row and every student's parent. Uses each user's existing plaintext
// password as the initial password (Supabase hashes it on insert). Safe to
// run multiple times — skips rows that already have user_id / parent_user_id.
//
// Auth: requires header `x-bootstrap-secret: <BOOTSTRAP_SECRET>` to prevent
// arbitrary callers from triggering it.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-bootstrap-secret",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const STAFF_ROLE_MAP: Record<string, string> = {
  Manager: "manager",
  Principal: "principal",
  Teacher: "teacher",
  Cashier: "cashier",
  "Exam Incharge": "exam_incharge",
};

function syntheticStaffEmail(mobile: string) {
  return `staff-${mobile.replace(/\D/g, "")}@school.local`;
}
function syntheticParentEmail(admission: string) {
  return `parent-${admission.toLowerCase().replace(/[^a-z0-9]/g, "")}@school.local`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const secret = req.headers.get("x-bootstrap-secret") ?? "";
  const expected = Deno.env.get("BOOTSTRAP_SECRET") ?? "";
  if (!expected || secret !== expected) {
    return json({ error: "Forbidden" }, 403);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const report = {
    staff: { processed: 0, created: 0, skipped: 0, failed: [] as any[] },
    students: { processed: 0, created: 0, skipped: 0, failed: [] as any[] },
  };

  // --- STAFF ---
  const { data: staffRows, error: staffErr } = await supabase
    .from("staff")
    .select("*")
    .is("user_id", null);
  if (staffErr) return json({ error: "Failed loading staff", detail: staffErr.message }, 500);

  for (const row of staffRows ?? []) {
    report.staff.processed++;
    const mobile = String(row["Mobile number"] ?? "").trim();
    const password = String(row["Login Password"] ?? "").trim();
    const fullName = String(row["Full Name"] ?? "").trim();
    const roleRaw = String(row.Role ?? "").trim();
    const mappedRole = STAFF_ROLE_MAP[roleRaw] ?? roleRaw.toLowerCase();
    if (!mobile || !password || password.length < 6 || !mappedRole) {
      report.staff.skipped++;
      report.staff.failed.push({ id: row.id, reason: "missing mobile/password/role" });
      continue;
    }
    const email = syntheticStaffEmail(mobile);
    const { data: created, error: cErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        mobile,
        staff_id: row.id,
      },
    });
    if (cErr || !created?.user) {
      report.staff.failed.push({ id: row.id, mobile, error: cErr?.message });
      continue;
    }
    const uid = created.user.id;
    await supabase.from("user_roles").insert({ user_id: uid, role: mappedRole as any });
    await supabase.from("staff").update({ user_id: uid }).eq("id", row.id);
    report.staff.created++;
  }

  // --- STUDENTS (parents) ---
  const { data: studentRows, error: stuErr } = await supabase
    .from("students")
    .select("*")
    .is("parent_user_id", null);
  if (stuErr) return json({ error: "Failed loading students", detail: stuErr.message }, 500);

  for (const row of studentRows ?? []) {
    report.students.processed++;
    const admission = String(row.admission_number ?? "").trim();
    const password = String(row.parent_password ?? "").trim();
    const parentName = String(row.parent_name ?? row.father_name ?? "Parent").trim();
    const mobile = String(row.parent_mobile ?? row.father_mobile ?? "").trim();
    if (!admission || !password || password.length < 6) {
      report.students.skipped++;
      report.students.failed.push({ id: row.id, reason: "missing admission/password" });
      continue;
    }
    const email = syntheticParentEmail(admission);
    const { data: created, error: cErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: parentName,
        mobile,
        admission_number: admission,
        student_id: row.id,
      },
    });
    if (cErr || !created?.user) {
      report.students.failed.push({ id: row.id, admission, error: cErr?.message });
      continue;
    }
    const uid = created.user.id;
    await supabase.from("user_roles").insert({ user_id: uid, role: "parent" as any });
    await supabase.from("students").update({ parent_user_id: uid }).eq("id", row.id);
    report.students.created++;
  }

  return json({ success: true, report });
});
