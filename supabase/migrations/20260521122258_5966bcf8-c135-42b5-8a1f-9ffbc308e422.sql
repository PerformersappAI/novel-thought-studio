-- 1. Drop overly-broad public profile policy
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.profiles;

-- 2. Safe public view for performer directory / public profile pages
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT
  user_id,
  slug,
  stage_name,
  display_name,
  bio,
  avatar_url,
  headshot_url,
  union_affiliation,
  account_type,
  is_discoverable
FROM public.profiles
WHERE slug IS NOT NULL
  AND account_type = 'performer';

-- View needs its own permissive policy on the underlying table for anon access
-- via security_invoker. Add a narrow policy that only exposes the columns the
-- view selects by allowing SELECT only when accessed through these columns.
-- Simplest correct approach: re-enable a narrow public SELECT policy, but the
-- view + grant model is cleaner. Since security_invoker uses the caller's RLS,
-- we instead make the view security_definer-style by switching it off:
DROP VIEW public.public_profiles;

CREATE VIEW public.public_profiles AS
SELECT
  user_id,
  slug,
  stage_name,
  display_name,
  bio,
  avatar_url,
  headshot_url,
  union_affiliation,
  account_type,
  is_discoverable
FROM public.profiles
WHERE slug IS NOT NULL
  AND account_type = 'performer';

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 3. Consent log table (GDPR / CCPA / biometric)
CREATE TYPE public.consent_type AS ENUM (
  'terms_of_service',
  'likeness_rights',
  'gdpr',
  'ccpa',
  'biometric',
  'face_scan',
  'voice_print'
);

CREATE TABLE public.consent_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  consent_type public.consent_type NOT NULL,
  granted boolean NOT NULL,
  document_version integer,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_consent_log_user ON public.consent_log(user_id, consent_type, created_at DESC);

ALTER TABLE public.consent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own consent records"
  ON public.consent_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own consent records"
  ON public.consent_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all consent records"
  ON public.consent_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
-- No UPDATE / DELETE policies → entries are immutable from clients.