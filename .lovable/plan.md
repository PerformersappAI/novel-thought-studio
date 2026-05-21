# ClaimMyFace Security Audit

## 1. RLS policy review (all 24 tables)

Checked every table. **No `USING (true)` found anywhere.** Every user-data table scopes reads/writes to `auth.uid() = user_id` and admin overrides go through the `has_role()` security-definer function (no recursion risk).

Intentional public-read policies (not bugs, but confirm desired):
- `blog_posts` — `is_published = true` (public blog, OK)
- `subscription_plans` — `is_active = true` (public pricing, OK)
- `legal_documents` — `is_active = true`, authenticated only (OK)
- `profiles` — `slug IS NOT NULL AND account_type = 'performer'` exposes the **entire profiles row** to anonymous visitors, including `phone`, `legal_name`, `face_descriptor`, `voice_print_hash`, `voice_print_url`, `face_capture_*_url`, `admin_notes`, `external_risk_score`. **This is the single biggest finding.** Memory rule says "Never expose private PII or contact details on public profiles." → **FIX REQUIRED**: replace with a `public_profiles` view that whitelists only display columns (stage_name, bio, avatar_url, headshot_url, slug, union_affiliation, account_type), and restrict the table policy to owner+admin.

Biometric isolation proof: `registry_assets`, `identity_verifications`, `profiles` (face_descriptor/voice_print_*), `social_scans`, `possible_fake_profiles`, `likeness_scans`, `mentions` all enforce `auth.uid() = user_id` on SELECT/INSERT/UPDATE/DELETE. RLS is the only path — confirmed.

`user_roles` — INSERT/UPDATE/DELETE entirely blocked from clients (good, prevents privilege escalation). Roles can only be granted via migration / service role.

## 2. service_role usage in src/

`rg "service_role|SERVICE_ROLE" src/` → **0 hits.** Clean.

## 3. Edge functions and verify_jwt status

| Function | verify_jwt | In-code auth check | Risk |
|---|---|---|---|
| face-claim-wizard | true (config) | `getUser()` | OK |
| contract-checker | true (config) | none visible | OK (JWT enforced at gateway) |
| scan-performer | **false** (default) | `getUser()` returns 401 if missing | OK |
| actor-registry | **false** (default) | `getUser()` | OK |
| social-scan | **false** (default) | **none** | **FIX**: add `getUser()` / reject anon |
| likeness-scan | **false** (default) | **none** | **FIX**: add `getUser()` |
| likeness-image-scan | **false** (default) | **none** | **FIX**: add `getUser()` |
| action-assistant | **false** (default) | **none** | **FIX**: add `getUser()` (burns LOVABLE_API_KEY credits) |
| generate-contract | **false** (default) | **none** | **FIX**: add `getUser()` |
| generate-dmca | **false** (default) | **none** | **FIX**: add `getUser()` |
| create-checkout | **false** (default) | **none** | **FIX**: add `getUser()`; also accepts arbitrary `price_id` — pin to allowlisted plan IDs only |

## 4. Endpoints accepting biometric data without auth

- **face-claim-wizard** — authed ✅
- **likeness-image-scan** — accepts image URL/data, **no auth** → can be abused to run face matching against the CompreFace VPS as anonymous. **FIX**.
- **likeness-scan**, **social-scan** — no auth ✅ must fix.
- Direct uploads to storage buckets (`face-captures`, `voice-prints`, `verification-docs`) — buckets are private; client must be authenticated to upload. Confirm Storage RLS policies match (recommend explicit `(storage.foldername(name))[1] = auth.uid()::text` policies if not already in place).

## 5. Biometric isolation — proof

```sql
-- profiles (face_descriptor, voice_print_*)
USING (auth.uid() = user_id)  -- owner-only
-- registry_assets (asset files + hashes)
USING (auth.uid() = user_id)
-- identity_verifications (selfie + gov ID)
USING (auth.uid() = user_id)
```
All three rely solely on `auth.uid()`. No cross-user query path exists from a non-admin JWT.

## 6. Rate limiting

**None.** No rate-limit table, no edge-function middleware. `social-scan`, `likeness-scan`, `likeness-image-scan`, `action-assistant`, `generate-*` are all unlimited per user. Memory says "Global upload limit: 10/day" but it's client-side only (`useUploadLimit`) — trivially bypassed. **FIX**: add a `rate_limits` table (user_id, endpoint, window_start, count) + check in each scan function. Suggest 10/day for biometric scans, 30/day for AI generation.

## 7. Pin package versions

Every dep currently uses `^`. Will rewrite `package.json` removing all `^`/`~` prefixes, pinning to the currently-resolved versions in `bun.lockb`.

## 8. Dependency scan

`code--dependency_scan` → **No high or critical vulnerabilities.** Clean.

## 9. Stripe webhook verification

**There is no Stripe webhook function.** `create-checkout` creates Checkout Sessions but nothing listens for `checkout.session.completed` / `customer.subscription.*` → `user_subscriptions` table is never populated. **FIX**: add `stripe-webhook` edge function with:
- `verify_jwt = false` (Stripe doesn't send a JWT) — flagged ⚠️
- `stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)` for signature verification
- New secret `STRIPE_WEBHOOK_SECRET`
- Writes plan changes to `user_subscriptions` (need to relax RLS to allow service-role inserts only)

---

## Proposed fix plan (in order)

1. **DB migration**:
   - Drop the over-broad public profile policy. Create `public_profiles` view exposing only safe columns; grant SELECT to `anon, authenticated`.
   - Add `rate_limits` table (user_id, endpoint, window_start timestamptz, count int) with RLS owner-read + service-role write; helper SQL function `check_and_increment_rate_limit(endpoint text, max int, window interval)`.
   - Add `consent_log` table (user_id, consent_type enum: gdpr|ccpa|biometric|voice|face, granted bool, ip, user_agent, version, created_at) with owner-insert + owner/admin-read RLS, immutable.
   - Allow service-role inserts on `user_subscriptions` (for Stripe webhook).

2. **Edge functions** — add `getUser()` auth guard + `check_and_increment_rate_limit` to: `social-scan`, `likeness-scan`, `likeness-image-scan`, `action-assistant`, `generate-contract`, `generate-dmca`, `create-checkout`. Validate inputs with zod.

3. **create-checkout hardening**: allowlist `price_id` against `subscription_plans` rows, require auth, set `customer_email` from JWT.

4. **New `stripe-webhook` function** with signature verification. Add `STRIPE_WEBHOOK_SECRET` via add_secret.

5. **package.json**: pin every dependency to exact version (remove `^`/`~`).

6. **Consent UI hook**: wire the existing legal-gate to write to `consent_log` on accept.

## VPS / out-of-scope (Claude handles)

- CompreFace bind `127.0.0.1:8000`
- Resemblyzer Flask bind `127.0.0.1:5000`
- At-rest encryption (LUKS / pgcrypto for any biometric blobs stored server-side)
- The new `consent_log` table here satisfies the GDPR/CCPA logging requirement on the app side.

Approve to proceed, or tell me which steps to skip / reorder.
