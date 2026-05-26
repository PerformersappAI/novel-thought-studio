## Three new features for ClaimMyFace

### Feature 1 — Invisible Image Watermark
- Add a client-side LSB steganography utility (`src/lib/stegoWatermark.ts`) that embeds/extracts a JSON payload (`certificateId`, `stageName`, `registrationDate`, `issuer: "ClaimMyFace.com"`) into PNG pixel data via canvas. No external library needed (keeps it dependency-free and runs in-browser).
- Update headshot upload flow (in `OnboardingFaceCapture` / `PerformerProfileTab`) to embed the watermark before uploading the PNG to the `headshots` bucket.
- Add a **"Download Protected Headshot"** button on the profile/certificate card that downloads the watermarked PNG.
- New public page `/verify-image` (route + `PublicVerifyImage.tsx`): drag-drop an image, decode the watermark, look up the certificate in `credentials`, show the owner + verified badge or "No watermark found."

### Feature 2 — Biometric Consent Gate
- DB migration: add `consent_given boolean default false`, `consent_date timestamptz` to `profiles`.
- New `BiometricConsentModal` component (two required checkboxes + "Agree & Start Scanning"). Stores `consent_given=true` + `consent_date=now()`.
- Wrap scanner entrypoints (`LikenessMonitor`, `Monitoring`, `ClaimScanner`) so they check `profile.consent_given` on mount; if missing, show modal and block scan buttons. Settings page gets a "Revoke biometric consent" toggle.

### Feature 3 — Post-Registration Action Checklist
- DB migration: new `identity_checklist` table (`user_id`, `item_key text`, `completed_at timestamptz`) with RLS (user owns rows).
- New page `/dashboard/secure-checklist` (`SecureChecklist.tsx`) — dark cinematic style, progress bar at top (X of 10), 10 items with checkbox + description + Learn More link. Item 1 ("Register your face") is pre-checked and locked. Items link to existing tools (`/dashboard/trademark`, `/dashboard/dmca`, `/dashboard/ai-rights`, `/dashboard/voice` etc.) or external resources (USPTO, copyright.gov, Google Alerts).
- Add nav item in `DashboardLayout`. Redirect from `OnboardingComplete` "Next" CTA to this checklist.

### Technical notes
- Stego: LSB on RGB channels of a canvas-rendered PNG; payload prefixed with 32-bit length + magic bytes `CMF1`. Lossless PNG only (warn on JPEG re-encode).
- Consent gate: simple guard hook `useBiometricConsent()` returning `{ consented, requireConsent() }`.
- Checklist items stored by `item_key` string; UI defines metadata (title/desc/link) statically.
