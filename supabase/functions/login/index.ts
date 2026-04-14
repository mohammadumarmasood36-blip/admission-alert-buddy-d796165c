import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { role, identifier, password } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (role === "parent") {
      const { data: students, error } = await supabase
        .from("students")
        .select("*")
        .eq("admission_number", identifier)
        .limit(1);

      if (error || !students || students.length === 0) {
        return new Response(JSON.stringify({ error: "Student not found with this admission number" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const student = students[0];
      if (!student.parent_password || student.parent_password !== password) {
        return new Response(JSON.stringify({ error: "Invalid password" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      return new Response(JSON.stringify({
        user: {
          id: student.id,
          name: student.parent_name || student.father_name || "Parent",
          role: "parent",
        },
        token: crypto.randomUUID(),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      const { data: staffList, error } = await supabase
        .from("staff")
        .select("*")
        .eq("Mobile number", identifier)
        .limit(1);

      if (error || !staffList || staffList.length === 0) {
        return new Response(JSON.stringify({ error: "Staff not found with this mobile number" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const staff = staffList[0];
      if (!staff["Login Password"] || staff["Login Password"] !== password) {
        return new Response(JSON.stringify({ error: "Invalid password" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const roleMap: Record<string, string> = {
        "Manager": "manager",
        "Principal": "principal",
        "Teacher": "teacher",
        "Cashier": "cashier",
        "Exam Incharge": "exam_incharge",
      };

      const mappedRole = roleMap[staff.Role] || role;

      return new Response(JSON.stringify({
        user: {
          id: staff.id,
          name: staff["Full Name"],
          role: mappedRole,
        },
        token: crypto.randomUUID(),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
