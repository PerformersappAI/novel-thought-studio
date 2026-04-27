## Rebuild `/dashboard` — Protection Status Page

Replace the current stat-cards + recent-assets layout in `src/pages/PerformerDashboard.tsx` with a single guided, scrollable status page. Sidebar and other dashboard pages stay reachable directly via URL but are removed from the sidebar nav so the dashboard becomes one journey. All Supabase, auth, Stripe, and routing remain untouched.

### Page structure (top → bottom)

**1. Greeting + Protection Score**
- “Hey {firstName}. Your face is claimed.” / “Here’s your protection status.”
- Full-width crimson gradient card with big % number, label, progress bar, helper text.
- Score logic (0–100):
  - Profile complete (legal_name + stage_name + phone + performance_type): +25
  - Face captured (`profiles.face_registered_at` set): +25
  - Certificate downloaded (localStorage flag `cmf_cert_downloaded` OR a row in `certificates`): +20
  - Monitoring active (active row in `user_subscriptions` OR localStorage `cmf_monitoring_basic` flag from onboarding): +30

**2. ✅ What You’ve Done**
- Green check cards for completed items only; incomplete items shown muted/grayed.
- Items: Face Registered (`CMF-…` + date), Identity Verified (from `identity_verifications.status = approved`), Certificate Issued (from `certificates`), Profile Complete.

**3. → Your Next Steps**
- Crimson action cards for each incomplete item with title, one-sentence copy, single CTA:
  - Download Your Certificate → `/dashboard/certificate`
  - Activate Monitoring → `/onboarding/monitoring`
  - Add Your Voice Sample → `/dashboard/assets` (placeholder; existing assets page accepts uploads)
  - Share Your Verified Badge → `/dashboard/certificate` (badge lives there)

**4. 🔴 Alerts**
- Pulls latest `likeness_scans` results (top 3). If none → green calm card “No alerts. We’re watching.”
- Each alert: platform name, plain-English description, date, “See Details →” opens a modal (Dialog) with raw match info; “Dismiss” hides locally.

**5. Your Registered Face**
- 3 face capture thumbnails from `profiles.face_capture_{front,left,right}_url` (signed URLs, 10-min, same pattern as `PerformerProfileTab`).
- Shows registry ID + timestamp + outline button “Update Face Registration” → `/onboarding/face-capture`.
- If not yet registered: dashed empty state with “Start Face Registration” CTA.

**6. Your Profile**
- Summary card: stage name / legal name, union, performance type, primary market, IMDb + social links (clickable with link icon), discoverability switch (writes `profiles.is_discoverable`), “Edit Profile →” outline button → `/dashboard/profile`.

**7. Take Action**
- Vertical list of 5 cards (NOT a grid):
  1. File a DMCA Takedown → `/dashboard/action/dmca`
  2. Check a Contract → `/tools/contract-checker`
  3. Generate Cease & Desist → `/dashboard/action/cease-desist`
  4. Build Your Media Kit → `/tools/media-kit`
  5. Download My Certificate → `/dashboard/certificate`

**Permanent Trust Footer**
- Reuse `DashboardTrustFooter` with the expanded copy from the prompt (update the component’s text to the new wording).

### Sidebar / nav cleanup
- In `DashboardLayout.tsx`, simplify the `performerLinks` to only: Overview, Tools, Education, Sign Out. (Profile / Assets / Certificate / Verification / Scan / Monitoring / Violations / Settings stay reachable by direct URL and via cards on the dashboard, but the side tabs are removed per “no tabs” rule.)
- Producer/admin links unchanged.
- Top bar remains.

### Files

- **Edit** `src/pages/PerformerDashboard.tsx` — full rewrite of the page body (keep the file, keep `DashboardLayout` wrapper).
- **Edit** `src/components/dashboard/DashboardLayout.tsx` — trim `performerLinks` only.
- **Edit** `src/components/dashboard/DashboardTrustFooter.tsx` — update copy to new Security Promise wording.
- **Create** `src/components/dashboard/ProtectionScoreCard.tsx` — score gradient card.
- **Create** `src/components/dashboard/CompletedSteps.tsx`, `NextSteps.tsx`, `AlertsSection.tsx`, `FacePanel.tsx`, `ProfileSummary.tsx`, `TakeActionList.tsx` — section components, kept small.

### Out of scope (not changed)
- Routing in `App.tsx`, auth, Supabase schema, Stripe.
- Onboarding flow, homepage, `/dashboard/profile`, `/dashboard/certificate`, `/dashboard/monitoring`, tools pages.
- No deletion of existing pages — only the sidebar tabs to them are removed.

After implementation I’ll screenshot the dashboard top-to-bottom for review.
