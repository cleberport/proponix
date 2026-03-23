import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a document content extractor. You receive an image of a business proposal/invoice/quote.

Your job is ONLY to extract structured content. You are NOT a layout engine.

DO NOT:
- Define positions (x, y)
- Define spacing or margins
- Replicate visual layout
- Return HTML

ONLY:
- Identify content blocks
- Convert text into structured data
- Create dynamic variables for any variable content

Group content into these sections:

1. **header** — Company name, logo presence, contact info (phone, email, website, address, CNPJ)
2. **client** — Client name, client address, any "To:" fields
3. **title** — Document title or type (e.g. "Proposta Comercial", "Orçamento")
4. **event** — Event name, location, dates, service type
5. **description** — Requirements, scope of work, descriptions
6. **pricing** — Line items with description and price, subtotals
7. **totals** — Total amount, taxes, discounts
8. **notes** — Terms, conditions, observations, payment info, disclaimers

VARIABLE RULES:
- Any content that changes per client/proposal MUST become a variable: {{variable_name}}
- Use snake_case: client_name, event_name, event_location, event_dates, price_total, city, service_type
- Static company info stays as plain text
- Prices become variables: {{item_1_price}}, {{price_total}}

Return a JSON object with this exact structure:
{
  "sections": [
    {
      "type": "header" | "client" | "title" | "event" | "description" | "pricing" | "totals" | "notes",
      "elements": [
        {
          "type": "text" | "dynamic-field" | "logo" | "divider" | "table" | "price-field" | "total-calculation" | "notes",
          "content": "string content or {{variable}}",
          "fontSize": number (8-24),
          "fontWeight": "normal" | "bold",
          "color": "#hex",
          "alignment": "left" | "center" | "right",
          "variable": "variable_name (only for dynamic fields)",
          "fieldCategory": "default" | "input" | "calculated",
          "rows": [{"cells": ["col1", "col2"]}],
          "columnWidths": [50, 50]
        }
      ]
    }
  ],
  "backgroundColor": "#ffffff",
  "variables": ["client_name", "event_name", ...],
  "inputFields": ["client_name", "event_name", ...],
  "calculatedFields": {},
  "defaultValues": {}
}

ELEMENT TYPE RULES:
- "logo" for company logo placeholder (content="Logo")
- "text" for static content
- "dynamic-field" for variable content — set fieldCategory="input"
- "price-field" for monetary values — set fieldCategory="input"
- "total-calculation" for totals — set fieldCategory="calculated"
- "table" for itemized lists — use rows array with string cells
- "divider" for section separators
- "notes" for terms/observations

IMPORTANT:
- Table cells MUST be plain strings, never objects
- defaultValues MUST be an empty object
- DO NOT include x, y, width, height in elements
- DO NOT include markdown or code blocks
- Return ONLY raw JSON`;

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
                text: "Extract ALL content from this document. Group into sections. Replace variable content with {{variables}}. Return ONLY raw JSON, no markdown.",
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
