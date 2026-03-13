

## Plan: Three Updates — Navbar Brand, How It Works Steps, and Likeness Monitoring Feature

### 1. Navbar Brand — "Replica Shield" Styling

**Problem**: The "Replica Shield" text in the navbar looks small, cheap, and too boldly colored.

**Fix** in `src/components/landing/Navbar.tsx`:
- Increase font size from `text-lg` to `text-2xl` or `text-xl`
- Reduce opacity/saturation — instead of bright gradient text, use a more muted/faded treatment (e.g., `opacity-70` or softer color classes)
- Keep it elegant and understated — more luxury brand feel

### 2. How It Works Step Icons — Clean Up Visual Artifacts

**Problem**: The step circles in `HowItWorks.tsx` have visible borders/squares and overly aggressive glow effects, especially the number badges.

**Fix** in `src/components/landing/HowItWorks.tsx`:
- Remove the `border` and `border-2` from the step circles for inactive and active states
- Remove the `bg-secondary/50` background on inactive steps — make them transparent
- Remove or simplify the number badge (`absolute -top-1 -right-1` span) — just show the icon with a subtle color change when active
- Keep the icon color glow effect (text color change) but drop the `shadow-[...]` box-shadow glow and the pulsing overlay div
- Result: clean icons that light up in color when selected, no circles/borders/boxes

### 3. Digital Likeness Monitoring / Scanner Feature

**Problem**: User wants performers to check if their images/likeness appear elsewhere on the web.

**Approach**: This requires reverse image search or web scraping capabilities. There are a few realistic options:

- **Option A — Firecrawl + AI**: Use Firecrawl connector (already available) to search the web for a performer's name/likeness mentions. This finds text-based references but not visual matches.
- **Option B — Google Vision API / Reverse Image Search API**: Integrate a third-party reverse image search service (like Google Cloud Vision, TinEye API, or similar) via an edge function. This would let users upload an image and find visual matches across the web.
- **Option C — Manual monitoring dashboard**: Build a UI where users can submit URLs or search queries, and the system logs/tracks findings over time — a monitoring log table in the database.

**Recommendation**: Start with Option C (monitoring dashboard + manual search) combined with Option A (Firecrawl web search for name-based mentions). Option B (visual reverse image search) requires a paid API key from TinEye or similar.

**Implementation would include**:
- New database table: `likeness_scans` (id, user_id, query, results, scanned_at)
- New edge function to run Firecrawl searches for a performer's name
- New page/component in the dashboard for "Likeness Monitor" where users can trigger scans and view results
- This requires the Firecrawl connector to be connected

### Technical Details

| Change | Files |
|--------|-------|
| Navbar brand styling | `src/components/landing/Navbar.tsx` |
| Step icons cleanup | `src/components/landing/HowItWorks.tsx` |
| Monitoring feature | New DB table, new edge function, new dashboard page |

