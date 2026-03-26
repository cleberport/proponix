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

    if (!token || token.length < 10) {
      return jsonResponse({ error: "Token inválido" }, 400);
    }

    const viewerIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") || "unknown";
    const viewerDevice = req.headers.get("user-agent") || "unknown";

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
        // Auto-expire
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

      // Fetch template elements
      let templateData: { elements: unknown; settings: unknown; canvas_width: number; canvas_height: number } | null = null;
      if (doc.template_id) {
        const { data: tmpl } = await supabase
          .from("custom_templates")
          .select("elements, settings, canvas_width, canvas_height")
          .eq("id", doc.template_id)
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
          await supabase.from("generated_documents").update({ status: "visualizado" }).eq("id", link.document_id);
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
      const action = body.action || "approve";

      const { data: link, error: linkErr } = await supabase
        .from("proposal_links")
        .select("id, document_id, status, view_count, max_views, expires_at")
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
        const message = (body.message || "").trim();
        if (!message) return jsonResponse({ error: "Mensagem é obrigatória" }, 400);
        if (message.length > 1000) return jsonResponse({ error: "Mensagem muito longa" }, 400);

        await supabase.from("proposal_links").update({
          status: "negociacao",
          negotiation_message: message,
        }).eq("id", link.id);

        await supabase.from("generated_documents").update({ status: "negociacao" }).eq("id", link.document_id);

        return jsonResponse({ success: true, status: "negociacao" });
      }

      // ── APPROVE ──
      const approverName = (body.approverName || "").trim();
      if (!approverName) return jsonResponse({ error: "Nome é obrigatório" }, 400);
      if (approverName.length > 200) return jsonResponse({ error: "Nome muito longo" }, 400);

      const now = new Date().toISOString();
      await supabase.from("proposal_links").update({
        status: "aprovado",
        approved_at: now,
        approver_name: approverName,
        viewed_at: link.status === "enviado" ? now : undefined,
        view_count: link.max_views ?? 1,
      }).eq("id", link.id);

      await supabase.from("generated_documents").update({ status: "aprovado" }).eq("id", link.document_id);

      return jsonResponse({ success: true, approvedAt: now });
    }

    return jsonResponse({ error: "Método não suportado" }, 405);
  } catch (err) {
    console.error("proposal-public error:", err);
    return jsonResponse({ error: "Erro interno" }, 500);
  }
});
