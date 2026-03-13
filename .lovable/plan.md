

## Plan: Hero Spacing, Logo Size, and Navbar Overhaul

### 1. Hero Logo — 200% larger, tighten gap to heading
**File: `src/components/landing/HeroSection.tsx`**
- Change logo from `h-36 md:h-56` to `h-72 md:h-[28rem]` (roughly 200% increase)
- Reduce `mb-8` on the logo to `mb-2` to close the gap to the heading
- Reduce `mt-12` on the performers image to `mt-4` to decrease gap below buttons
- Reduce `mb-10` on the description paragraph to `mb-6`

### 2. Navbar — Remove logo, add menu links
**File: `src/components/landing/Navbar.tsx`**
- Remove the logo image from the left side entirely
- Replace with horizontal menu links: How It Works, Pricing, Trust (anchor links to landing page sections)
- Keep Login + Get Started buttons on the right
- For logged-in users: Dashboard link + Sign Out
- Add a mobile hamburger menu with Sheet component for small screens

### Technical Details
- Navbar menu items will use anchor scroll links (`#how-it-works`, `#pricing`, `#trust`) pointing to section IDs on the landing page
- Will need to add `id` attributes to `HowItWorks`, `PricingSection`, and `TrustSection` components
- Mobile menu uses the existing Sheet UI component

