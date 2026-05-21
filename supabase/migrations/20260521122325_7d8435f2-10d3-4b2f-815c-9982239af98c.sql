-- Recreate as security_invoker so the caller's RLS applies
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
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

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Column-level grants on profiles: anon may only ever read safe columns.
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  user_id, slug, stage_name, display_name, bio, avatar_url, headshot_url,
  union_affiliation, account_type, is_discoverable
) ON public.profiles TO anon;

-- Narrow public-read RLS for the view to resolve under security_invoker
CREATE POLICY "Public can view discoverable performer profiles"
  ON public.profiles
  FOR SELECT TO anon
  USING (slug IS NOT NULL AND account_type = 'performer');