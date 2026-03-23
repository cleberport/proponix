import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a document structure analyzer. You receive an image of a business proposal/invoice/quote.

Your job is to REBUILD it as a clean, structured template with SEQUENTIAL vertical layout on a 595×842 canvas (A4).

CRITICAL RULES:
1. SEQUENTIAL LAYOUT — Elements are placed TOP to BOTTOM. Each element's Y = previous element's Y + previous element's height + spacing.
2. NO OVERLAPPING — Every element must have its own vertical space. Never place two elements at the same Y.
3. NO HARDCODED VALUES — Any variable content (names, dates, prices, locations, event names) MUST become dynamic fields with variables like {{client_name}}.
4. CLEAN SPACING — Use consistent margins: left margin = 40px, right boundary = 555px (max width = 515px).
5. REALISTIC HEIGHTS — Single line text = 22-28px, multi-line = 40-80px, tables = rows × 28 + header, notes = 60-120px.

LAYOUT STRUCTURE (top to bottom):
1. HEADER ZONE (y: 30-120): Logo left + company info right, side by side
2. CLIENT ZONE (y: ~130): "À" + client name as dynamic-field
3. TITLE ZONE (y: ~170): Document title (e.g. "Instrumento de Serviços Artísticos")
4. SERVICE TYPE (y: ~200): Service category as dynamic-field
5. DATE LINE (y: ~230): City + date as dynamic-fields, on same line
6. EVENT INFO (y: ~270-340): Event name, location, dates — each as dynamic-field on its own line
7. DESCRIPTION (y: ~360): Requirements/description as text block
8. PRICING TABLE (y: ~400): Table with service items and prices
9. TOTAL LINE (y: after table): Total with price-field or total-calculation
10. OBSERVATIONS (y: after total + 20): Notes/terms block

FOR SIDE-BY-SIDE ELEMENTS:
- Logo: x=40, width=180
- Company info: x=280, width=275
- For city+date: city at x=40, date at x=300

Return a JSON object with this exact structure:
{
  "elements": [
    {
      "type": "text" | "dynamic-field" | "image" | "logo" | "divider" | "table" | "price-field" | "total-calculation" | "notes",
      "x": number,
      "y": number,
      "width": number,
      "height": number,
      "content": string,
      "fontSize": number,
      "fontWeight": "normal" | "bold",
      "color": string (hex),
      "alignment": "left" | "center" | "right",
      "variable": string (only for dynamic-field/price-field/total-calculation),
      "fieldCategory": "default" | "input" | "calculated",
      "defaultValue": string,
      "rows": [{"cells": ["col1","col2",...]}] (only for table),
      "columnWidths": [number] (percentage widths, only for table)
    }
  ],
  "backgroundColor": "#ffffff",
  "variables": ["client_name", "event_name", ...],
  "inputFields": ["client_name", "event_name", ...],
  "calculatedFields": {},
  "defaultValues": {}
}

ELEMENT TYPE RULES:
- "logo" for company logo placeholder (content="Logo", x=40, y=30, width=180, height=80)
- "text" for static content: company info, descriptions, section titles
- "dynamic-field" for: client names, event names, dates, locations, service types — set fieldCategory="input"
- "price-field" for individual monetary values — set fieldCategory="input"
- "total-calculation" for totals — set fieldCategory="calculated"
- "table" for itemized lists — use rows array with cells
- "divider" for horizontal separators (height=2)
- "notes" for terms/observations (multi-line content)

VARIABLE NAMING: Use snake_case: client_name, event_name, event_location, event_dates, city, service_type, price_total

VALIDATION CHECKLIST before responding:
- No two elements share the same Y range
- Every element Y > previous element (Y + height)
- All variable content replaced with {{variable_name}}
- defaultValues is empty object (no hardcoded values)
- Total vertical space < 842

DO NOT include markdown formatting or code blocks. Return ONLY raw JSON.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: "Analyze this document and rebuild it as a clean sequential template. Replace ALL variable content with dynamic fields. Return ONLY raw JSON, no markdown.",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    // Strip markdown code fences if present
    content = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse AI response", raw: content }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-proposal error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
