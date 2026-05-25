## Plan

Fix the Monitoring dashboard so it does only the requested thing on page load: fetch the live mentions endpoint and display returned data immediately.

### What I’ll change
1. **Remove page-load scan behavior**
   - Keep page load to a direct `GET https://api.claimmyface.com/mentions/8e53f67f-5290-42ff-bab1-b14dd4d08605` only.
   - Do not call `actor-registry`, `scan`, or any backend function during load.
   - Do not show a scanning state on load.

2. **Fix the “Load failed” mobile issue**
   - Add a browser-safe fallback: try direct fetch first, then retry through Vite’s dev/proxy path or a no-cache request pattern if Safari rejects the first request.
   - Stop clearing the UI to zero before the fetch completes, so a transient fetch failure does not display fake zero counts.

3. **Parse the real API response shape**
   - The endpoint currently returns `{ mentions, count }`, not just `{ results, count }`.
   - Support both `results` and `mentions` arrays safely.

4. **Display only the required groups**
   - `image_yandex` → **Photo Matches**
   - `social_instagram`, `social_tiktok`, `youtube` → **Social Media**
   - `web`, `news` → **Web Mentions**
   - Counts will be derived from the fetched rows, not from scan state.

5. **Disable scan-triggering from this dashboard path**
   - The button will reload fetched mentions, not start a scan, unless you later ask to restore manual scanning separately.

### Expected result
On `/monitoring`, the dashboard immediately fetches the live endpoint and shows the 47 current mentions grouped into Photo Matches, Social Media, and Web Mentions; no scan animation, no 2–3 minute wait, no backend function call.