# Homepage Simplification Plan

## Goal
Strip the homepage down to a cleaner funnel: Hero → How It Works → What You Get → Pricing → FAQ → Footer.

## What to keep (exactly as-is)
- Hero section with badge image, headline, paragraph, and HeroFreeScanWidget
- Pricing section
- FAQ section
- Footer

## What to remove
1. "4 core protections strip" — the 8 emoji icon cards (Photo Detection, Video Detection, etc.) inside the hero
2. Big "Register Your Identity — $19.99 one-time + $9.99/mo" CTA banner inside the hero
3. Entire "Your Complete Protection Suite" section with the 8 glass-card feature cards

## What to add
### New "How It Works" section (below hero)
Title: "How It Works"
Three numbered cards, side-by-side on desktop / stacked on mobile, using existing `glass-card` styling and gold accent (`text-gradient-gold`).

1. **Make Your Profile** — "Sign up and fill out your details — your name, headshot, and the info our system needs to know who to look for."
2. **See Where You're At** — "Run a scan and get your results: where your face and likeness appear online, and your risk picture."
3. **Go After It** — "Use the action plan — education plus the tools to respond: cease-and-desist letters, DMCA takedowns, and incident reports."

### New "What You Get" strip (below How It Works)
One compact row, max 4 items, plain text, no cards:
"Face Certificate · DMCA Generator · Identity Statement · Risk Score"

## Files to edit
- `src/pages/Index.tsx` — only file touched

## Technical notes
- Use existing `glass-card`, `text-gradient-gold`, and `font-display`/`font-body` classes already in use on the page.
- Reuse existing `motion.div` with `whileInView` pattern for scroll-triggered fade-in animations.
- No new dependencies or backend changes needed.