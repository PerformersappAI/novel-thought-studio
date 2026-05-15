CREATE TABLE IF NOT EXISTS public.social_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL,
  url text NOT NULL,
  url_hash text NOT NULL,
  username text,
  display_name text,
  bio_snippet text,
  profile_pic_url text,
  follower_count integer,
  search_query text NOT NULL,
  actor_id text NOT NULL,
  match_reason text,
  confidence_score integer NOT NULL DEFAULT 50,
  risk_level text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'needs_review',
  raw_result jsonb NOT NULL DEFAULT '{}'::jsonb,
  found_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT social_scans_user_url_unique UNIQUE (user_id, url_hash)
);

ALTER TABLE public.social_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all social scans"
ON public.social_scans
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own social scans"
ON public.social_scans
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own social scans"
ON public.social_scans
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social scans"
ON public.social_scans
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own social scans"
ON public.social_scans
FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_social_scans_user_id ON public.social_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_social_scans_platform ON public.social_scans(platform);
CREATE INDEX IF NOT EXISTS idx_social_scans_url_hash ON public.social_scans(url_hash);

CREATE TRIGGER update_social_scans_updated_at
BEFORE UPDATE ON public.social_scans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();