import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: userData } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    const uid = userData?.user?.id;
    if (!uid) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: staffCheck } = await admin.rpc("is_staff", { _user_id: uid });
    if (!staffCheck) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { student_ids, title, subject, due_date, description, school_name } = await req.json();
    if (!Array.isArray(student_ids) || student_ids.length === 0 || !title) {
      return new Response(JSON.stringify({ error: "Missing student_ids or title" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: students } = await admin
      .from("students")
      .select("id, name, parent_mobile, father_mobile, mother_mobile")
      .in("id", student_ids);

    const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    if (!token || !phoneId) {
      return new Response(JSON.stringify({ error: "WhatsApp not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;
    let sent = 0, failed = 0;
    const seen = new Set<string>();

    for (const s of students || []) {
      const raw = s.parent_mobile || s.father_mobile || s.mother_mobile;
      if (!raw) { failed++; continue; }
      let phone = String(raw).replace(/[\s\-\(\)]/g, "");
      if (phone.startsWith("+")) phone = phone.substring(1);
      if (!phone.startsWith("91")) phone = "91" + phone;
      if (seen.has(phone)) continue;
      seen.add(phone);

      const body = `📚 New Homework — ${school_name || "School"}\n\nFor: ${s.name}\nSubject: ${subject || "-"}\nTitle: ${title}${due_date ? `\nDue: ${new Date(due_date).toLocaleDateString("en-IN")}` : ""}${description ? `\n\n${String(description).substring(0, 300)}` : ""}\n\nPlease ensure your child completes it on time.`;

      try {
        const r = await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ messaging_product: "whatsapp", to: phone, type: "text", text: { body } }),
        });
        if (r.ok) sent++; else { failed++; console.error("WA send error", await r.text()); }
      } catch (e) { failed++; console.error(e); }
    }

    return new Response(JSON.stringify({ success: true, sent, failed }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("send-homework-sms error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
