// Provisions a Supabase Auth account for a newly added parent or staff member.
// Replaces the old plaintext password columns. Caller must be signed in as
// a manager/principal (for staff) or any non-parent role (for parents).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const PWD_SUFFIX = "!Lov1";

function syntheticStaffEmail(mobile: string) {
  return `staff-${mobile.replace(/\D/g, "")}@school.local`;
}
function syntheticParentEmail(admission: string) {
  return `parent-${admission.toLowerCase().replace(/[^a-z0-9]/g, "")}@school.local`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: u, error: uErr } = await admin.auth.getUser(auth.slice(7));
  const callerId = u?.user?.id;
  if (uErr || !callerId) return json({ error: "Unauthorized" }, 401);

  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", callerId);
  const callerRoles = (roles ?? []).map((r: any) => r.role);
  const isStaff = callerRoles.some((r: string) => r !== "parent");
  const isAdmin = callerRoles.includes("manager") || callerRoles.includes("principal");
  if (!isStaff) return json({ error: "Forbidden" }, 403);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const kind = String(body?.kind || "");      // 'parent' | 'staff'
  const password = String(body?.password || "");
  if (!password || password.length < 4) return json({ error: "password required" }, 400);
  const finalPwd = `${password}${PWD_SUFFIX}`;

  if (kind === "parent") {
    const studentId = String(body?.studentId || "");
    const admissionNumber = String(body?.admissionNumber || "");
    const fullName = String(body?.fullName || "");
    const mobile = body?.mobile ? String(body.mobile) : null;
    if (!studentId || !admissionNumber) return json({ error: "studentId + admissionNumber required" }, 400);
    const email = syntheticParentEmail(admissionNumber);

    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email,
      password: finalPwd,
      email_confirm: true,
      user_metadata: { full_name: fullName, admission_number: admissionNumber, student_id: studentId, mobile },
    });
    if (cErr || !created.user) return json({ error: cErr?.message || "createUser failed" }, 400);

    await admin.from("user_roles").upsert({ user_id: created.user.id, role: "parent" }, { onConflict: "user_id,role" });
    return json({ ok: true, userId: created.user.id, email });
  }

  if (kind === "staff") {
    if (!isAdmin) return json({ error: "Only manager/principal can provision staff" }, 403);
    const staffId = String(body?.staffId || "");
    const mobile = String(body?.mobile || "");
    const fullName = String(body?.fullName || "");
    const role = String(body?.role || "");
    const allowedRoles = ["manager", "principal", "teacher", "cashier", "exam_incharge"];
    if (!staffId || !mobile || !allowedRoles.includes(role)) return json({ error: "staffId, mobile, valid role required" }, 400);
    const email = syntheticStaffEmail(mobile);

    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email,
      password: finalPwd,
      email_confirm: true,
      user_metadata: { full_name: fullName, mobile, staff_id: staffId },
    });
    if (cErr || !created.user) return json({ error: cErr?.message || "createUser failed" }, 400);

    await admin.from("user_roles").upsert({ user_id: created.user.id, role: role as any }, { onConflict: "user_id,role" });
    return json({ ok: true, userId: created.user.id, email });
  }

  return json({ error: "Unknown kind" }, 400);
});
