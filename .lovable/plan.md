## Problem

The dashboard / Monitoring page show garbage results (microsoft.com, senate.gov, dictionaries, Prince William, single-letter "W" pages, congress.gov, etc.) because mentions are coming from an **external scanner API** (`http://187.77.199.100:8001/mentions/{actor_id}`) proxied by the `actor-registry` edge function. The relevance filter we previously added to `likeness-scan` is irrelevant — that function isn't what feeds the UI.

## Fix

Add a server-side relevance filter inside `actor-registry`'s `get_mentions` handler. Drop any mention that fails ALL of:

1. URL or title contains the performer's full name (case-insensitive, accepting both "Will Roberts" and "will-roberts" / "will_roberts" / "willroberts")
2. URL or title matches any AKA / stage name on file
3. Domain is on an entertainment/casting/social allowlist (youtube.com, instagram.com, tiktok.com, facebook.com, twitter.com, x.com, imdb.com, backstage.com, castingnetworks.com, actorsaccess.com, spotlight.com, mandy.com, linkedin.com, vimeo.com)

Additionally, hard-block a noise denylist regardless of URL match: `microsoft.com`, `go.microsoft.com`, `support.microsoft.com`, `bing.com`, `*.gov`, `*dictionary*`, `wikihow.com`, `wikipedia.org`, `7esl.com`, `whatsapp.com`, `bill.com`, `legilist.com`, `govtrack.us`, `slate.com` (when no name match), royal-family tabloid tags, `wmagazine.com`, `pagesix.com/tag/*`.

Also add a name-shape guard: if the URL path or title contains the full name only as a single-letter substring ("W", "w-", "/w/"), reject.

## Implementation

Edit only `supabase/functions/actor-registry/index.ts`, inside the `get_mentions` block (lines ~149-178):

1. After fetching the actor's profile, also select `full_name, stage_name, legal_name` from `profiles`.
2. Build `nameTokens` = lowercased variants of full name (with spaces, hyphens, underscores, no-spaces) plus stage/legal name when set, filtering out tokens shorter than 4 chars.
3. Define `ALLOWED_DOMAINS` set and `BLOCKED_DOMAINS` regex list.
4. Filter `mentionsList`:
   - Reject if hostname matches blocked list.
   - Accept if hostname in allowed set AND (URL path or title contains any nameToken) — for social media we still want a name match to avoid noise like `facebook.com/wmagazine`.
   - For other domains: accept only if URL path or title contains a nameToken.
5. Return filtered list in same shape (`{ mentions: [...] }`).
6. Add a log line: `console.log("Filtered N→M mentions for tokens", nameTokens)` for debugging.

## Out of scope

- No DB schema changes.
- No frontend changes.
- Not touching `likeness-scan` / `social-scan` (already done in earlier turns).
- Not touching the external API itself (we don't control it).

## Files

- `supabase/functions/actor-registry/index.ts` (single edit + redeploy)
