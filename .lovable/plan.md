# Why no results appear

The "Request New Scan" button on the Monitoring dashboard calls the `actor-registry` edge function with `?action=scan`. That function forwards to `http://187.77.199.100:8001/scan` over plain HTTP from the edge runtime.

Edge function logs confirm:

```
Background actor scan failed: TypeError: error sending request for url
(http://187.77.199.100:8001/scan): tcp connect error: Connection timed out
```

So:
1. The VPS scan is never actually started — the request dies after ~120s.
2. The frontend still waits the full 3 minutes and then re-fetches `/mentions/{actor_id}` from `https://api.claimmyface.com`, which returns the same cached results as before (no new scan ran), so the user sees "no new results".

The mentions fetch itself works (we already migrated it to `https://api.claimmyface.com`). The bug is only in the scan-trigger path.

# Fix

## 1. Edge function `supabase/functions/actor-registry/index.ts`
- Replace `EXTERNAL_API = "http://187.77.199.100:8001"` with `https://api.claimmyface.com` so all VPS calls (`/register`, `/actor/:id`, `/scan`, `/mentions/:id`) go over HTTPS and actually reach the server.
- In the `action=scan` branch, send the user's `external_actor_id` in the POST body (`{ actor_id }`) so the VPS knows which performer to scan, instead of an empty POST.
- Keep the `EdgeRuntime.waitUntil` background pattern and the immediate `202 accepted` response — that part is correct.
- Log the VPS response status/body for easier debugging next time.

## 2. Frontend `src/pages/Monitoring.tsx` — `handleRequestScan`
- Surface real errors: if the edge function returns an error, show the toast and stop (currently `supabase.functions.invoke` errors are silently caught only for network errors; an `error` field in the response is ignored).
- Replace the hard-coded 3-minute `setTimeout` with a polling loop that re-fetches `/mentions/{actor_id}` every ~10s for up to 4 minutes, stopping early as soon as the result count increases. This way:
  - If the scan finishes early, results show immediately.
  - If it produces zero new items, the toast says "No new results found" instead of pretending success.
- Have `loadMentions` return the new count so the polling loop can compare against the previous count.

## 3. Verify
- Redeploy `actor-registry`, hit "Request New Scan", and check `supabase--edge_function_logs actor-registry` for a successful POST to `https://api.claimmyface.com/scan` (no more `Connection timed out`).
- Confirm new mentions appear in the dashboard tabs after the poll loop detects them.

No DB schema changes, no new secrets, no UI redesign — only the scan-trigger plumbing.
