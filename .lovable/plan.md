

## Plan: ReplicaShield Full Platform Build — Gap Analysis & Incremental Implementation

This is a large-scale build. Here's what already exists and what needs to be added, organized by phase.

---

### What Already Exists

- Auth with email/password, performer/admin roles
- Performer dashboard with stats, sidebar nav
- Asset upload/registry with hash, type badges, gallery
- Identity verification (ID upload, admin review)
- Admin panel (review queue, user management, legal docs, settings)
- Certificates generation on asset approval
- Likeness scanner (image + name-based search)
- AI tools (Contract Generator, Invoice Builder, DMCA Assistant, Media Kit, Avatar Creator)
- Profiles, audit_log, blog_posts, subscription_plans tables
- Supabase Storage buckets (assets, verification-docs, certificates)

---

### Phase 1 — Gaps to Fill

**A. Add "producer" role + onboarding fields**
- Add `producer` to the `app_role` enum
- Add columns to `profiles`: `stage_name`, `union_affiliation` (SAG-AFTRA/AEA/non-union), `account_type` (performer/producer), `company_name`, `production_type`
- Update signup to collect: stage name, union affiliation, account type selector
- Producer-specific onboarding collects company name & production type

**B. Legal agreement acceptance gate**
- Create `legal_agreements` table: id, user_id, document_id, document_version, accepted_at, ip_address
- After signup, show TOS + Likeness Rights Agreement with checkbox before dashboard access
- ProtectedRoute checks for agreement acceptance

**C. Tier-gated upload limits**
- Add logic in MyAssets to check user's subscription tier and enforce: Free=3, Pro=25, Studio=unlimited

**D. Stripe billing**
- Enable Stripe integration
- Create checkout flow for Pro ($19/mo) and Studio ($49/mo)
- Webhook updates subscription status on payment

---

### Phase 2 — Platform Hardening

**A. Admin actions audit log**
- The `audit_log` table already exists — extend usage to log every admin action (approve/reject/etc.) with details

**B. Performer notes on admin view**
- Add `admin_notes` column to profiles
- Add notes field in AdminUsers detail view

**C. Rate limiting on uploads**
- Check asset count created in last 24h before allowing upload (max 10/day)

**D. Public performer profile**
- New route `/performer/:slug` — public page showing verified badge, asset types, union status
- Add `slug` column to profiles (auto-generated from name)

**E. Reported violations**
- New `reported_violations` table: id, user_id, url, description, screenshot_url, status (open/investigating/resolved), created_at
- Performer UI to submit violation reports
- Admin violation queue page

**F. Email notifications**
- Set up email infrastructure for: welcome, verification approved/rejected, subscription confirmed

---

### Phase 3 — AI Fingerprinting

**A. Enable pgvector extension**
- Create `face_embeddings` and `voice_embeddings` tables with vector columns

**B. Embedding generation**
- Edge functions that call external AI APIs (Replicate/similar) on asset upload to generate face/voice embeddings
- Store embeddings in pgvector tables

**C. Detection scan endpoint**
- Edge function accepts uploaded file, runs similarity search against embeddings
- Returns top matches with confidence scores

**D. Producer scan tool**
- Producer-facing page to upload file and check against registry
- Shows match/no-match with performer name if >85% confidence

---

### Phase 4 — Licensing Marketplace

- Producer browsing of performer registry with filters
- License request flow (request, accept/reject/counter)
- `license_requests` and `license_agreements` tables
- PDF license agreement generation
- Stripe Connect for performer payouts (platform takes 10%)
- License dashboard for both parties

---

### Phase 5 — Scale & Automation

- Webhook system for scan match notifications
- API keys for Studio tier programmatic access
- Batch scan endpoint (up to 50 files)
- DMCA notice PDF generation on confirmed matches
- Admin analytics dashboard with charts
- SAG-AFTRA integration placeholder (union_id, union_verified fields)

---

### Implementation Strategy

This is too large for a single build. I recommend starting with **Phase 1 gaps** (producer role, onboarding fields, legal agreement gate, Stripe billing) since they form the foundation everything else depends on.

After Phase 1 is solid, we move to Phase 2, and so on. Each phase will be its own implementation cycle.

**Shall I proceed with Phase 1 gaps first?** That covers:
1. Database migration: add producer role, profile fields, legal_agreements table
2. Updated signup with onboarding flow
3. Legal agreement acceptance gate
4. Stripe billing integration
5. Tier-gated upload limits

