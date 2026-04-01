import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.99.1/cors";

const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1000;

async function computeHmac(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify caller is service_role or admin
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await anonClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { event_id, webhook_log_id } = await req.json();

    if (!event_id || !webhook_log_id) {
      return new Response(JSON.stringify({ error: "Missing event_id or webhook_log_id" }), { status: 400, headers: corsHeaders });
    }

    // Get webhook log
    const { data: log } = await supabase.from("webhook_logs").select("*").eq("id", webhook_log_id).single();
    if (!log) {
      return new Response(JSON.stringify({ error: "Log not found" }), { status: 404, headers: corsHeaders });
    }

    // Get webhook config
    const { data: webhook } = await supabase.from("webhooks").select("*").eq("id", log.webhook_id).single();
    if (!webhook || !webhook.active) {
      return new Response(JSON.stringify({ error: "Webhook inactive" }), { status: 200, headers: corsHeaders });
    }

    const payload = JSON.stringify(log.request_payload);
    const signature = await computeHmac(webhook.secret, payload);

    let lastError = "";
    let statusCode = 0;
    let responseBody = "";

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-freelox-signature": signature,
            "x-freelox-event": log.event_type,
          },
          body: payload,
        });

        statusCode = res.status;
        responseBody = await res.text();

        if (res.ok) {
          await supabase.from("webhook_logs").update({
            status: "success",
            status_code: statusCode,
            response_body: responseBody.slice(0, 1000),
            attempts: attempt,
          }).eq("id", webhook_log_id);

          return new Response(JSON.stringify({ status: "success", attempts: attempt }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        lastError = `HTTP ${statusCode}: ${responseBody.slice(0, 200)}`;
      } catch (err: any) {
        lastError = err.message || String(err);
      }

      // Exponential backoff
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, BACKOFF_BASE_MS * Math.pow(2, attempt - 1)));
      }
    }

    // All retries failed
    await supabase.from("webhook_logs").update({
      status: "failed",
      status_code: statusCode || null,
      response_body: (lastError || responseBody).slice(0, 1000),
      attempts: MAX_RETRIES,
    }).eq("id", webhook_log_id);

    return new Response(JSON.stringify({ status: "failed", error: lastError }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
