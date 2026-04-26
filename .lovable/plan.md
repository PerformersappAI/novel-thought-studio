## Plan: Build Out the Education Section

### Approach
Currently `/education` is wired to Supabase's empty `blog_posts` table, so it shows "No posts yet." Rather than seeding a DB that lacks fields for read-time, FAQs, structured sections, and related articles, I'll build a **static content registry in code**. This is faster, version-controlled, and supports the rich article template you described. The existing Supabase blog admin remains untouched (additive only).

### Changes

**1. Create `src/data/educationArticles.ts`**
- Typed article registry exporting all 12 articles with: `slug`, `title`, `subtitle`, `category` (Legal / Platform News / How-To / Industry), `readTime`, `author` ("ReplicaShield Legal Team"), `publishDate`, `excerpt`, `sections[]` (heading + body paragraphs), `faqs[]` (3–5 Q&A per article), `relatedSlugs[]`.
- All 12 articles populated with substantive placeholder content (NO FAKES Act, ELVIS Act, DMCA takedown, state right-of-publicity, McConaughey trademark, SAG-AFTRA AI, deepfake advertising, personality theft, AI consent clauses, post-mortem likeness, voice cloning protection, digital replica guide).

**2. Rewrite `src/pages/Education.tsx`** (Hub Index)
- Hero: "Education" heading + tagline.
- Search bar (filters by title/excerpt, client-side).
- Filter tabs: All / Legal / Platform News / How-To / Industry.
- Responsive article cards grid (1 / 2 / 3 cols): category badge, read time (clock icon), title, 2-sentence excerpt, "Read More →" link.
- Glass-card styling, crimson accents on hover.
- Source data from `educationArticles.ts` (no Supabase call).

**3. Rewrite `src/pages/BlogPost.tsx`** (Article Template)
- Lookup article by slug from registry; 404-style fallback if missing.
- Hero: category badge, title, subtitle, meta row (author, publish date, read time).
- 2-column layout on `lg+`: main article body (left) + sticky sidebar CTA card (right).
  - Body: dark navy bg, light prose, section headers (`h2`) in crimson `font-display`.
  - Sidebar CTA: shield icon, "Protect Your Likeness" headline, short blurb, crimson "Register Free →" button → `/signup`. Sticky on desktop, inline on mobile.
- FAQ accordion (Radix `Accordion`) at bottom — 3–5 Q&A from the article's `faqs[]`.
- Related Articles section: 3 cards from `relatedSlugs[]`.
- Back link to `/education`.

**4. No changes to:**
- Routing (`/education` and `/education/:slug` already exist in `App.tsx`).
- Navbar Education link (already routes to `/education`).
- Auth, pricing, dashboard, Supabase tables, RLS, or any other functionality.
- Existing `AdminBlog.tsx` — left as-is for future DB-backed posts.

### Files
- **Create**: `src/data/educationArticles.ts`
- **Rewrite**: `src/pages/Education.tsx`, `src/pages/BlogPost.tsx`
