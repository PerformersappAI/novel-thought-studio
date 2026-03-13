

# Plan: Seamless Full-Width Hero with Logo Overlay

## Changes to `src/components/landing/HeroSection.tsx`

1. **Full-width background image**: Move the hero-creators image to be an `absolute inset-0` background covering the entire section, with `object-cover` so it spans edge-to-edge seamlessly
2. **Subtle opacity**: Set the image to ~30-40% opacity so it blends into the dark background and doesn't overpower the text — feels atmospheric, not "stuck on"
3. **Heavy gradient overlays**: Add multiple gradient layers — bottom-to-top and a radial vignette — so the image fades naturally into the dark background on all edges
4. **Logo in corner**: Place the uploaded Replica Shield logo (the gold/black one) in the top-left or top-right corner of the hero section, sized modestly (around 120-160px wide), with slight opacity so it feels integrated
5. **Remove the boxed image container**: Delete the current rounded-2xl bordered image block — the image becomes the ambient background instead

### Copy the uploaded logo
- Copy `user-uploads://9AE73F14-...` to `src/assets/replica-shield-logo.png`
- Import it in HeroSection and position it `absolute top-6 right-6` with controlled width

### Layout result
The section will feel like: a moody, atmospheric full-bleed photo with the content (heading, description, buttons, stats) floating on top, logo subtly in the corner. The image fades out naturally on all sides.

### Files
- **Modify**: `src/components/landing/HeroSection.tsx`
- **Copy**: uploaded logo to `src/assets/replica-shield-logo.png`

