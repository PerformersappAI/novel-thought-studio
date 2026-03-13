const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, scanId } = await req.json();

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

    // Call Google Cloud Vision Web Detection
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageBase64 },
              features: [{ type: 'WEB_DETECTION', maxResults: 20 }],
            },
          ],
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

    // Build results from pages with matching images and partial matching images
    const pagesWithImages = webDetection.pagesWithMatchingImages || [];
    const fullMatches = webDetection.fullMatchingImages || [];
    const partialMatches = webDetection.partialMatchingImages || [];
    const visuallySimilar = webDetection.visuallySimilarImages || [];
    const bestGuessLabels = webDetection.bestGuessLabels || [];

    const results = pagesWithImages.map((page: any) => ({
      url: page.url,
      title: page.pageTitle || '',
      description: bestGuessLabels.map((l: any) => l.label).join(', '),
      snippet: '',
      match_type: 'page_with_matching_image',
      matching_images: (page.fullMatchingImages || []).concat(page.partialMatchingImages || []).map((img: any) => img.url),
    }));

    // Add visually similar images not already in pages
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

    // Update the scan record if scanId provided
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
      JSON.stringify({ success: true, data: results, webDetection }),
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
