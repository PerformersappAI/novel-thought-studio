# Homepage Rebuild — claimmyface.com (root `/` only)

**Scope guarantee:** Only the homepage visual layout/content changes. Routing, auth, Supabase, Stripe, and all other pages stay untouched.

## 1. Navigation (`src/components/landing/Navbar.tsx`)
Simplify to 4 visible items + auth:
- Left: existing C-shield logo + "ClaimMyFace"
- Center: **How It Works** | **Pricing** | **Education** (drop Trust + Tools)
- Right: **Sign In** (outline) | **Claim My Face →** (crimson filled)
- Mobile sheet: same 3 links + Sign In + Claim My Face

Trust moves to footer-only. Tools stays accessible only inside the dashboard sidebar (already is — no change needed there).

## 2. Hero (`src/components/landing/HeroSection.tsx`)
- Pill badge unchanged: "THE PERFORMER STANDARD FOR FACE & LIKENESS PROTECTION"
- H1: "My Face." (white) / "My Claim." (gold gradient)
- Body: "The independent registry that proves you own your face — before someone else profits from it. Built for every performer, not just the famous ones."
- Primary CTA copy → **"Claim My Face — It's Free →"** (crimson)
- Secondary CTA: "See How It Works" → `#how-it-works`
- 3 trust chips below: ✓ Identity Verified | ✓ Face Registered | ✓ Legally Protected
- Right side: keep existing registry credential card (CMF ID, Assets Protected, Face Status: Claimed & Protected)
- Keep existing crimson stats bar: 10K+ / 52K / 100% / 24/7

## 3. NEW — "Three Steps. Total Protection." (`src/components/landing/ThreeSteps.tsx`)
Replaces the current 6-step `HowItWorks` on the homepage. Lives at anchor `#how-it-works`.
- H2: "Three Steps. Total Protection."
- Subhead: "From zero to legally protected in under 10 minutes."
- 3 cards (grid on desktop, stacked mobile), each with:
  - Large crimson numeral (1 / 2 / 3)
  - Lucide icon (UserSquare, ShieldCheck, Radar)
  - Title + description (exact copy from prompt)
  - Gold "→ You get:" outcome line
- Centered below: "Ready?" + crimson **Claim My Face — It's Free →** button

Existing `HowItWorks.tsx` file stays in repo (unused on homepage) so no other page breaks.

## 4. "Why ClaimMyFace?" (`src/components/landing/WhyClaimMyFace.tsx`)
Already 3 columns with Shield/Eye/Gavel. Update copy to exact prompt wording:
- "You Are the Original" — AI can clone your face from 3 photos. ClaimMyFace timestamps your registration so you have proof you came first.
- "We Watch So You Don't Have To" — We monitor 7 platforms and 20+ sources 24/7 for unauthorized use of your face, voice, and name.
- "From Alert to Action in Minutes" — When we find unauthorized use we generate your DMCA notice, cease-and-desist, and platform report automatically.

## 5. Trust Section (replace `src/components/landing/TrustSection.tsx` content)
Single full-width dark card with crimson border:
- Centered large shield icon
- H2: "Your Face Data Is Yours. Period."
- Body: "Everything you register is encrypted with AES-256, stored privately, and never sold, shared, or used to train AI. Ever. You can delete your account and all data at any time."
- 3 inline badges: 🔒 AES-256 Encrypted | 🛡️ SOC 2 Compliant | ✓ Never Sold or Shared

## 6. Footer (`src/components/landing/Footer.tsx`)
- Left: logo + "My Face. My Claim."
- Links row: How It Works | Pricing | Education | Trust | Privacy Policy | Terms of Service
- Right: "© 2026 ClaimMyFace / Roberts Entertainment / PerformersappAI"
- Bottom line: "Proud supporter of performer IP rights. Aligned with SAG-AFTRA AI protection principles."
- Keep the bold "Ready to Claim Your Face?" CTA section above the footer columns.

## 7. Page composition (`src/pages/Index.tsx`)
New order:
1. Navbar
2. NO FAKES announcement banner (keep existing)
3. HeroSection (with stats bar)
4. ThreeSteps (new) — anchor `#how-it-works`
5. WhyClaimMyFace (updated copy)
6. PricingSection (unchanged — anchor `#pricing`)
7. TrustSection (rebuilt as single dark card) — anchor `#trust`
8. Footer (rebuilt links row)

`RegistryFeatures` is removed from the homepage composition (file kept in repo).

## Files touched
- **Edit:** `src/pages/Index.tsx`, `src/components/landing/Navbar.tsx`, `src/components/landing/HeroSection.tsx`, `src/components/landing/WhyClaimMyFace.tsx`, `src/components/landing/TrustSection.tsx`, `src/components/landing/Footer.tsx`
- **Create:** `src/components/landing/ThreeSteps.tsx`
- **Untouched:** all routes, auth, Supabase, Stripe, dashboard, tools, every other page

## QA before handoff
After build, navigate to `/` in the preview and capture full-page screenshots (top → bottom) at desktop and mobile widths, then return them here for your review before Prompt 2.
