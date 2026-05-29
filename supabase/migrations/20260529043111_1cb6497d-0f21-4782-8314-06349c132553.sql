
REVOKE SELECT ON public.registry_performers FROM anon, authenticated;
GRANT SELECT (id, slug, stage_name, headshot_url, profession, union_status, bio, experience_level, rep_name, instagram_url, imdb_url, website_url, youtube_url, demo_reel_url, instagram_followers, tiktok_followers, youtube_subscribers, skills, verified_date, inquiry_goes_to, created_at, updated_at) ON public.registry_performers TO anon, authenticated;
