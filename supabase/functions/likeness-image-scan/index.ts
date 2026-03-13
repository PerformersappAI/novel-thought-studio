const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, scanId, name, stageName, description } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: 'Image data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Google Cloud Vision not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Running reverse image scan via Google Cloud Vision');
    console.log('Context:', { name, stageName, description });

    // Build search terms for filtering
    const searchTerms: string[] = [];
    if (name) searchTerms.push(...name.toLowerCase().split(/\s+/));
    if (stageName) searchTerms.push(...stageName.toLowerCase().split(/\s+/));

    // Call Google Cloud Vision Web Detection
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

    // If name/stageName provided, score results by relevance
    if (searchTerms.length > 0) {
      results = results.map((r: any) => {
        const text = `${r.url} ${r.title} ${r.description}`.toLowerCase();
        const matchCount = searchTerms.filter(term => text.includes(term)).length;
        return { ...r, _score: matchCount };
      });

      // Sort: name matches first, then the rest
      results.sort((a: any, b: any) => b._score - a._score);

      // Tag name matches
      results = results.map((r: any) => {
        if (r._score > 0) r.match_type = 'name_match';
        const { _score, ...rest } = r;
        return rest;
      });
    }

    // Also do a Firecrawl text search if name is provided
    if (name) {
      const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
      if (firecrawlKey) {
        try {
          const searchQuery = `"${name}"${stageName ? ` OR "${stageName}"` : ''} photo OR image OR likeness`;
          console.log('Firecrawl search:', searchQuery);
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

    // Update the scan record
    if (scanId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      await fetch(`${supabaseUrl}/rest/v1/likeness_scans?id=eq.${scanId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          status: 'completed',
          results,
          result_count: results.length,
          completed_at: new Date().toISOString(),
        }),
      });
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
