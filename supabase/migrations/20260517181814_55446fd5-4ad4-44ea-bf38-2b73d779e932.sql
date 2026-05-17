ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS writing_sample text,
  ADD COLUMN IF NOT EXISTS aka_names text[];