# Privacy-first scans: stop storing findings, add action log + PDF export

Aligns with the new directive: scans are live and ephemeral; only user-initiated legal actions get stored.

## 1. Stop writing scan findings

- Remove all callers of `saveScanReport` (none exist today — confirmed via `rg saveScanReport src` returns only `src/lib/scanReport.ts`). Mark the helper deprecated with a no-op + comment so it can't be reintroduced accidentally.
- Leave the existing `scan_reports` table in place but unused. Remove the `ScanReports` page from the sidebar nav (`src/components/dashboard/DashboardLayout.tsx`) and route (`src/App.tsx`) — or replace its content with a short "Scan results are not stored — download the PDF after each scan" notice. (I'll go with replacement so the route doesn't 404 for users with bookmarks.)
- No diff/comparison UI is built. `src/components/dashboard/DetectionPanels.tsx` "X scanned" counters stay (they read `scan_runs` aggregate counts, not findings).

## 2. Suppression stays local

`src/pages/Monitoring.tsx` already stores verdicts in `localStorage` under `monitoring.verdicts.v1`. Extend it so thumbs-down also adds the row's `url_hash` (SHA-256 client-side) to a new `localStorage` key `monitoring.suppressions.v1`. Filter that set out of the rendered list and re-apply on every fresh scan. Small "Hidden (N) — Unhide" disclosure at the bottom of each section so mistakes are reversible. No database table.

## 3. Append-only `finding_actions` table

Migration:

```text
public.finding_actions
  id uuid pk default gen_random_uuid()
  user_id uuid not null
  url_hash text not null         -- SHA-256, never plaintext URL
  action_type text not null      -- 'dmca' | 'cease_desist' | 'violation_report' | 'note'
  status text not null default 'sent'
  notes text
  created_at timestamptz not null default now()
  index (user_id, created_at desc)
  index (user_id, url_hash)
```

Grants: `authenticated` (SELECT, INSERT), `service_role` (ALL). No `UPDATE`/`DELETE` grant to `authenticated`.

RLS policies:
- `SELECT` for owner (`auth.uid() = user_id`).
- `INSERT` for owner with check (`auth.uid() = user_id`).
- **No `UPDATE` or `RLS UPDATE`/`DELETE` policy is created** — without a policy, RLS denies by default. To "resolve" or annotate, the user inserts a new row (e.g. `action_type='note'` with `status='resolved'`). The original "sent" row is permanently immutable.

Client wiring — write one row on submit in:
- `src/pages/DmcaGeneratorPage.tsx` → `action_type='dmca'`
- `src/pages/ContractGenerator.tsx` (cease-desist mode) and `src/pages/actions/CeaseDesistAction.tsx` → `action_type='cease_desist'`
- `src/pages/ReportViolation.tsx` and `src/components/monitoring/ImpersonatorReportModal.tsx` → `action_type='violation_report'`

URL hashing helper: new `src/lib/urlHash.ts` exporting `sha256Hex(url)` using Web Crypto.

New "Actions Taken" tab on `src/pages/Monitoring.tsx` listing rows from `finding_actions` (date, type badge, status, notes, truncated `url_hash`), sortable by date, filter by status. An "Add note / Mark resolved" affordance that inserts a new row rather than mutating.

## 4. Download Report (PDF) — client-side, never uploaded

- Add `jspdf` dependency.
- New helper `src/lib/scanPdf.ts` → `downloadScanPdf({ query, scannedAt, results, scanType })` that builds the PDF in-browser and triggers a download. No `supabase.storage` call, no fetch.
- Add a "Download Report (PDF)" button at the top of scan-results sections in: `src/pages/LikenessMonitor.tsx`, `src/pages/Monitoring.tsx`, `src/pages/ClaimScanner.tsx`. Button is disabled until in-session results exist.
- PDF layout:
  - Header: "ClaimMyFace Scan Report" + scan date/time (locale string + ISO).
  - Disclaimer block (prominent, boxed, exact wording from the brief):
    > "This is an automated report of POTENTIAL matches identified by software. These results are unverified and may include false matches or unrelated parties. You must independently review each item before taking any action. This report does not constitute a legal determination of infringement.
    >
    > For your privacy, ClaimMyFace does NOT retain the findings of your scan. This data will disappear when you leave this page. If you want a record, download and save this PDF to your own device."
  - Results list: title, source domain, mention type, found date, URL. Thumbnails skipped to keep the PDF lightweight and avoid CORS issues.
  - Footer on every page: page N of M + reminder that the report is not stored server-side.

## Technical summary

- 1 migration: create `finding_actions` with grants and INSERT/SELECT-only RLS (deliberately no UPDATE/DELETE policy).
- 1 dependency: `jspdf`.
- New files: `src/lib/urlHash.ts`, `src/lib/scanPdf.ts`.
- Edits: `src/lib/scanReport.ts` (deprecate/no-op), `src/pages/Monitoring.tsx` (suppression set + Actions Taken tab + Download PDF), `src/pages/LikenessMonitor.tsx` + `src/pages/ClaimScanner.tsx` (Download PDF), `src/pages/ScanReports.tsx` (replace with "not stored" notice), `src/components/dashboard/DashboardLayout.tsx` (optional sidebar copy tweak), and the 3 action generator pages to insert `finding_actions` rows.
- Zero changes to scan ranking, edge functions, or visual design tokens.
