import { supabase } from "@/integrations/supabase/client";

// Build a scrubbed summary of a likeness scan — counts and categories only,
// no URLs, no titles, no excerpts, no PII.
export function buildScrubbedSummary(results: any[] = []) {
  const total = results.length;
  const byCategory: Record<string, number> = {};
  const byRisk: Record<string, number> = { high: 0, medium: 0, low: 0 };
  let withImage = 0;

  for (const r of results) {
    const cat = (r?.category || r?.media_type || "other").toString().toLowerCase();
    byCategory[cat] = (byCategory[cat] ?? 0) + 1;
    const risk = (r?.risk || r?.risk_level || "").toString().toLowerCase();
    if (risk === "high" || risk === "medium" || risk === "low") byRisk[risk]++;
    if (r?.thumbnail || r?.image || r?.thumbnail_url) withImage++;
  }

  return {
    total_results: total,
    by_category: byCategory,
    by_risk: byRisk,
    results_with_image: withImage,
    generated_at: new Date().toISOString(),
  };
}

export async function saveScanReport(opts: {
  userId: string;
  scanId?: string | null;
  scanType: string;
  queryLabel: string;
  results: any[];
}) {
  try {
    const summary = buildScrubbedSummary(opts.results);
    await supabase.from("scan_reports").insert({
      user_id: opts.userId,
      source_scan_id: opts.scanId ?? null,
      scan_type: opts.scanType,
      query_label: opts.queryLabel?.slice(0, 120) ?? null,
      summary,
    } as any);
  } catch (err) {
    console.warn("[scanReport] save failed", err);
  }
}
