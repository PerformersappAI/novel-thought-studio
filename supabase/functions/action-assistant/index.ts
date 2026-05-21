import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Mode = "field" | "chat";

interface RequestBody {
  mode: Mode;
  actionType: string;
  field?: string;
  question?: string;
  finding?: Record<string, unknown>;
  formValues?: Record<string, string>;
  owner?: Record<string, string | null | undefined>;
}

const SYSTEM = `You are a legal-writing assistant inside ClaimMyFace, a digital likeness rights platform for performers.
Your job is to help a performer file takedown notices, cease & desist letters, platform reports, and polite removal requests when their face, voice, or name is used without permission.

Guidelines:
- Speak in plain English. No jargon unless you immediately explain it.
- When drafting field text, output ONLY the text for that field — no preamble, no quotes, no markdown headings.
- When answering a chat question, be concise and practical. 3-6 sentences max unless the user asks for more.
- Never invent facts. If you need a detail you don't have, leave a clear placeholder in [BRACKETS].
- For DMCA notices, follow 17 U.S.C. § 512(c)(3) elements.
- For Cease & Desist letters, be firm but professional. Reference unauthorized use of likeness/right of publicity.
- For Platform Reports, match the tone the platform expects (impersonation / IP infringement).
- For Removal Requests, stay polite — these go to people who may have used content innocently.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as RequestBody;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const contextLines: string[] = [];
    if (body.actionType) contextLines.push(`Action type: ${body.actionType}`);
    if (body.finding) contextLines.push(`Finding context:\n${JSON.stringify(body.finding, null, 2)}`);
    if (body.owner) contextLines.push(`Owner profile:\n${JSON.stringify(body.owner, null, 2)}`);
    if (body.formValues && Object.keys(body.formValues).length > 0) {
      contextLines.push(`Current form values:\n${JSON.stringify(body.formValues, null, 2)}`);
    }

    let userPrompt: string;
    if (body.mode === "field") {
      userPrompt = `${contextLines.join("\n\n")}\n\nWrite the best possible text for the form field "${body.field}". Output ONLY the text for that field.`;
    } else {
      userPrompt = `${contextLines.join("\n\n")}\n\nUser question:\n${body.question ?? ""}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Add credits in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error (${response.status})`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ success: true, text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("action-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
