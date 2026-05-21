import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Auth required (uses LOVABLE_API_KEY credits)
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { parties, usageType, duration, territory, compensation, additionalTerms } = await req.json();

    // Basic input validation: required strings, length caps
    const required = { parties, usageType, duration, territory, compensation };
    for (const [k, v] of Object.entries(required)) {
      if (typeof v !== "string" || v.trim().length === 0 || v.length > 2000) {
        return new Response(JSON.stringify({ error: `Invalid '${k}'` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    if (additionalTerms && (typeof additionalTerms !== "string" || additionalTerms.length > 5000)) {
      return new Response(JSON.stringify({ error: "Invalid 'additionalTerms'" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const prompt = `Generate a professional, legally-structured contract for likeness usage with these details:

Parties: ${parties}
Usage Type: ${usageType}
Duration: ${duration}
Territory: ${territory}
Compensation: ${compensation}
${additionalTerms ? `Additional Terms: ${additionalTerms}` : ''}

Format the contract with proper legal sections including:
1. Parties and Recitals
2. Grant of Rights
3. Scope of Use
4. Compensation and Payment Terms
5. Duration and Termination
6. Representations and Warranties
7. Indemnification
8. Confidentiality
9. Governing Law
10. Signatures

Use professional legal language. Include placeholders like [DATE], [SIGNATURE] where appropriate.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a legal document specialist who creates professional contracts for likeness and intellectual property usage. Generate clear, comprehensive contracts.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ error: 'Usage limit reached.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const contract = data.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ success: true, contract }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Contract generation error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
