
CREATE TABLE public.registry_performers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  stage_name text NOT NULL,
  headshot_url text,
  profession text,
  union_status text,
  bio text,
  experience_level text,
  rep_name text,
  instagram_url text,
  imdb_url text,
  website_url text,
  youtube_url text,
  demo_reel_url text,
  instagram_followers integer DEFAULT 0,
  tiktok_followers integer DEFAULT 0,
  youtube_subscribers integer DEFAULT 0,
  skills text[] DEFAULT '{}',
  verified_date date,
  inquiry_email text,
  inquiry_goes_to text NOT NULL DEFAULT 'actor' CHECK (inquiry_goes_to IN ('actor','rep')),
  rep_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.registry_performers TO anon;
GRANT SELECT ON public.registry_performers TO authenticated;
GRANT ALL ON public.registry_performers TO service_role;

ALTER TABLE public.registry_performers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view registry performers"
  ON public.registry_performers FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage registry performers"
  ON public.registry_performers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_registry_performers_updated_at
  BEFORE UPDATE ON public.registry_performers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
