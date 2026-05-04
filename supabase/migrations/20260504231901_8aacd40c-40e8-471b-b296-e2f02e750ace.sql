
-- Create mentions table to store identity footprint findings
CREATE TABLE public.mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mention_type text NOT NULL DEFAULT 'Web',
  title text NOT NULL DEFAULT '',
  url text,
  found_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'New Alert',
  confidence integer DEFAULT 90,
  category text DEFAULT 'News & Articles',
  media_type text DEFAULT 'article',
  thumbnail_url text,
  audio_url text,
  excerpt text,
  match_label text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mentions"
  ON public.mentions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mentions"
  ON public.mentions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mentions"
  ON public.mentions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mentions"
  ON public.mentions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all mentions"
  ON public.mentions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all mentions"
  ON public.mentions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_mentions_updated_at
  BEFORE UPDATE ON public.mentions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
