

## Plan: Enhance Likeness Scanner + Build Out AI Tools

Two main workstreads:

---

### 1. Enhance Likeness Scanner — Add context fields alongside image upload

**Problem**: Image scan returns generic visual matches with no filtering. Users need to provide identifying info to narrow results.

**Changes**:

**LikenessMonitor.tsx** — Add input fields next to the image upload:
- Full name field
- Stage name / alias field (optional)
- Brief description field (e.g. "brunette actress, appeared in XYZ")
- Pass these as additional params to the edge function

**likeness-image-scan edge function** — Use the text context to filter results:
- Accept `name`, `stageName`, `description` params alongside `imageBase64`
- After getting Vision API results, use the text context to score/filter: check if page titles or URLs contain the person's name
- Also add a secondary Firecrawl text search using the name to cross-reference with the image results
- Combine and deduplicate, prioritizing results that match both image AND name
- Store the query as the person's name instead of generic "Image scan"

---

### 2. Build Out AI Tools — Make them clickable with functional pages

Each tool card on `/tools` will link to its own page with a working UI. Here's what each tool does:

**A. Contract Generator** (`/tools/contracts`)
- Form: parties involved, usage type (commercial/editorial/AI training), duration, territory, compensation
- Uses Lovable AI (gemini-2.5-flash) via an edge function to generate contract text
- Preview and download as PDF-style formatted view

**B. Invoice Builder** (`/tools/invoices`)
- Form: client info, line items (service, rate, quantity), payment terms, due date
- Generates a clean invoice preview
- No AI needed — straightforward form-to-template

**C. Digital Likeness Scanner** — links to existing `/dashboard/monitor`

**D. Avatar Creator** (`/tools/avatar`)
- Placeholder UI with upload area explaining the concept
- Mark as "Beta" — actual AI avatar generation is complex; start with a UI shell that explains the feature

**E. Media Kit Builder** (`/tools/media-kit`)
- Form: name, bio, headshot upload, social links, credits/roles, skills
- Generates a shareable media kit page preview
- Uses existing profile data if logged in

**F. DMCA Takedown Assistant** (`/tools/dmca`)
- Form: your name, infringing URL, description of original work, ownership proof
- Uses Lovable AI to generate a proper DMCA takedown notice letter
- Copy-to-clipboard or download

**File changes**:
- **Tools.tsx**: Update cards to be clickable links, remove "Coming Soon" badges for built tools
- **New pages**: `ContractGenerator.tsx`, `InvoiceBuilder.tsx`, `MediaKitBuilder.tsx`, `DMCATakedown.tsx`, `AvatarCreator.tsx`
- **New edge functions**: `generate-contract/index.ts`, `generate-dmca/index.ts` (both use Lovable AI)
- **App.tsx**: Add routes for each tool page

---

### Technical Details

- AI-powered tools (Contract Generator, DMCA Assistant) will use Lovable AI's `google/gemini-2.5-flash` model via edge functions — no API key needed
- Invoice Builder and Media Kit Builder are template-based, no AI required
- Avatar Creator starts as a UI placeholder (Beta)
- All tool pages use `Navbar` + `Footer` layout (public pages, no auth required to view — but auth required to save/generate)

