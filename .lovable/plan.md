# Why the page looks the way it does

I checked the VPS scanner directly. It currently returns **50 mentions** for your actor: 31 `image`, 16 `web`, 3 `deepfake`. That's the entire universe of what the scanner found — no Instagram, no Google, no TikTok, no YouTube. So three different things are going on:

1. **Identity Online only shows Bing** — All 31 `image` results from the VPS are bing.com image-search URLs. The scanner isn't currently returning Google or Instagram results at all. This is a backend/scanner limitation, not a UI bug.
2. **Web tab shows 0** — The VPS returned 16 web results, but their titles say "Web result for **William** Roberts". Our name filter only accepts the full joined name (`will roberts`, `will-roberts`, etc.) and rejects last-name-only matches, so "William Roberts" gets filtered out as "not you".
3. **No threats** — The 3 deepfake items the VPS returned are generic AI news (Elon Musk, Mastercard, ABC News) with no mention of you. The filter correctly hides them.
4. **Social Scan returns nothing** — The button calls the `social-scan` edge function (Apify-based, separate from the VPS scanner). It searches Instagram/TikTok/LinkedIn but only reports a count toast. If `APIFY_TOKEN` is missing or the actors return empty, the user just sees "Found 0 profiles" with no explanation.

# What I'll change (frontend only)

### 1. Relax name matching so name variants surface
In `src/pages/Monitoring.tsx`, update `buildNameTokens` so multi-word names also emit each part ≥4 chars as a standalone token (so `roberts` is accepted). That immediately makes the 16 "William Roberts" web results appear under "Web" instead of being hidden.

### 2. Make the Web tab honest when nothing matches you
When `identityFindings` for Web is 0 but there are unfiltered VPS web results, show a small note: "N web results returned but none clearly matched your name — [show all]" with a toggle to bypass the name filter.

### 3. Surface why Social Scan came back empty
In `src/components/monitoring/ImpersonatorDetection.tsx`, expand the completion toast:
- If `data?.saved === 0` and `data?.searched > 0`: "Searched Instagram, TikTok, LinkedIn — no profiles using your name found."
- If the edge function errors with a missing-credential message: "Social scanner isn't configured yet — contact support to enable Instagram/TikTok scanning."
Also log the raw response so we can diagnose.

### 4. Add a one-line scanner status under each section
- Identity Online: "Last scan returned 31 image, 16 web, 0 video results from the public web."
- Potential Threats: "Last scan checked deepfake databases and AI news feeds — 0 matched your name."

This makes it obvious the scanner ran and explains the zeros, instead of an empty box.

# What this won't fix (and why)

- **Getting Instagram/Google results into "Your Identity Online"** requires the VPS scanner at `187.77.199.100:8001` to actually return `social_instagram` / Google-sourced results. Right now it doesn't. That's a scanner-side change, not something I can fix in the app.
- **Better deepfake matching** also requires the VPS scanner to return items actually about you, not generic AI news.

Want me to also draft a short note describing what to ask the VPS scanner team to add (Google web, Instagram, YouTube), so you can forward it?

# Files touched

- `src/pages/Monitoring.tsx` — relax name tokens, add "show unfiltered" toggle, section status line
- `src/components/monitoring/ImpersonatorDetection.tsx` — better social-scan result messaging
