

## Plan: Enlarge Hero Logos

**Two changes in `src/components/landing/HeroSection.tsx`:**

1. **Top logo (line 28):** Increase from `h-24 md:h-36` to `h-36 md:h-56` (~150% bigger)

2. **Performers hero image (lines 73-78):** Remove `max-w-md md:max-w-lg lg:max-w-xl` constraint and make it span the full width of the site. Move it outside the `max-w-4xl` container so it's not constrained, using `w-full` styling.

