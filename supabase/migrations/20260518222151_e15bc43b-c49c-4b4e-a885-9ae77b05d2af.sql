CREATE TABLE IF NOT EXISTS public.scan_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scanner_name text NOT NULL,
  actor_id text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  items_scanned integer NOT NULL DEFAULT 0,
  threats_found integer NOT NULL DEFAULT 0,
  legitimate_found integer NOT NULL DEFAULT 0,
  review_found integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'running',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scan_runs_actor_started ON public.scan_runs (actor_id, scanner_name, started_at DESC);

ALTER TABLE public.scan_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scan runs"
ON public.scan_runs
FOR SELECT
TO authenticated
USING (
  actor_id IS NOT NULL AND actor_id IN (
    SELECT external_actor_id FROM public.profiles
    WHERE user_id = auth.uid() AND external_actor_id IS NOT NULL
  )
);

CREATE POLICY "Admins can manage all scan runs"
ON public.scan_runs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));