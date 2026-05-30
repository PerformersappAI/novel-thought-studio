# ClaimMyFace — Legal Risk Reduction Update

Copy, policy, and storage changes only. No functional changes.

## 1. Terms of Service & Likeness Agreement copy

Update fallback strings in `src/components/LegalAgreementGate.tsx` and insert a new active version into `legal_documents` (type `terms` and `likeness_rights`) so the live ToS reflects:

- **Photo upload license** — By uploading a headshot, the user grants ClaimMyFace a limited, revocable license to store, hash, and submit that image to reverse image search and monitoring services on their behalf.
- **DMCA / takedown clause** — User warrants they own (or have rights to) any image uploaded and is solely responsible for unauthorized uploads. Takedown contact: `dmca@claimmyface.com` (also link in footer).
- **No biometric processing** — Explicitly state ClaimMyFace does not perform facial recognition or store biometric identifiers; photos are used only for visual similarity matching.

Likeness Rights Agreement reworded to drop "biometric data" language; replaced with "uploaded photos and voice samples."

## 2. Remove biometric / face-scan language

Replace "face scan", "facial recognition", "biometric", "face capture" → "headshot upload" / "photo monitoring" across:

- `src/locales/{en,de,es,fr,it,ja,ko,pt,zh}.json`
- `src/components/BiometricConsentModal.tsx` → rename copy to "Photo Upload Consent" (keep file/component name to avoid functional changes; internal-only)
- `src/components/LegalAgreementGate.tsx`
- `src/components/landing/PricingSection.tsx`, `src/pages/Index.tsx`
- `src/pages/OnboardingProfile.tsx`, `OnboardingVoice.tsx`, `PerformerDashboard.tsx`, `PerformerProfileTab.tsx`, `LikenessMonitor.tsx`
- `src/components/dashboard/{FacePanel,ScanStatusCards}.tsx`, `src/components/likeness/ScanHistory.tsx`
- `src/lib/likenessReport.ts`, `src/hooks/useBiometricConsent.tsx` (copy strings only)

Footer / DMCA link added in `src/components/landing/Footer.tsx`.

## 3. Private headshots bucket + signed URLs

Currently `headshots` bucket is **public**. Migration:

- `UPDATE storage.buckets SET public = false WHERE id = 'headshots';`
- Add storage RLS `SELECT` policy: owner-only (`auth.uid()::text = (storage.foldername(name))[1]`). Existing INSERT/UPDATE/DELETE owner policies stay.

Code changes — replace `getPublicUrl` with `createSignedUrl` (e.g. 1-hour expiry) and refresh on load:

- `src/pages/OnboardingHeadshot.tsx` (upload + display)
- `src/pages/OnboardingProfile.tsx`, `PerformerProfileTab.tsx`, `Welcome.tsx`, `SecureChecklist.tsx`
- `src/components/dashboard/FacePanel.tsx` consumers that pass `headshot_url`

`profiles.headshot_url` will store the storage **path** (`{user_id}/{file}`) rather than a public URL; components resolve to signed URL at render time via a small helper `src/lib/headshotUrl.ts`.

## 4. RLS confirmation

`profiles` table already has owner-scoped RLS (verified in schema). No new public table named `photos` exists — headshots live in `profiles.headshot_url` + storage. Confirm + document in security memory; no policy changes needed beyond the storage SELECT policy in section 3.

## Technical summary

- 1 migration: bucket privacy + storage SELECT policy + insert new `legal_documents` rows
- 1 new helper: `src/lib/headshotUrl.ts` (`getSignedHeadshotUrl(path)`)
- ~15 files touched for copy/signed-url swaps
- No schema changes to existing tables, no functional behavior changes
