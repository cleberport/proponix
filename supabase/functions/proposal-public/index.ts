import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET") {
      // Fetch proposal by token
      const { data: link, error: linkErr } = await supabase
        .from("proposal_links")
        .select("*")
        .eq("token", token)
        .maybeSingle();

      if (linkErr || !link) {
        return new Response(JSON.stringify({ error: "Proposta não encontrada" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch the document
      const { data: doc, error: docErr } = await supabase
        .from("generated_documents")
        .select("*")
        .eq("id", link.document_id)
        .maybeSingle();

      if (docErr || !doc) {
        return new Response(JSON.stringify({ error: "Documento não encontrado" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Mark as viewed if first time
      if (link.status === "enviado") {
        await supabase
          .from("proposal_links")
          .update({ status: "visualizado", viewed_at: new Date().toISOString() })
          .eq("id", link.id);

        // Also update the generated_documents status
        await supabase
          .from("generated_documents")
          .update({ status: "visualizado" })
          .eq("id", link.document_id);

        link.status = "visualizado";
        link.viewed_at = new Date().toISOString();
      }

      // Fetch user settings for company info
      const { data: settings } = await supabase
        .from("user_settings")
        .select("company_name, company_email, company_phone, company_website, company_address, logo_url")
        .eq("user_id", link.user_id)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          proposal: {
            id: link.id,
            token: link.token,
            status: link.status,
            viewedAt: link.viewed_at,
            approvedAt: link.approved_at,
            approverName: link.approver_name,
            document: {
              clientName: doc.client_name,
              templateName: doc.template_name,
              fileName: doc.file_name,
              values: doc.values,
              generatedAt: doc.generated_at,
            },
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
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method === "POST") {
      // Approve proposal
      const body = await req.json();
      const approverName = (body.approverName || "").trim();

      if (!approverName) {
        return new Response(JSON.stringify({ error: "Nome é obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (approverName.length > 200) {
        return new Response(JSON.stringify({ error: "Nome muito longo" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: link, error: linkErr } = await supabase
        .from("proposal_links")
        .select("id, document_id, status")
        .eq("token", token)
        .maybeSingle();

      if (linkErr || !link) {
        return new Response(JSON.stringify({ error: "Proposta não encontrada" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (link.status === "aprovado") {
        return new Response(JSON.stringify({ error: "Proposta já aprovada" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const now = new Date().toISOString();
      await supabase
        .from("proposal_links")
        .update({
          status: "aprovado",
          approved_at: now,
          approver_name: approverName,
          viewed_at: link.status === "enviado" ? now : undefined,
        })
        .eq("id", link.id);

      await supabase
        .from("generated_documents")
        .update({ status: "aprovado" })
        .eq("id", link.document_id);

      return new Response(
        JSON.stringify({ success: true, approvedAt: now }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ error: "Método não suportado" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("proposal-public error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
