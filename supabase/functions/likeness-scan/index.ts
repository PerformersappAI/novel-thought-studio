const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const EXACT_NAME_QUERY = 'Will Roberts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scanId } = await req.json();

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const exactQuery = `"${EXACT_NAME_QUERY}"`;
    console.log('Running likeness scan for exact phrase:', exactQuery);

    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: exactQuery,
        limit: 20,
        scrapeOptions: { formats: ['markdown'] },
      }),
    });

    const data = await response.json();

    // Relevance filter: keep results where URL/title/description contains the
    // performer's name, OR the domain is a known entertainment/casting/social site.
    // Drop noise from gov, software vendors, dictionaries, generic reference, etc.
    const ALLOWED_DOMAINS = [
      "instagram.com","tiktok.com","facebook.com","twitter.com","x.com","youtube.com",
      "linkedin.com","threads.net","snapchat.com","pinterest.com","reddit.com","tumblr.com",
      "imdb.com","backstage.com","actorsaccess.com","castingnetworks.com","spotlight.com",
      "mandy.com","castingcallclub.com","nowcasting.com","castingfrontier.com",
      "variety.com","hollywoodreporter.com","deadline.com","ew.com","people.com",
      "tmz.com","etonline.com","vulture.com","indiewire.com","rottentomatoes.com",
      "metacritic.com","letterboxd.com","tvinsider.com","playbill.com","broadwayworld.com",
      "sagaftra.org","equityuk.org","spotify.com","soundcloud.com","vimeo.com","twitch.tv",
      "patreon.com","onlyfans.com","cameo.com","substack.com","medium.com",
      "shutterstock.com","gettyimages.com","alamy.com","wireimage.com",
    ];
    const BLOCKED_TLDS = [".gov",".mil",".edu"];
    const BLOCKED_DOMAINS = [
      "microsoft.com","apple.com","google.com","amazon.com","oracle.com","adobe.com",
      "ibm.com","salesforce.com","github.com","stackoverflow.com","npmjs.com",
      "merriam-webster.com","dictionary.com","thesaurus.com","britannica.com",
      "wikipedia.org","wiktionary.org","wikidata.org","quora.com","yelp.com",
      "tripadvisor.com","booking.com","expedia.com","walmart.com","ebay.com",
      "etsy.com","aliexpress.com","whitehouse.gov","senate.gov","congress.gov",
    ];
    const queryLower = EXACT_NAME_QUERY.toLowerCase();

    const isRelevant = (r: any): boolean => {
      const url: string = (r.url || "").toLowerCase();
      const title: string = (r.title || "").toLowerCase();
      const desc: string = (r.description || "").toLowerCase();
      if (!url) return false;
      let host = "";
      try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { return false; }
      if (BLOCKED_DOMAINS.some((d) => host === d || host.endsWith("." + d))) return false;
      if (BLOCKED_TLDS.some((t) => host.endsWith(t))) return false;
      const allowed = ALLOWED_DOMAINS.some((d) => host === d || host.endsWith("." + d));
      const haystack = `${url} ${title} ${desc}`;
      const nameMatch = haystack.includes(queryLower);
      return allowed || nameMatch;
    };

    if (Array.isArray(data.data)) {
      const before = data.data.length;
      data.data = data.data.filter(isRelevant);
      console.log(`Relevance filter: ${before} → ${data.data.length}`);
    }

    if (!response.ok) {
      console.error('Firecrawl error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Search failed (${response.status})` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the scan record if scanId provided
    if (scanId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      const results = data.data?.map((r: any) => ({
        url: r.url,
        title: r.title || '',
        description: r.description || '',
        snippet: r.markdown?.substring(0, 300) || '',
      })) || [];

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
      JSON.stringify({ success: true, data: data.data || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scan error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Scan failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
