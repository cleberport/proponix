import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.99.1/cors";

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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await anonClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = claims.claims.sub as string;
    const { event_type, metadata = {} } = await req.json();

    if (!event_type || typeof event_type !== "string") {
      return new Response(JSON.stringify({ error: "event_type is required" }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Save event
    const { data: event, error: eventErr } = await supabase.from("events").insert({
      user_id: userId,
      event_type,
      metadata,
    }).select("id").single();

    if (eventErr) {
      return new Response(JSON.stringify({ error: eventErr.message }), { status: 500, headers: corsHeaders });
    }

    // 2. Find active webhooks subscribed to this event
    const { data: webhooks } = await supabase
      .from("webhooks")
      .select("id, url, secret, events")
      .eq("active", true);

    const subscribedWebhooks = (webhooks || []).filter((wh: any) =>
      Array.isArray(wh.events) && wh.events.includes(event_type)
    );

    // 3. Create webhook logs and trigger delivery (async, non-blocking)
    const deliveries: Promise<any>[] = [];

    for (const wh of subscribedWebhooks) {
      const requestPayload = {
        event: event_type,
        user_id: userId,
        timestamp: new Date().toISOString(),
        metadata,
      };

      // Create log entry
      const { data: log } = await supabase.from("webhook_logs").insert({
        webhook_id: wh.id,
        event_id: event.id,
        event_type,
        request_payload: requestPayload,
        status: "pending",
        attempts: 0,
      }).select("id").single();

      if (log) {
        // Fire and forget — deliver webhook async
        const deliverUrl = `${supabaseUrl}/functions/v1/deliver-webhook`;
        deliveries.push(
          fetch(deliverUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({ event_id: event.id, webhook_log_id: log.id }),
          }).catch(() => { /* non-blocking */ })
        );
      }
    }

    // Don't await deliveries — they run in background
    // But we need at least a microtask to fire them
    Promise.allSettled(deliveries);

    return new Response(JSON.stringify({
      event_id: event.id,
      webhooks_triggered: subscribedWebhooks.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
