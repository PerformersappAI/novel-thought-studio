ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_why_seen boolean NOT NULL DEFAULT false;