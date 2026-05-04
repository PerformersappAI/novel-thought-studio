ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS external_actor_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS external_risk_score integer;