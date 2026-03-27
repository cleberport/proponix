import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const LIFETIME_PRODUCT_ID = "prod_UDOCDQ5eI7Wlj6";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth validation ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const user = userData.user;
    if (!user.email) {
      return jsonResponse({ error: "User email not available" }, 400);
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return jsonResponse({ error: "Payment service not configured" }, 500);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      return jsonResponse({ subscribed: false, lifetime: false });
    }

    const customerId = customers.data[0].id;

    // Check active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let priceId = null;
    let productId = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      priceId = subscription.items.data[0].price.id;
      productId = subscription.items.data[0].price.product;
    }

    // Check for lifetime one-time payment
    let hasLifetime = false;
    try {
      const sessions = await stripe.checkout.sessions.list({
        customer: customerId,
        status: "complete",
        limit: 20,
      });
      for (const session of sessions.data) {
        if (session.mode === "payment") {
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
          for (const item of lineItems.data) {
            if (item.price?.product === LIFETIME_PRODUCT_ID) {
              hasLifetime = true;
              break;
            }
          }
        }
        if (hasLifetime) break;
      }
    } catch (e) {
      console.error("Error checking lifetime:", e);
    }

    return jsonResponse({
      subscribed: hasActiveSub || hasLifetime,
      lifetime: hasLifetime,
      price_id: priceId,
      product_id: productId,
      subscription_end: subscriptionEnd,
    });
  } catch (error) {
    console.error("check-subscription error:", error);
    return jsonResponse({ error: "Erro interno" }, 500);
  }
});
