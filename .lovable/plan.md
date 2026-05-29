## The bug

`src/components/dashboard/ScanStatusCards.tsx` builds a direct REST call to `/rest/v1/scan_runs` and appends a cache-buster query param:

```ts
const params = new URLSearchParams({
  select: "...",
  order: "started_at.desc",
  limit: "50",
  _: Date.now().toString(),   // ← THE BUG
});
```

PostgREST treats every unknown query param as a column filter. It tries to parse `_=1780077268951` as a filter on column `_` and expects the value to start with an operator (`eq.`, `gt.`, …). A bare number triggers exactly:

> PGRST100: failed to parse filter ... unexpected '1' expecting 'not' or operator (eq, gt, ...)

The `_` was only a cache-buster. It's redundant — the same request already sets `cache: "no-store"` plus `Cache-Control: no-cache` and `Pragma: no-cache` headers.

The same pattern is also used on line 128 for the `actor-registry` edge function call. That endpoint isn't PostgREST so it doesn't 400, but it's still dead weight; safe to drop for consistency.

## Change

**`src/components/dashboard/ScanStatusCards.tsx`**

Before (line 100–105):
```ts
const params = new URLSearchParams({
  select: "id,scanner_name,actor_id,started_at,finished_at,items_scanned,threats_found,legitimate_found,review_found,status,notes",
  order: "started_at.desc",
  limit: "50",
  _: Date.now().toString(),
});
```

After:
```ts
const params = new URLSearchParams({
  select: "id,scanner_name,actor_id,started_at,finished_at,items_scanned,threats_found,legitimate_found,review_found,status,notes",
  order: "started_at.desc",
  limit: "50",
});
```

Before (line 128):
```ts
const functionParams = new URLSearchParams({ action: "get_scan_runs", _: Date.now().toString() });
```

After:
```ts
const functionParams = new URLSearchParams({ action: "get_scan_runs" });
```

No other `scan_runs` query in the codebase has this issue (verified: `DetectionPanels.tsx` uses the supabase-js client cleanly; the edge function `actor-registry/index.ts` builds its own params server-side without a cache-buster).
