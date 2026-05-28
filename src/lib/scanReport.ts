/**
 * DEPRECATED — DO NOT REINTRODUCE.
 *
 * ClaimMyFace is privacy-first: scan findings are never written to the
 * database. Results live in React state for the current session only and
 * disappear when the user leaves the page. If the user wants a record, they
 * download the client-side PDF (see `src/lib/scanPdf.ts`).
 *
 * The `scan_reports` table remains in the schema for historical reasons but
 * is no longer written to. These helpers are kept as no-ops so any stale
 * caller fails closed rather than silently persisting data.
 */

export function buildScrubbedSummary(_results: any[] = []): Record<string, never> {
  return {};
}

export async function saveScanReport(_opts: {
  userId: string;
  scanId?: string | null;
  scanType: string;
  queryLabel: string;
  results: any[];
}): Promise<void> {
  // Intentionally a no-op. See file header.
  return;
}
