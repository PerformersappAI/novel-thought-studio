

# Plan: Restructure Hero — Image on Top, Content Below, Logo Inside Image

## What Changes (`src/components/landing/HeroSection.tsx`)

The current layout uses the hero image as a subtle full-bleed background with content centered on top. The user wants a **split layout** instead:

1. **Top half: Visible hero image** — The hero-creators image displayed prominently at the top of the section, taking up roughly the top 50-60% of the viewport. Higher opacity (~50-60%) so the image is clearly visible. The logo sits **inside** this image area in the bottom-right corner, as if it's part of the photo.

2. **Bottom half: Text content below** — "Protect Your Likeness" heading, description, buttons, and stats all sit **below** the image, not on top of it. This block is pushed down so the image gets more visual space.

3. **Remove the top-right corner logo** — The logo moves from `top-6 right-6` to be positioned inside the image area (e.g., bottom-right of the image), so it looks like a watermark/brand mark that's part of the photo itself.

4. **Gradient fade** — Only a bottom gradient on the image so it fades into the dark background where the text starts. Remove the heavy multi-directional gradients that were making it invisible.

### Layout structure:
```text
┌─────────────────────────────┐
│                             │
│   Hero Image (prominent)    │
│                      [logo] │  ← logo in corner of image
│   ~~gradient fade~~         │
├─────────────────────────────┤
│  Protect Your Likeness.     │
│  Register. Verify. Shield.  │
│  [description text]         │
│  [Register] [Sign In]       │
│  10K+ | 52K | 100% | 24/7  │
└─────────────────────────────┘
```

### Technical approach:
- Change from `flex items-center justify-center` to a vertical column layout
- Image becomes a `relative` block at the top (~55vh height) with `object-cover`, opacity ~50-55%
- Logo positioned `absolute bottom-4 right-4` **inside** the image wrapper
- Only one gradient: bottom fade from background color into the image
- Text content section below with padding, no longer absolutely positioned over image

### File to modify:
- `src/components/landing/HeroSection.tsx`

