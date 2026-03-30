import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const BOT_UA = /whatsapp|facebookexternalhit|telegrambot|twitterbot|linkedinbot|slackbot|discordbot|googlebot|bingbot/i;

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const wantImage = url.searchParams.get("image") === "1";

  if (!token || token.length < 10 || !/^[a-f0-9]+$/i.test(token)) {
    return new Response("Not found", { status: 404 });
  }

  const appOrigin = "https://freelox.app";
  const redirectUrl = `${appOrigin}/p/${token}`;
  const ua = req.headers.get("user-agent") || "";
  const isBot = BOT_UA.test(ua);

  // For regular browsers, redirect immediately (no HTML needed)
  if (!isBot && !wantImage) {
    return Response.redirect(redirectUrl, 302);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: link } = await supabase
    .from("proposal_links")
    .select("document_id, user_id")
    .eq("token", token)
    .maybeSingle();

  let companyName = "Powered by Freelox";
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

    // Keep companyName as "Powered by Freelox" for clean branding
    if (settingsRes.data?.logo_url) logoUrl = settingsRes.data.logo_url;
    if (docRes.data?.client_name) clientName = docRes.data.client_name;
  }

  // Always use the default Freelox OG image (1200x630, professional look)
  // User logos are too small/raw and look bad as OG preview images
  const ogImageUrl = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/template-images/og-default.jpg`;
  const description = "";

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta property="og:type" content="website"/>
<meta property="og:title" content="${esc(companyName)}"/>
<meta property="og:description" content="${esc(description)}"/>
<meta property="og:image" content="${esc(ogImageUrl)}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:url" content="${esc(redirectUrl)}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${esc(companyName)}"/>
<meta name="twitter:description" content="${esc(description)}"/>
<meta name="twitter:image" content="${esc(ogImageUrl)}"/>
<meta http-equiv="refresh" content="0;url=${esc(redirectUrl)}"/>
<title>${esc(companyName)}</title>
</head>
<body><p>Redirecionando...</p></body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
});
