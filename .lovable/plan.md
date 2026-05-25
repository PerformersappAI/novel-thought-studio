## Problem

On iOS Safari (`claimmyface.com`), the Monitoring page shows "Load failed" and `0 mentions`. The endpoint `https://api.claimmyface.com/mentions/{actorId}` works (returns 47 mentions with proper CORS). "Load failed" is the generic message iOS Safari throws when a direct `fetch` to a third-party host fails for reasons like cert chain issues, HTTP/1.1 quirks, or transient network refusal — it is browser/network-side, not a code bug. Desktop works; mobile Safari intermittently does not.

## Fix

Add a server-side proxy and fall back to it when the direct fetch fails. This makes the request go through our own Supabase domain, which iOS Safari already trusts for the rest of the app.

### 1. New edge function `mentions-proxy`
- Path: `supabase/functions/mentions-proxy/index.ts`
- Public (no JWT) — add `verify_jwt = false` block in `supabase/config.toml`.
- Accepts `?actor=<id>`, server-side fetches `https://api.claimmyface.com/mentions/{actor}`, returns the JSON verbatim with proper CORS headers.
- Short timeout + clear error JSON on upstream failure.

### 2. Update `src/pages/Monitoring.tsx`
- Keep direct `fetch` to `api.claimmyface.com` as the primary attempt (fast path for desktop and most mobile).
- On any failure (network error, non-OK, parse error), retry via `supabase.functions.invoke('mentions-proxy', { body: { actor: id } })` (or a GET through the functions URL).
- Only show "Load failed" if BOTH attempts fail. Otherwise display the proxied data normally.
- Do not zero out the counts until both attempts have completed.

### 3. No other changes
- No scan triggering, no other endpoints, no UI restructure. Sections and styling stay as-is.

## Expected result
On iOS Safari at `claimmyface.com/monitoring`, when the direct call fails, the page transparently retries via the Lovable Cloud proxy and shows the 47 mentions grouped into Photo Matches / Social Media / Web Mentions. No more "Load failed" / "0 mentions" on mobile.
