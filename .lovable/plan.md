

## Plan: NVIDIA-Style Homepage Redesign

Redesign the entire homepage with a dark, cinematic, NVIDIA-inspired aesthetic. The key shift: from the current blue/gold palette to a black + electric green (#76B900) accent with dramatic geometric grid overlays.

---

### 1. Color & CSS Updates (`src/index.css`)

- Change `--background` to near-black (`0 0% 4%`)
- Change `--primary` to NVIDIA green (`80 100% 36%` ~ #76B900)
- Keep `--electric-blue` as a secondary glow option
- Replace `.grid-pattern` with a new diagonal geometric mesh pattern (CSS-only using repeating-linear-gradient at 45deg with thin glowing green/blue lines — dimensional, not flat)
- Add `.glow-green` utility for green box-shadow glow
- Add `.text-gradient-green` utility
- Update `.glass-card` to use slightly lighter charcoal with green-tinted border glow on hover

### 2. Hero Section Redesign (`src/components/landing/HeroSection.tsx`)

Full rewrite of the hero layout:

- **Full-viewport dark section** with the diagonal geometric grid overlay covering the entire hero
- **Left side**: Large bold headline in white ("Your Digital Double, Ready to Perform" or similar), lighter-weight subheadline, bright green CTA button ("Register Your Likeness"), secondary outline button
- **Right side**: A CSS-clipped hexagon/diamond shape containing the `hero-creators.jpg` image, with a glowing green/blue border effect around the shape to suggest "digital replica" energy
- **Stats bar** stays at the bottom but uses green accents for the stat values
- Remove the Replica Shield logo from the hero (it's in the navbar already)
- Add subtle animated particle/glow effects using framer-motion (floating dots or pulsing grid nodes)

### 3. Navbar Updates (`src/components/landing/Navbar.tsx`)

- Update the "Get Started" button to use the new green accent color
- Keep the muted brand text style but ensure it reads well against the darker background

### 4. Section Updates

**HowItWorks.tsx**:
- Swap primary blue icon glows to green
- Keep the stepped interaction pattern, just recolor accents

**TrustSection.tsx**:
- Recolor icon backgrounds and glows from blue to green
- Darken the gradient overlay

**PricingSection.tsx**:
- "Most Popular" badge and highlighted card border use green
- CTA buttons use green accent

**Footer.tsx**:
- Minor: update shield icon color to green

### 5. Tailwind Config (`tailwind.config.ts`)

- Add `"nvidia-green"` color token
- Keep existing structure, just add the new color

### Files Changed
- `src/index.css` — new color vars, grid pattern, glow utilities
- `src/components/landing/HeroSection.tsx` — full redesign
- `src/components/landing/Navbar.tsx` — button color
- `src/components/landing/HowItWorks.tsx` — accent recolor
- `src/components/landing/TrustSection.tsx` — accent recolor
- `src/components/landing/PricingSection.tsx` — accent recolor
- `src/components/landing/Footer.tsx` — icon color
- `tailwind.config.ts` — nvidia-green token

