## Goal
Replace the current `src/pages/Monitoring.tsx` with a full Pro Shield identity-monitoring dashboard. UI only — no backend scanning yet. Pulls existing counts from Supabase where already available; everything else uses well-structured mock data so the scanner can wire in later.

Additive only. Existing routes, sidebar links, free/pro detection (`useIsPro`), and stat queries are preserved.

---

## File changes

### 1. `src/pages/Monitoring.tsx` (rewrite)
Keep the existing data-loading block (`useIsPro`, stats query, last scan) and rebuild the layout.

**Header**
- Title: "Your Identity. Everywhere." (Playfair, large)
- Subtitle: "We scan the web, social media, casting platforms, ad networks, and deepfake databases for unauthorized use of your face, voice, and name."
- Right side: Pro Shield Active / Free badge (existing logic)

**Stats bar (4 cards)** — reuse existing card style
- Faces Monitored (existing `stats.facesMonitored`)
- Platforms Scanned (static `18`)
- Alerts This Month (existing `stats.alerts`)
- Takedowns Filed (existing `stats.takedowns`)

**Scan Coverage Grid** — three labeled sections in one card
- Section 1 "Social & Video Platforms": TikTok, Instagram, Facebook, YouTube, X / Twitter, LinkedIn, Pinterest
- Section 2 "Web & Commercial Use": Google Image Search, Bing Image Search, Stock Sites, Ad Networks, Fiverr / Freelance, Content Platforms (discreet label for adult), News & Articles, Casting Platforms
- Section 3 "Deepfake & AI Detection": Reality Defender Deepfake Scan, AI Voice Clone Detection, AI Avatar Detection
- Each item: lucide icon + name + green pulse status dot + "Active" label
- Layout: responsive grid (2 cols mobile → 4 cols tablet → 6 cols desktop)

**Identity Footprint Panel** — new card
- Filter bar: All | Social Media | Casting Platforms | Deepfakes | Ads & Commercial | News & Articles | Fake Profiles | Voice Clones (using shadcn `Tabs` or pill buttons)
- Search input (filters by platform / finding text)
- Table (using existing `@/components/ui/table`): Platform | What Was Found | Date Discovered | Status | Action
- Status pills color-coded:
  - 🔴 New Alert (crimson)
  - 🟡 Under Review (gold)
  - 🔵 Takedown Filed (blue)
  - ✅ Resolved (emerald)
  - ℹ️ Informational (muted)
- Action column: dropdown (`DropdownMenu`) — "This is fine — Dismiss", "File DMCA Notice", "Send Cease & Desist", "Report to Platform", "Request Removal"
- Row click opens Alert Detail Modal
- Data source: tries to flatten existing `likeness_scans.results` (already done); falls back to ~8 mock findings covering all finding types listed in the spec so the UI is fully demonstrable

**Alert Detail Modal** (shadcn `Dialog`)
- Placeholder thumbnail (gray box with platform icon)
- Full URL (truncated, copy button)
- Platform, Date first detected, Date last seen
- AI confidence score: "95% match to your registered face" (progress bar)
- Recommended action callout
- One-tap action buttons row (DMCA / C&D / Report / Dismiss) — file DMCA links to `/tools/dmca`, C&D to `/tools/contracts`

**Guided Tour** — new lightweight component `src/components/monitoring/MonitoringTour.tsx`
- No new dependency. Custom spotlight: fixed full-screen overlay with a cutout positioned via `getBoundingClientRect()` of refs passed in
- 5 steps with the exact copy from the spec, pointing at: coverage grid, footprint table, first alert row, filter bar, action button
- "Got It →" closes; "Skip tour" link
- First-visit detection via `localStorage.getItem('cmf_monitoring_tour_done')`
- Manual re-launch button in header ("Take the tour")

**Free-tier lock**
- If `!isPro`: render full layout but overlay coverage grid + footprint table with a frosted blur, lock icon, headline "Pro Shield monitors 20+ platforms 24/7 for your face, voice, and name. Free accounts show a preview only.", show 3 blurred sample finding rows, crimson CTA "Unlock Full Monitoring — Upgrade to Pro Shield →" linking to `/#pricing`
- Stats bar and header stay visible

**Empty state** (Pro user, zero findings)
- Centered animated radar pulse (CSS `animate-ping` rings in crimson) above text
- Copy: "Your first scan is running. We'll notify you when we find results — usually within 24 hours."
- Below: still render the Scan Coverage Grid so they see what's being checked

**Quick Actions card** — keep existing one (DMCA / C&D / Report) at the bottom

### 2. `src/components/monitoring/MonitoringTour.tsx` (new)
- Props: `steps: { ref: RefObject<HTMLElement>; title: string; body: string }[]`, `open`, `onClose`
- Renders fixed overlay + tooltip near current step's element; advances on "Next"; final step shows "Got It →"

### 3. `src/components/monitoring/findings.ts` (new)
- Exports `FINDING_TYPES`, `STATUS_STYLES`, `MOCK_FINDINGS` (8–10 items covering every category) so the page stays clean

---

## Out of scope
- Real scanning backend / new edge functions
- DB schema changes (existing `likeness_scans.results` JSON shape is reused; mock data fills the gaps until the scanner produces richer rows)
- Wiring "File DMCA" etc. to actually create records — buttons navigate to existing tools pages
- Changes to sidebar, pricing page, or any other route

## Design system
- Background `#0B1526`, action `#C41230` (crimson), accent `#D4A843` (gold), Playfair headings, DM Sans body, glass cards (`glass-card border-border/30`) — matches existing Monitoring page
