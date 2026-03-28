import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token || token.length < 10 || !/^[a-f0-9]+$/i.test(token)) {
    return new Response("Not found", { status: 404 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Fetch proposal link + document + company settings
  const { data: link } = await supabase
    .from("proposal_links")
    .select("document_id, user_id")
    .eq("token", token)
    .maybeSingle();

  let companyName = "Proposta comercial";
  let logoUrl = "";
  let clientName = "";

  if (link) {
    const [settingsRes, docRes] = await Promise.all([
      supabase
        .from("user_settings")
        .select("company_name, logo_url")
        .eq("user_id", link.user_id)
        .maybeSingle(),
      supabase
        .from("generated_documents")
        .select("client_name")
        .eq("id", link.document_id)
        .maybeSingle(),
    ]);

    if (settingsRes.data?.company_name) {
      companyName = settingsRes.data.company_name;
    }
    if (settingsRes.data?.logo_url) {
      logoUrl = settingsRes.data.logo_url;
    }
    if (docRes.data?.client_name) {
      clientName = docRes.data.client_name;
    }
  }

  const description = clientName
    ? `Proposta preparada para ${clientName}`
    : "Visualize os detalhes da proposta";

  // Build the SPA URL for redirect
  const appOrigin = Deno.env.get("APP_ORIGIN") || "https://freelox.lovable.app";
  const redirectUrl = `${appOrigin}/p/${token}`;

  // Escape HTML entities
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta property="og:type" content="website"/>
<meta property="og:title" content="${esc(companyName)}"/>
<meta property="og:description" content="${esc(description)}"/>
${logoUrl ? `<meta property="og:image" content="${esc(logoUrl)}"/>` : ""}
<meta name="twitter:card" content="summary"/>
<meta name="twitter:title" content="${esc(companyName)}"/>
<meta name="twitter:description" content="${esc(description)}"/>
${logoUrl ? `<meta name="twitter:image" content="${esc(logoUrl)}"/>` : ""}
<meta http-equiv="refresh" content="0;url=${esc(redirectUrl)}"/>
<title>${esc(companyName)}</title>
</head>
<body>
<script>window.location.replace("${redirectUrl.replace(/"/g, '\\"')}");</script>
<p>Redirecionando...</p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
});
