
-- Add 'producer' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'producer';

-- Add onboarding fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stage_name text,
  ADD COLUMN IF NOT EXISTS union_affiliation text DEFAULT 'non-union',
  ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'performer',
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS production_type text,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS union_id text,
  ADD COLUMN IF NOT EXISTS union_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS legal_accepted_at timestamptz;

-- Create unique index on slug for public profiles
CREATE UNIQUE INDEX IF NOT EXISTS profiles_slug_unique ON public.profiles(slug) WHERE slug IS NOT NULL;

-- Add public read policy for profiles with slug (public performer pages)
CREATE POLICY "Anyone can view public profiles" ON public.profiles
  FOR SELECT TO public
  USING (slug IS NOT NULL AND account_type = 'performer');

-- Create reported_violations table
CREATE TABLE IF NOT EXISTS public.reported_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url text NOT NULL,
  description text NOT NULL,
  screenshot_url text,
  status text NOT NULL DEFAULT 'open',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reported_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own violations" ON public.reported_violations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own violations" ON public.reported_violations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all violations" ON public.reported_violations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update violations" ON public.reported_violations
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
