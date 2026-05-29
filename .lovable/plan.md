## Problem

`will@wildwestperformer.com` sees an edge-function error on the Scanner because their profile has no `external_actor_id`. The Scanner page falls back to a hardcoded `DEFAULT_ACTOR_ID` that happens to be Will Roberts' actor, and `mentions-proxy` (correctly) rejects the cross-user request with 403. Will Roberts' account works only because the hardcoded fallback happens to match his own actor.

## Fix

### 1. `src/pages/Monitoring.tsx`
- Remove the hardcoded `DEFAULT_ACTOR_ID` constant — it leaks another user's id into every account.
- Change `actorId` state to `string | null` (initial `null`).
- In the resolve effect:
  - Read `?actor=` override only if present.
  - Otherwise use the logged-in user's `profiles.external_actor_id`.
  - If neither exists, set `actorId = null` and skip the `mentions-proxy` call.
- In `fetchMentions`, bail out early when `id` is null: set `loading=false`, leave mentions empty, and surface a friendly status (not an error).
- Render an empty-state card when `actorId` is null:
  - Title: "Scanner not set up yet"
  - Body: "We need to register your identity with the scanner before we can watch the web for you."
  - CTA button → `/onboarding/headshot` (or `/dashboard` — whichever is the existing registration flow that calls `actor-registry?action=register`).
- Disable the Refresh button when `actorId` is null.

### 2. `src/components/dashboard/ScanStatusCards.tsx` (drive-by safety)
- Same pattern: if the user has no `external_actor_id`, don't pass someone else's id around. Just render zeroes / the existing empty state rather than calling the actor endpoint with a wrong id. (Only touch if it currently uses a similar hardcoded fallback — verify before editing.)

## What I'm explicitly NOT changing

- `mentions-proxy` — its 403 guard is correct and should stay.
- `actor-registry` — fine.
- The Will Roberts account behavior — unchanged; he has a real `external_actor_id`.
- No DB migration needed.

## Verification

After the fix:
- Log in as `will@wildwestperformer.com` → Scanner shows the "not set up yet" empty state with a CTA, no edge-function error.
- Log in as `will@actorwillroberts.com` → Scanner loads mentions exactly as before.
