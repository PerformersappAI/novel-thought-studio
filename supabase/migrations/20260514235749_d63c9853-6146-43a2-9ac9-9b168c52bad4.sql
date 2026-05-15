
ALTER TABLE public.possible_fake_profiles
  ADD COLUMN IF NOT EXISTS profile_pic_url text,
  ADD COLUMN IF NOT EXISTS follower_count integer,
  ADD COLUMN IF NOT EXISTS match_reason text;
