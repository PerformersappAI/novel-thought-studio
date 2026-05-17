# Adapt new ClaimMyFace spec into existing app

Keep the current Lovable Cloud backend, auth, and VPS scanner (:8001) as-is. Layer the requested spec elements on top of existing pages — no rip-and-replace.

## What changes

### 1. Landing page (`src/pages/Index.tsx`)
- Update hero copy: headline "Your Identity. Protected.", subhead "AI-powered detection of unauthorized use of your face, voice, and writing.", tagline strip "Prevention is cheaper than control."
- Primary CTA: "Register Your Identity — $29.99 one-time" → routes to existing `/signup` (Stripe wiring out of scope here, just visual + link).
- Add a 4-card protections strip: Photo Detection, Voice Detection, Writing Protection, Risk Score. Reuse existing design tokens (navy bg, crimson/gold accents) — no new palette.
- Leave existing sections (How It Works, Pricing, Footer) intact below.

### 2. Registration (`src/pages/Register.tsx` or `Signup.tsx`)
- Add optional **Writing Sample** textarea (for screenwriters/authors) — saved to profile as a new field via migration (`writing_sample text`).
- Add optional **AKA Names** input (comma-separated) — stored as `aka_names text[]` on profiles.
- Do NOT POST to `187.77.199.100:8000/register` — current app uses Lovable Cloud signup. The user confirmed "adapt", so we keep current registration flow and just add fields.

### 3. Dashboard (`src/pages/PerformerDashboard.tsx` + Monitoring)
- Add a top **Protection Score** badge (large number, color-coded 0–20 green / 21–50 yellow / 51+ red) driven by current `mentions` counts.
- Add a **4-panel detection strip** above existing content: Photo / Voice / Writing / Overall Threats, each showing live counts from the `mentions` table filtered by `mention_type` (image, voice/audio, writing/article, threat/deepfake).
- These overlap with the recent "coverage strip" — replace that strip with this clickable version that jumps to the matching Monitoring tab.

### 4. Monitoring results table
- Already exists. Add a compact **table view toggle** with columns: Type · Title · URL · Status · Found Date, status color-coded per spec (legitimate=green, threat=red, review=yellow, voice_match=orange, writing_review=yellow).

### 5. New page: Protection Status Report (`/dashboard/report`)
- Two sections sourced from current `mentions` table:
  - ✅ **Known / Legitimate Presence** — status contains "legitimate"
  - 🚨 **Needs Your Review** — status contains "threat", "review", or "match", with the prompt "Did you authorize this? If not, this may be unauthorized use of your identity."
- Add route + nav link.

### 6. Out of scope (explicitly skipped)
- Foreign Supabase project (`pozwmfmqapizeoctuais`) and its anon key — ignored. Existing Lovable Cloud DB stays.
- Scan API on port `:8000/register` and `:8000/scan` — current app uses `:8001`. We keep `:8001` (existing actor-registry/social-scan functions).
- $29.99 Stripe payment integration — just the CTA copy/visual; no checkout work unless you ask.

## Technical notes
- Migration: `ALTER TABLE profiles ADD COLUMN writing_sample text, ADD COLUMN aka_names text[];`
- New status color map lives in `src/components/monitoring/findings.ts` (or a new helper).
- New route added in `src/App.tsx`: `/dashboard/report` → `ProtectionReport.tsx` (ProtectedRoute).
- Protection Score formula: `min(100, threats*15 + reviews*5)`; >50 red, 20–50 yellow, else green.

## Files touched
- `src/pages/Index.tsx` (hero + CTA + 4 protections)
- `src/pages/Register.tsx` (new optional fields)
- `src/pages/PerformerDashboard.tsx` (score badge + 4-panel)
- `src/pages/Monitoring.tsx` (table view + status colors)
- `src/pages/ProtectionReport.tsx` (new)
- `src/App.tsx` (route)
- `supabase/migrations/*` (profile columns)

Confirm and I'll implement.
