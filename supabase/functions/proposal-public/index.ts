import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Sanitize string input: trim, limit length, strip control characters
function sanitizeString(value: unknown, maxLength = 500): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/[\x00-\x1F\x7F]/g, "").slice(0, maxLength);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    // ── Token validation ──
    if (!token || typeof token !== "string" || token.length < 8 || token.length > 100 || !/^[a-f0-9]+$/i.test(token)) {
      return jsonResponse({ error: "Token inválido" }, 400);
    }

    const viewerIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") || "unknown";
    const viewerDevice = (req.headers.get("user-agent") || "unknown").slice(0, 500);

    // ──── GET: fetch proposal ────
    if (req.method === "GET") {
      const isPeek = url.searchParams.get("peek") === "1";

      const { data: link, error: linkErr } = await supabase
        .from("proposal_links")
        .select("*")
        .eq("token", token)
        .maybeSingle();

      if (linkErr || !link) {
        return jsonResponse({ error: "Proposta não encontrada" }, 404);
      }

      // Check expiration
      if (link.expires_at && new Date(link.expires_at) < new Date() && link.status !== "aprovado") {
        if (link.status !== "expirado") {
          await supabase.from("proposal_links").update({ status: "expirado" }).eq("id", link.id);
          await supabase.from("generated_documents").update({ status: "expirado" }).eq("id", link.document_id);
        }
        return jsonResponse({ error: "expired", message: "Esta proposta expirou e não está mais disponível." }, 410);
      }

      // Check view limit
      const maxViews = link.max_views ?? 50;
      if (link.view_count >= maxViews && !["aprovado"].includes(link.status)) {
        return jsonResponse({
          error: "blocked",
          message: "Este orçamento atingiu o limite de visualizações e não está mais disponível.",
        }, 403);
      }

      const { data: doc, error: docErr } = await supabase
        .from("generated_documents")
        .select("*")
        .eq("id", link.document_id)
        .maybeSingle();

      if (docErr || !doc) {
        return jsonResponse({ error: "Documento não encontrado" }, 404);
      }

      // ── Ownership validation: document must belong to the link owner ──
      if (doc.user_id !== link.user_id) {
        console.error("Ownership mismatch: doc.user_id !== link.user_id");
        return jsonResponse({ error: "Acesso negado" }, 403);
      }

      // Fetch template elements
      let templateData: { elements: unknown; settings: unknown; canvas_width: number; canvas_height: number; calculated_fields: unknown; default_values: unknown; input_fields: unknown; variables: unknown } | null = null;
      if (doc.template_id) {
        const { data: tmpl } = await supabase
          .from("custom_templates")
          .select("elements, settings, canvas_width, canvas_height, calculated_fields, default_values, input_fields, variables")
          .eq("id", doc.template_id)
          .eq("user_id", link.user_id) // ── Enforce ownership ──
          .maybeSingle();
        if (tmpl) templateData = tmpl;
      }

      // If NOT a peek, increment counter and track views
      if (!isPeek) {
        const newViewCount = (link.view_count ?? 0) + 1;
        const now = new Date().toISOString();
        const updateData: Record<string, unknown> = {
          view_count: newViewCount,
          viewer_ip: viewerIp,
          viewer_device: viewerDevice,
          last_viewed_at: now,
        };

        if (link.status === "enviado") {
          updateData.status = "visualizado";
          updateData.viewed_at = now;
          await supabase.from("generated_documents").update({ status: "visualizado" }).eq("id", link.document_id).eq("user_id", link.user_id);
          link.status = "visualizado";
          link.viewed_at = now;
        }

        link.view_count = newViewCount;
        await supabase.from("proposal_links").update(updateData).eq("id", link.id);
      }

      const { data: settings } = await supabase
        .from("user_settings")
        .select("company_name, company_email, company_phone, company_website, company_address, logo_url")
        .eq("user_id", link.user_id)
        .maybeSingle();

      return jsonResponse({
        proposal: {
          id: link.id,
          token: link.token,
          status: link.status,
          viewedAt: link.viewed_at,
          approvedAt: link.approved_at,
          approverName: link.approver_name,
          viewCount: link.view_count,
          lastViewedAt: link.last_viewed_at,
          maxViews: maxViews,
          expiresAt: link.expires_at,
          negotiationMessage: link.negotiation_message,
          senderUserId: link.user_id,
          documentId: doc.id,
          document: {
            clientName: doc.client_name,
            templateName: doc.template_name,
            templateId: doc.template_id,
            fileName: doc.file_name,
            values: doc.values,
            generatedAt: doc.generated_at,
          },
          template: templateData
            ? {
                elements: templateData.elements,
                settings: templateData.settings,
                canvasWidth: templateData.canvas_width,
                canvasHeight: templateData.canvas_height,
                calculatedFields: templateData.calculated_fields,
                defaultValues: templateData.default_values,
              }
            : null,
          company: settings
            ? {
                name: settings.company_name,
                email: settings.company_email,
                phone: settings.company_phone,
                website: settings.company_website,
                address: settings.company_address,
                logoUrl: settings.logo_url,
              }
            : null,
        },
      });
    }

    // ──── POST: approve or negotiate ────
    if (req.method === "POST") {
      const body = await req.json();
      const action = sanitizeString(body.action, 20) || "approve";

      if (!["approve", "negotiate"].includes(action)) {
        return jsonResponse({ error: "Ação inválida" }, 400);
      }

      const { data: link, error: linkErr } = await supabase
        .from("proposal_links")
        .select("id, document_id, user_id, status, view_count, max_views, expires_at")
        .eq("token", token)
        .maybeSingle();

      if (linkErr || !link) {
        return jsonResponse({ error: "Proposta não encontrada" }, 404);
      }

      // Check expiration
      if (link.expires_at && new Date(link.expires_at) < new Date() && link.status !== "aprovado") {
        return jsonResponse({ error: "Esta proposta expirou" }, 410);
      }

      if (link.status === "aprovado") {
        return jsonResponse({ error: "Proposta já aprovada" }, 400);
      }

      // ── NEGOTIATE ──
      if (action === "negotiate") {
        const message = sanitizeString(body.message, 1000);
        if (!message) return jsonResponse({ error: "Mensagem é obrigatória" }, 400);

        await supabase.from("proposal_links").update({
          status: "negociacao",
          negotiation_message: message,
        }).eq("id", link.id);

        await supabase.from("generated_documents").update({ status: "negociacao" }).eq("id", link.document_id).eq("user_id", link.user_id);

        return jsonResponse({ success: true, status: "negociacao" });
      }

      // ── APPROVE ──
      const approverName = sanitizeString(body.approverName, 200);
      if (!approverName) return jsonResponse({ error: "Nome é obrigatório" }, 400);

      const now = new Date().toISOString();
      await supabase.from("proposal_links").update({
        status: "aprovado",
        approved_at: now,
        approver_name: approverName,
        viewed_at: link.status === "enviado" ? now : undefined,
      }).eq("id", link.id);

      await supabase.from("generated_documents").update({ status: "aprovado" }).eq("id", link.document_id).eq("user_id", link.user_id);

      return jsonResponse({ success: true, approvedAt: now });
    }

    return jsonResponse({ error: "Método não suportado" }, 405);
  } catch (err) {
    console.error("proposal-public error:", err);
    return jsonResponse({ error: "Erro interno" }, 500);
  }
});
