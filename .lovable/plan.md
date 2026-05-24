## Why the dashboard shows all zeros

I confirmed the VPS API is healthy right now:

```
GET https://api.claimmyface.com/mentions/8e53f67f-5290-42ff-bab1-b14dd4d08605
→ 25+ mentions (YouTube, Yandex image matches, Instagram, TikTok, web)
CORS: access-control-allow-origin: *
```

So the data exists. The dashboard at `claimmyface.com` showing `0 / 0 / 0 / 0` means one of three things, and the current code hides which one it is:

1. **The published site is stale.** The custom domain `claimmyface.com` serves the last *Published* build, not the preview. Recent fixes to `Monitoring.tsx` only take effect after a republish.
2. **The browser fetch is failing silently.** In `loadMentions`, the external-mentions fetch is wrapped in `try { ... } catch (err) { console.warn(...) }`. If it throws (network blip, ad-blocker, etc.) the user sees "No results yet" with zero feedback.
3. **The logged-in user's `external_actor_id` is different** from the hardcoded fallback `8e53f67f-...`, and their actual VPS scan returned 0 mentions. Right now the UI cannot tell you which actor_id was queried.

## Fix

### 1. Republish so the custom domain gets the latest code
Trigger Publish so `claimmyface.com` serves the current `Monitoring.tsx`. This alone may resolve the screenshot.

### 2. Make `loadMentions` loud instead of silent (`src/pages/Monitoring.tsx`)
- Show a toast on fetch failure ("Could not reach scanner — {error}") instead of only `console.warn`.
- Log the resolved `externalActorId`, the HTTP status, and the parsed mentions count so we can see in the browser console exactly which actor_id was hit and how many rows came back.
- If the API responds 200 but with `mentions: []`, show an informational toast: "Scanner returned 0 results for actor {id} — run a scan."
- Add a small debug line under the header (only visible in dev / when `?debug=1`) showing `actor_id = …, fetched = N`.

### 3. Stop relying on a hardcoded fallback actor_id
Right now if `profile.external_actor_id` is null, the code falls back to `8e53f67f-...` — which is one specific user's data. For any other user this either shows someone else's results or hides the real problem. Change the fallback to:
- If `profile.external_actor_id` is missing, do NOT fetch; show a one-time prompt "Your account isn't linked to the scanner yet — click Request New Scan to register."
- Keep the hardcoded id only behind an explicit dev override (`?actor=...` query param).

### 4. Verify
- Open `/monitoring` in preview, confirm console shows `actor_id = ..., fetched = 25+`.
- Confirm the four cards render the YouTube / Yandex / Instagram / TikTok rows from the live API.
- Republish; reload `claimmyface.com/monitoring`; confirm same.
- Force a fetch failure (DevTools → block `api.claimmyface.com`) and confirm a destructive toast appears instead of silent zeros.

No backend, schema, or edge function changes — this is frontend visibility only. The data is already there; we just need the UI to either show it or tell you exactly why it can't.
