import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a document layout analyzer. You receive an image of a business proposal/invoice/quote document.

Your job is to reconstruct it as a list of canvas elements for a template editor (595x842 canvas, like A4).

Return a JSON object with this exact structure:
{
  "elements": [
    {
      "type": "text" | "dynamic-field" | "image" | "logo" | "divider" | "table" | "price-field" | "total-calculation" | "notes",
      "x": number (0-595),
      "y": number (0-842),
      "width": number,
      "height": number,
      "content": string,
      "fontSize": number (8-48),
      "fontWeight": string ("normal" | "bold"),
      "color": string (hex like "#333333"),
      "alignment": "left" | "center" | "right",
      "variable": string (only for dynamic-field, price-field, total-calculation),
      "fieldCategory": "default" | "input" | "calculated",
      "defaultValue": string,
      "rows": [{"cells": ["col1","col2",...]}] (only for table type),
      "columnWidths": [number] (percentage widths, only for table)
    }
  ],
  "backgroundColor": string (hex),
  "variables": string[],
  "inputFields": string[],
  "calculatedFields": {},
  "defaultValues": {}
}

RULES:
- Reconstruct the FULL layout, don't just describe it
- Position elements accurately based on where they appear in the image
- Use "dynamic-field" for: client names, dates, event names, locations — set variable like "client_name", "event_date", "location", "event_name"
- Use "price-field" for monetary values — set variable like "price", "valor_servico"
- Use "total-calculation" for totals/subtotals — set variable like "subtotal", "total"
- Use "text" for static text blocks (company info, descriptions, terms)
- Use "divider" for horizontal lines/separators
- Use "table" for tabular data (services list, item descriptions)
- Use "notes" for terms, conditions, observations sections
- Use "logo" for the company logo area (set content to "Logo" and leave imageUrl empty)
- Approximate font sizes: titles ~20-28, subtitles ~14-18, body ~10-12, small ~8-9
- Approximate colors from the document
- Set fieldCategory: "input" for user-fillable fields, "calculated" for computed fields, "default" for static
- Include ALL detected variables in the "variables" array
- Include user-fillable variables in "inputFields"
- Set reasonable defaultValues for variables
- Keep elements within canvas bounds (595x842)
- Use realistic heights: single line text ~20-30, multi-line ~40-80, tables ~100-200
- DO NOT include any markdown formatting or code blocks. Return ONLY raw JSON.`;

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
                text: "Analyze this proposal/document image and reconstruct it as editable template elements. Return ONLY raw JSON, no markdown.",
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
