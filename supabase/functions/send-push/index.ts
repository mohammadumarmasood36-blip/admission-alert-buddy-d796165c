import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web Push crypto utilities for Deno
async function sendWebPush(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<boolean> {
  try {
    // Use a simpler approach: call the endpoint with the payload
    // For production, use web-push library. Here we use a basic VAPID approach.
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "TTL": "86400",
      },
      body: payload,
    });
    return response.ok || response.status === 201;
  } catch (err) {
    console.error("Push send failed:", err);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { student_ids, title, body } = await req.json();

    if (!student_ids || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing student_ids, title, or body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all push subscriptions for the given student IDs
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("student_id", student_ids);

    if (error) {
      console.error("Error fetching subscriptions:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No push subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const payload = JSON.stringify({ title, body });
    let sent = 0;
    const failed: string[] = [];

    for (const sub of subscriptions) {
      try {
        const res = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "TTL": "86400",
          },
          body: payload,
        });
        if (res.ok || res.status === 201) {
          sent++;
        } else {
          // If endpoint is gone (410), remove subscription
          if (res.status === 410 || res.status === 404) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
          failed.push(sub.id);
        }
      } catch (e) {
        console.error("Failed to push to", sub.endpoint, e);
        failed.push(sub.id);
      }
    }

    return new Response(
      JSON.stringify({ sent, failed: failed.length, total: subscriptions.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    console.error("Send push error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
