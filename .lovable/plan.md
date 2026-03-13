

# Plan: Replace Hero with AI-Generated Influencer/Creator Image

## What Changes

**File: `src/components/landing/HeroSection.tsx`**

1. **Remove the large Replica Shield logo** (lines 22-29) — the oversized logo at the top goes away entirely
2. **Remove the performers hero image** (lines 68-79) — the people image below the buttons goes away
3. **Add a single AI-generated hero image** at the top of the hero section, above the heading text. This image will depict a content creator / influencer scene: a couple of people filming with an iPhone, ring light visible, stylish studio-like setting — conveying a modern creator vibe
4. The image will be generated using the AI image generation API (Nano banana pro for higher quality) via a backend function, then stored in file storage so it loads as a static asset
5. Layout becomes: **Hero image → Heading → Description → Buttons → Stats**

## Technical Approach

- Create a backend function that generates the image using `google/gemini-3-pro-image-preview` with a prompt like: *"A cinematic, stylish photo of diverse young content creators in a modern studio. One person films with an iPhone on a tripod, another poses near a ring light. Warm, moody lighting with a dark background. Professional influencer aesthetic."*
- Upload the resulting image to file storage and save the public URL
- For now, we can generate it once and store it as a static asset in `src/assets/` to keep things simple and fast-loading
- Update `HeroSection.tsx` to use this single hero image with full-width styling and a slight gradient overlay at the bottom so the text reads well

## Files to Modify
- `src/components/landing/HeroSection.tsx` — restructure layout, swap images
- New asset: AI-generated hero image stored in `src/assets/`

