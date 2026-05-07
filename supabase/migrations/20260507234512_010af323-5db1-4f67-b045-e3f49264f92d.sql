
-- Create possible_fake_profiles table
CREATE TABLE public.possible_fake_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  url_hash TEXT NOT NULL,
  username TEXT,
  display_name TEXT,
  bio_snippet TEXT,
  confidence_score INTEGER NOT NULL DEFAULT 50,
  risk_level TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'needs_review',
  search_query TEXT,
  found_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, url_hash)
);

-- Enable RLS
ALTER TABLE public.possible_fake_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own fake profiles"
  ON public.possible_fake_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all fake profiles"
  ON public.possible_fake_profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own fake profiles"
  ON public.possible_fake_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fake profiles"
  ON public.possible_fake_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all fake profiles"
  ON public.possible_fake_profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own fake profiles"
  ON public.possible_fake_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_possible_fake_profiles_user_id ON public.possible_fake_profiles(user_id);
CREATE INDEX idx_possible_fake_profiles_url_hash ON public.possible_fake_profiles(url_hash);

-- Updated_at trigger
CREATE TRIGGER update_possible_fake_profiles_updated_at
  BEFORE UPDATE ON public.possible_fake_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
