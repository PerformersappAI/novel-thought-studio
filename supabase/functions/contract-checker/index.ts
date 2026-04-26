const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const tool = {
  type: "function",
  function: {
    name: "report_findings",
    description: "Return a list of findings about a performer contract.",
    parameters: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "1-2 sentence overall risk summary in plain English.",
        },
        findings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              severity: { type: "string", enum: ["red", "yellow", "green"] },
              category: {
                type: "string",
                description: "Short label, e.g. 'Likeness Rights Scope', 'Compensation', 'Term & Expiration', 'AI Training Consent', 'Termination', 'Red-Flag Language'.",
              },
              excerpt: {
                type: "string",
                description: "Direct quote from the contract (max 200 chars). Empty string if not applicable.",
              },
              explanation: {
                type: "string",
                description: "Plain-English explanation of why this matters to a performer.",
              },
            },
            required: ["severity", "category", "excerpt", "explanation"],
            additionalProperties: false,
          },
        },
      },
      required: ["summary", "findings"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.length < 50) {
      return new Response(JSON.stringify({ error: "Provide at least 50 characters of contract text." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert performer-rights contract reviewer for ClaimMyFace.
Analyze the contract for clauses that affect a performer's face, voice, name, and likeness.
Flag specifically:
- Overly broad likeness rights (perpetual, irrevocable, all media, all uses)
- Missing or inadequate compensation for likeness use
- No expiration date or term
- Missing or weak consent for AI training / digital replicas
- Red-flag boilerplate (sublicensing, assignment, moral rights waivers)
Use severity:
  red = clearly dangerous to the performer
  yellow = needs review or negotiation
  green = acceptable / industry-standard protection
Return 4-8 findings via the report_findings tool. Always include at least one finding per category if relevant.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this contract:\n\n${text.substring(0, 12000)}` },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "report_findings" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    let parsed: any = { summary: "", findings: [] };
    if (call?.function?.arguments) {
      try { parsed = JSON.parse(call.function.arguments); } catch { /* noop */ }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("contract-checker error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
