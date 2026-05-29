
-- Backfill registry_performers from profiles for any linked performer
UPDATE public.registry_performers rp
SET
  headshot_url = COALESCE(NULLIF(rp.headshot_url, ''), p.headshot_url),
  profession   = COALESCE(NULLIF(rp.profession, ''), p.profession, p.performance_type),
  union_status = COALESCE(NULLIF(rp.union_status, ''), p.union_affiliation),
  experience_level = COALESCE(NULLIF(rp.experience_level, ''), p.years_performing),
  rep_name = COALESCE(NULLIF(rp.rep_name, ''), p.agency_name),
  imdb_url = COALESCE(NULLIF(rp.imdb_url, ''), p.imdb_url),
  youtube_url = COALESCE(NULLIF(rp.youtube_url, ''), p.youtube_handle),
  instagram_url = COALESCE(
    NULLIF(rp.instagram_url, ''),
    CASE
      WHEN p.instagram_handle IS NULL OR p.instagram_handle = '' THEN NULL
      WHEN p.instagram_handle ~* '^https?://' THEN p.instagram_handle
      ELSE 'https://instagram.com/' || regexp_replace(p.instagram_handle, '^@', '')
    END
  ),
  bio = COALESCE(NULLIF(rp.bio, ''), p.bio),
  stage_name = COALESCE(NULLIF(rp.stage_name, ''), p.stage_name, p.full_name),
  updated_at = now()
FROM public.profiles p
WHERE rp.user_id = p.user_id;

-- Trigger: keep registry_performers mirrored from profile updates
CREATE OR REPLACE FUNCTION public.sync_profile_to_registry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.registry_performers rp
  SET
    headshot_url = NEW.headshot_url,
    profession   = COALESCE(NEW.profession, NEW.performance_type),
    union_status = NEW.union_affiliation,
    experience_level = NEW.years_performing,
    rep_name = NEW.agency_name,
    imdb_url = NEW.imdb_url,
    youtube_url = NEW.youtube_handle,
    instagram_url = CASE
      WHEN NEW.instagram_handle IS NULL OR NEW.instagram_handle = '' THEN rp.instagram_url
      WHEN NEW.instagram_handle ~* '^https?://' THEN NEW.instagram_handle
      ELSE 'https://instagram.com/' || regexp_replace(NEW.instagram_handle, '^@', '')
    END,
    bio = COALESCE(NEW.bio, rp.bio),
    stage_name = COALESCE(NEW.stage_name, NEW.full_name, rp.stage_name),
    updated_at = now()
  WHERE rp.user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_sync_registry ON public.profiles;
CREATE TRIGGER profiles_sync_registry
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_registry();
