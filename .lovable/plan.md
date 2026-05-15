## Goal

Make every surface tell the same story in plain words:

> **You own your face, voice, and name. Help us map your identity — we'll scan the internet and social media for anyone misusing it with AI or deepfakes.**

No new pages or visual redesign. Pure copy + section-heading reframing on existing screens, with an empowering / active tone.

## The two-part mental model (used everywhere)

1. **Your Identity Map** — what we collect with your help: **Face & Photos · Voice · Videos · Names & Articles** (legal name, stage name, AKAs, press).
2. **The Scanner** — what we do with it: continuously search the web, social media (Instagram, TikTok, YouTube, Facebook), casting sites, and AI/deepfake hotspots for unauthorized use.

These two phrases become the spine of the copy on all four surfaces.

## Surfaces to update

### 1. Landing page

- **HeroSection**
  - Eyebrow: "Built for actors, performers, and anyone whose face, voice, or name can be cloned by AI."
  - H1: keep "My Face. My Claim." (brand line) — add a sub-headline directly under it: *"Map your identity. We'll watch the internet for it."*
  - Body paragraph rewritten: explain that you upload your face, voice, videos, and known names; we scan the web and social media for AI clones, deepfakes, fake profiles, and unauthorized use.
  - Primary CTA: "Start My Identity Map — Free"
  - Trust chips: "Face Mapped" · "Voice Mapped" · "Scanner Active"
- **HowItWorks / ThreeSteps**: rewrite the 3 steps as
  1. *Build your Identity Map* — face, voice, videos, names & articles.
  2. *We scan the web & social media* — Instagram, TikTok, YouTube, Facebook, news, casting sites, AI/deepfake sources.
  3. *You take action* — review matches, file takedowns, prove ownership.
- **WhyClaimMyFace**: reframe bullets around the AI/deepfake threat → identity map → active defense (empowering tone, no fearmongering).

### 2. Onboarding flow

Reframe each step's heading + intro paragraph so the user understands *why* they're giving us this data. No structural changes.

- **OnboardingWhy** — set up the whole "Identity Map" concept up front: "We're going to help you map four things — your face, your voice, your work, and your names. Then our scanner watches for them online."
- **OnboardingProfile** — "Add the names that identify you" (legal name, stage name, AKAs). Explain the scanner uses these as search terms.
- **OnboardingFaceCapture** — "Map your face." Explain it powers the image scanner that finds deepfakes and unauthorized photos.
- **OnboardingVoice** — "Map your voice." Explain it powers detection of voice clones.
- **OnboardingMonitoring** — frame as "Your scanner is now live" rather than a generic confirmation.

### 3. Performer Dashboard

- Page header / subtitle: "Your Identity Map & Scanner"
- Reword existing section titles only (no new cards):
  - "Identity Map" — groups what we have on you (face, voice, videos, names, assets).
  - "Scanner Activity" — groups recent findings, scans, alerts.
- Update empty states and helper microcopy to use the same vocabulary ("Add to your identity map", "Scanner is watching", etc.).
- Keep the existing "Scan Social Media" button label as-is or change to "Run Scanner Now".

### 4. Monitoring / scan results page

- Page title + intro: "The Scanner — what we found across the web and social media for your mapped identity."
- Tab/section labels reworded to match: *Web matches · Social profiles · Deepfakes & AI · Voice clones · Articles & news.*
- Empty states: "Your scanner is active. No matches yet for your mapped identity."
- Result cards: keep existing layout; just make sure the source-of-match line reads in the new vocabulary (e.g. "Matched against your **Voice Map**" / "Matched against your **Face Map**" / "Matched against your **Names & Articles**").

## Tone rules (apply everywhere)

- Empowering / active voice — *you own*, *you map*, *we watch*, *you take action*.
- Avoid "victim" framing or scare copy.
- Always pair the threat (AI, deepfakes, voice clones, impersonation) with the user's agency (map it, claim it, defend it).
- Keep brand line "My Face. My Claim." intact.

## Out of scope

- No new pages, no new components, no visual redesign.
- No backend, scanner logic, or schema changes — those already exist.
- No changes to pricing, legal, or admin surfaces.

## Files that will be edited (copy only)

```text
src/components/landing/HeroSection.tsx
src/components/landing/HowItWorks.tsx
src/components/landing/ThreeSteps.tsx
src/components/landing/WhyClaimMyFace.tsx
src/pages/OnboardingWhy.tsx
src/pages/OnboardingProfile.tsx
src/pages/OnboardingFaceCapture.tsx
src/pages/OnboardingVoice.tsx
src/pages/OnboardingMonitoring.tsx
src/pages/PerformerDashboard.tsx        (header + section titles + empty states only)
src/pages/Monitoring.tsx                (page title + tab labels + empty states only)
```

Memory will also be updated so future sessions default to the "Identity Map → Scanner" framing and empowering tone.
