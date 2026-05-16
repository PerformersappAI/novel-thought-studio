## What's actually happening

From the screenshots and code in `src/pages/Monitoring.tsx`:

1. **"Your Identity Online"** is working — 11 results, all bing.com Image-search URLs for "Will Roberts". The reason they look thin is they're raw Bing search-result URLs (no clean title, no thumbnail), and the filter currently requires the URL/title to contain your name — which it does, so they show.

2. **"Potential Threats"** is showing 3 generic news articles (Florida Phoenix Elon Musk story, Mastercard CFO, ABC News election deepfakes). These come back from the VPS with `mention_type: "deepfake"` but they're general news *about* deepfakes, not deepfakes *of you*. Right now the threats section passes everything through with **no name-match filter**, which is why none of them are about you.

3. **The "View details" preview is the giant white screen.** It uses `https://image.thum.io/get/width/600/crop/400/<url>` to render a screenshot of the source page inside the dialog. For Bing image-search URLs that service returns a blank/white page, and the `<img>` is set to `aspect-video` inside a `max-w-lg` dialog — so you get a big white box. The fallback only triggers on a network error, not on a blank-but-200 response.

4. **The scan buttons** do call `actor-registry?action=scan` and then re-fetch mentions. The reason "nothing happens visually" is the VPS just re-returns the same 50 mentions you already see — there are no new results to add. Not a bug, just no signal.

## Plan

All changes are UI-only in `src/pages/Monitoring.tsx` (and a small tweak to the detail dialog). No edge function or schema changes.

### 1. Apply the name-match filter to threats too
Currently `identityFindings` requires `hasNameMatch`, but `threatFindings` does not. Add the same `hasNameMatch(f)` requirement to the threats filter so generic deepfake/AI news about other people stops appearing. The threats count badge and per-tab counts get the same treatment.

If a user has zero threat matches (the likely case here), the empty state already reads "No threats detected" — that's the correct message.

### 2. Replace the giant white preview with a compact, in-app source preview
In the detail dialog (lines ~912–941):
- Drop the big `aspect-video` thum.io screenshot.
- Replace with a compact preview card: favicon + page title + clean domain + short URL, plus the `Source ↗` button that opens in a new tab (kept since cross-origin iframes from Bing/Google/news sites won't render anyway).
- For results that **do** have a `thumbnailUrl` from the VPS (image results), show that thumbnail at a small fixed height (~160px, `object-contain`) instead of a full-width screenshot — this keeps it inside the dialog and shows the actual image when one is available.
- Add a clear "Is this you?" action row at the bottom of the dialog with the same 👍 / 👎 buttons that exist in the list, so the user can confirm/deny right from the preview without going back.

### 3. Make scan buttons give honest feedback
When `runScan` finishes and the new mention count equals the previous count, change the toast from "Scan complete — all results loaded" to something like "Scan complete — no new results since last check (showing N existing)". This is a 5-line change in `runScan` after `loadMentions()`.

### Out of scope (not changing)
- The actor-registry edge function — it already passes through unchanged per your last instruction.
- Colors/branding.
- The Bing image-result quality itself — that's what the VPS returns; cleaning those titles would be a separate task.

### Files touched
- `src/pages/Monitoring.tsx` (threat filter + detail dialog preview + scan toast)
