# Rebuild Onboarding — 4-Step Guided Flow

Convert the current 3-step onboarding (Profile → Face Capture → Complete) into a guided **4-step** flow with a new Certificate step and a new Monitoring step, plus a polished Completion screen. Existing auth, Supabase, Stripe, and routing stay intact — this is purely additive plus copy/layout updates.

## New flow

```text
/onboarding/profile      Step 1 of 4 — Build Your Profile
/onboarding/face-capture Step 2 of 4 — Capture Your Face
/onboarding/certified    Step 3 of 4 — Get Your Certificate   (NEW)
/onboarding/monitoring   Step 4 of 4 — Turn On Monitoring     (NEW)
/onboarding/complete     Final screen — "Your Face Is Now Claimed"
```

## Global rules (apply to every step)

- Progress bar shows **Step X of 4**; active = crimson, completed = green check, upcoming = muted.
- **Back button** on every step except Step 1 (uses `navigate(-1)` / explicit prev route).
- Trust banner ("🔒 Your data is yours. Encrypted, private, never sold. Ever.") at top of every step.
- Mobile-first single column, large tap targets, dark navy / crimson palette.

## Step-by-step changes

### Step 1 — Profile (`OnboardingProfile.tsx`)
- Update `OnboardingProgress` to support 4 steps (Profile / Face / Certificate / Monitoring).
- Page title "Step 1 of 4 — Build Your Profile" with 2-minute subtext.
- Reorder fields to match spec order; make **Phone required**, ensure Stage Name is required (already is). All dropdowns required.
- Bio textarea keeps live 250 char counter.
- Headshot label updated to "Your Professional Headshot — JPG or PNG".
- Smart link inputs (already implemented via `LinkPreviewInput`) confirmed for IMDb / Instagram / TikTok / YouTube; add a 5th for **Personal website**.
- Discoverability toggle wrapped in crimson-bordered card, OFF by default, with the new copy.
- Security block above CTA. CTA: "Save & Continue to Face Capture →" — navigates to `/onboarding/face-capture`.

### Step 2 — Face Capture (`OnboardingFaceCapture.tsx`)
- Update progress to step 2 of 4. Add **Back** button to Step 1.
- Existing pre-camera trust card, 3-photo flow, on-device face-api descriptor, and review screen remain.
- Final CTA after the 3 captures changes from "complete" to **"These Look Good — Continue →"** which navigates to `/onboarding/certified` (instead of `/onboarding/complete`).
- Persist `face_registered_at` and descriptor as today.

### Step 3 — Certified (NEW: `OnboardingCertified.tsx`)
- New page + route `/onboarding/certified` (Protected).
- Generates / loads the user's Registry ID (`CMF-2026-XXXXX`) — store on profile if not already (uses existing `registry_id` column if present, otherwise generated client-side and saved).
- Certificate preview card: shield logo, "Face Registration Certificate", performer name (stage + legal), Registry ID, registration date/time, asset count, "Identity Verified ✓", legal statement, three seal badges.
- Two CTAs:
  - **Download My Certificate PDF →** — reuses existing `Certificate` page PDF logic (`/dashboard/certificate`) or directly calls the existing PDF generator.
  - **Skip for now — Continue →** (outline) — both navigate to `/onboarding/monitoring`.
- Footnote: "You can download your certificate anytime from your dashboard."

### Step 4 — Monitoring (NEW: `OnboardingMonitoring.tsx`)
- New page + route `/onboarding/monitoring` (Protected).
- Page title and subtext per spec.
- Coverage grid: 3 rows (Social / Web / Industry) of platform pills with lucide icons.
- Two large plan cards:
  - **Basic — Free** (gray border): outline CTA "Continue with Basic →" → marks profile `subscription_tier='free'` and navigates to `/onboarding/complete`.
  - **Pro Shield — $79/mo** (crimson border, Recommended badge): crimson CTA "Activate Pro Shield →" → calls existing Stripe checkout edge function/flow used on `/pricing` for the Pro tier; on success returns to `/onboarding/complete`. If Stripe Pro tier isn't wired yet, fall back to navigating to `/pricing?tier=pro` (no Stripe changes required).
- Footer text: "You can upgrade to Pro Shield anytime from your dashboard."

### Completion (`OnboardingComplete.tsx`)
- Update progress component to reflect 4-of-4 done (all green checks).
- Animated crimson shield + checkmark, "Your Face Is Now Claimed." / "You are protected."
- Summary panel: Registry ID, registration date, **Protection level** (reads tier from profile: Basic or Pro Shield), 3 face capture thumbnails (already implemented).
- Single full-width crimson CTA: **"Go to My Dashboard →"** → `/dashboard`. Keep optional secondary "Download Certificate" link below.

## Shared component updates

- **`OnboardingProgress.tsx`** — extend `step` to `1 | 2 | 3 | 4`, add Certificate + Monitoring entries, keep "Step X of 4 — Label" copy. Add a `done` mode to render all-green when shown on completion.
- Add a small reusable **`OnboardingBackButton`** (or inline) used on Steps 2–4.

## Routing (`src/App.tsx`)

Add two protected routes:

```tsx
<Route path="/onboarding/certified" element={<ProtectedRoute><OnboardingCertified /></ProtectedRoute>} />
<Route path="/onboarding/monitoring" element={<ProtectedRoute><OnboardingMonitoring /></ProtectedRoute>} />
```

Existing onboarding routes stay.

## Files

**Create**
- `src/pages/OnboardingCertified.tsx`
- `src/pages/OnboardingMonitoring.tsx`

**Edit**
- `src/components/onboarding/OnboardingProgress.tsx` (4-step support)
- `src/pages/OnboardingProfile.tsx` (reorder, required phone, website link, copy)
- `src/pages/OnboardingFaceCapture.tsx` (back button, navigate to `/onboarding/certified`, step=2)
- `src/pages/OnboardingComplete.tsx` (4/4 progress, protection level, single primary CTA)
- `src/App.tsx` (two new routes)

## Out of scope / preserved

- No DB schema changes required (uses existing `profiles` columns: registry id if present, `face_registered_at`, `subscription_tier`).
- No changes to face-api capture pipeline, Supabase storage buckets, RLS, auth, or any non-onboarding pages.
- Stripe: reuses whatever Pro Shield checkout is already wired on `/pricing`. If not yet wired for Pro, the button defers to `/pricing` (no Stripe code is modified or removed).
