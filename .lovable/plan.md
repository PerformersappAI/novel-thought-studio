

## Plan: Add a Featured "Replica Shield Registry" Section to the Landing Page

### What
Add a new prominent section between the TrustSection and PricingSection on the landing page. It will showcase the core registry features (identity registration, violation reporting, protection certificates, public profiles) as a grid of styled cards with icons, plus a bold CTA button linking to `/signup`.

### Changes

**1. Create `src/components/landing/RegistryFeatures.tsx`**
- New section component with a heading like "Your Digital Identity, Protected"
- 4-column (2 on mobile) feature card grid:
  - **Register Your Likeness** — icon: Fingerprint, links to `/signup`
  - **Monitor & Report** — icon: Shield, links to `/dashboard/violations`
  - **Protection Certificates** — icon: FileText, links to `/dashboard/certificates`
  - **Public Verified Profile** — icon: User, links to `/performer/:slug` concept
- Each card: glass-card styling, crimson icon badge, title, short description, arrow indicator
- Bottom CTA: large crimson button "Start Protecting Your Identity" linking to `/signup`
- Matches existing design system: `glass-card`, `font-display`, `font-body`, crimson/gold accents, motion animations

**2. Update `src/pages/Index.tsx`**
- Import and add `<RegistryFeatures />` between `<TrustSection />` and `<PricingSection />`

No backend changes, no route changes, no functionality changes.

