

# Plan: Move Logo to Bottom-Right Under Ring Light

## Change in `src/components/landing/HeroSection.tsx`

Move the logo from its current centered position (`left-1/2 -translate-x-1/2 bottom-[15%]`) to the bottom-right area of the hero image, positioning it underneath the ring light near the woman's knees.

New positioning: `right-[15%] bottom-[12%]` — remove the centering transforms. Keep the same size (`w-64 md:w-80`) and opacity.

