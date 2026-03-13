

# Plan: Fix Logo Position, Add Brand Name to Navbar, Fix Step Icon Clipping

## 1. Move Logo Down to Knees/Shins (`HeroSection.tsx`)

The logo is currently at `bottom-[12%] right-[15%]` which places it near the woman's chest. The ring light is in the upper-right area of the image. The logo needs to go **below** the ring light, centered underneath it, down at the knee/shin level.

Change positioning to approximately `bottom-[2%] right-[18%]` — this pushes it much lower in the image, underneath the ring light and near her knees. Keep the same size (`w-64 md:w-80`).

## 2. Add "Replica Shield" Brand Text to Navbar (`Navbar.tsx`)

Add "Replica Shield" text in the navbar between "Tools" and "Login" (in the center-right area). Style it using the brand gradient colors (blue and gold from `text-gradient-blue` / `text-gradient-gold`) so "Replica" is blue and "Shield" is gold, matching the brand identity. Use `font-display font-bold`.

Position it as a centered element or between the left nav links and right auth buttons using a Link to `/`.

## 3. Fix Step 1 Icon Clipping (`HowItWorks.tsx`)

The step bar container has `overflow-x-auto` which clips the number badges that use `absolute -top-1 -right-1`. Fix by adding padding-top to the inner flex container (`pt-2`) so the badges have room and aren't clipped.

### Files to modify:
- `src/components/landing/HeroSection.tsx` — logo position
- `src/components/landing/Navbar.tsx` — add brand name
- `src/components/landing/HowItWorks.tsx` — fix clipping

