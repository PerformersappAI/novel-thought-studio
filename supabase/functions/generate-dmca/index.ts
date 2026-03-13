import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { ownerName, ownerAddress, infringingUrl, originalWorkDescription, ownershipProof } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const prompt = `Generate a formal DMCA takedown notice with these details:

Copyright Owner: ${ownerName}
Address: ${ownerAddress || '[ADDRESS]'}
Infringing URL(s): ${infringingUrl}
Description of Original Work: ${originalWorkDescription}
Proof of Ownership: ${ownershipProof || 'Original creator and rights holder'}

Include all legally required elements:
1. Identification of the copyrighted work
2. Identification of the infringing material with URL
3. Contact information of the complaining party
4. Good faith statement
5. Accuracy statement under penalty of perjury
6. Physical or electronic signature placeholder

Format as a professional letter ready to send to the hosting provider's DMCA agent.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a legal specialist creating DMCA takedown notices. Generate professional, legally compliant notices following 17 U.S.C. § 512(c)(3).' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ error: 'Usage limit reached.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const notice = data.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ success: true, notice }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('DMCA generation error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
