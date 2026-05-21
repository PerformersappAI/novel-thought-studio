import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB base64 cap

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth required (biometric endpoint) ---
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
    const callerId = userData.user.id;

    const body = await req.json();
    const { imageBase64, scanId, name, stageName, description } = body ?? {};

    // --- Input validation ---
    if (typeof imageBase64 !== "string" || imageBase64.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Image data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (imageBase64.length > MAX_IMAGE_BYTES) {
      return new Response(
        JSON.stringify({ success: false, error: 'Image too large (max ~6MB)' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!/^[A-Za-z0-9+/=\s]+$/.test(imageBase64)) {
      return new Response(
        JSON.stringify({ success: false, error: 'imageBase64 must be base64-encoded' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const safeName = typeof name === "string" ? name.slice(0, 200) : "";
    const safeStage = typeof stageName === "string" ? stageName.slice(0, 200) : "";

    // Ownership check on scanId
    if (scanId) {
      const { data: scanRow, error: scanErr } = await authClient
        .from("likeness_scans").select("user_id").eq("id", scanId).maybeSingle();
      if (scanErr || !scanRow || scanRow.user_id !== callerId) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const apiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Google Cloud Vision not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Running reverse image scan via Google Cloud Vision for user', callerId);

    const searchTerms: string[] = [];
    if (safeName) searchTerms.push(...safeName.toLowerCase().split(/\s+/));
    if (safeStage) searchTerms.push(...safeStage.toLowerCase().split(/\s+/));

    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: imageBase64 },
            features: [{ type: 'WEB_DETECTION', maxResults: 30 }],
          }],
        }),
      }
    );

    const visionData = await visionResponse.json();
    if (!visionResponse.ok) {
      console.error('Vision API error:', visionData);
      return new Response(
        JSON.stringify({ success: false, error: visionData.error?.message || 'Vision API failed' }),
        { status: visionResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const webDetection = visionData.responses?.[0]?.webDetection || {};
    const pagesWithImages = webDetection.pagesWithMatchingImages || [];
    const visuallySimilar = webDetection.visuallySimilarImages || [];
    const bestGuessLabels = webDetection.bestGuessLabels || [];

    let results = pagesWithImages.map((page: any) => ({
      url: page.url,
      title: page.pageTitle || '',
      description: bestGuessLabels.map((l: any) => l.label).join(', '),
      snippet: '',
      match_type: 'page_with_matching_image',
      matching_images: (page.fullMatchingImages || []).concat(page.partialMatchingImages || []).map((img: any) => img.url),
    }));

    const pageUrls = new Set(results.map((r: any) => r.url));
    visuallySimilar.forEach((img: any) => {
      if (!pageUrls.has(img.url)) {
        results.push({
          url: img.url,
          title: 'Visually Similar Image',
          description: bestGuessLabels.map((l: any) => l.label).join(', '),
          snippet: '',
          match_type: 'visually_similar',
          matching_images: [img.url],
        });
      }
    });

    if (searchTerms.length > 0) {
      results = results.map((r: any) => {
        const text = `${r.url} ${r.title} ${r.description}`.toLowerCase();
        const matchCount = searchTerms.filter(term => text.includes(term)).length;
        return { ...r, _score: matchCount };
      });
      results.sort((a: any, b: any) => b._score - a._score);
      results = results.map((r: any) => {
        if (r._score > 0) r.match_type = 'name_match';
        const { _score, ...rest } = r;
        return rest;
      });
    }

    if (safeName) {
      const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
      if (firecrawlKey) {
        try {
          const searchQuery = `"${safeName}"${safeStage ? ` OR "${safeStage}"` : ''} photo OR image OR likeness`;
          const fcResponse = await fetch('https://api.firecrawl.dev/v1/search', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: searchQuery, limit: 10 }),
          });
          if (fcResponse.ok) {
            const fcData = await fcResponse.json();
            const existingUrls = new Set(results.map((r: any) => r.url));
            (fcData.data || []).forEach((item: any) => {
              if (!existingUrls.has(item.url)) {
                results.push({
                  url: item.url,
                  title: item.title || '',
                  description: item.description || '',
                  snippet: '',
                  match_type: 'text_cross_reference',
                  matching_images: [],
                });
              }
            });
          }
        } catch (e) {
          console.error('Firecrawl search failed (non-fatal):', e);
        }
      }
    }

    if (scanId) {
      await authClient.from("likeness_scans").update({
        status: 'completed',
        results,
        result_count: results.length,
        completed_at: new Date().toISOString(),
      }).eq("id", scanId);
    }

    return new Response(
      JSON.stringify({ success: true, data: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Image scan error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Scan failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
