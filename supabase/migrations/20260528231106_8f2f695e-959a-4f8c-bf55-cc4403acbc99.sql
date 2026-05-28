CREATE TABLE public.finding_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  url_hash text NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('dmca','cease_desist','violation_report','note')),
  status text NOT NULL DEFAULT 'sent',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_finding_actions_user_created ON public.finding_actions (user_id, created_at DESC);
CREATE INDEX idx_finding_actions_user_url ON public.finding_actions (user_id, url_hash);

-- Append-only: grant only SELECT + INSERT to authenticated; no UPDATE/DELETE.
GRANT SELECT, INSERT ON public.finding_actions TO authenticated;
GRANT ALL ON public.finding_actions TO service_role;

ALTER TABLE public.finding_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own finding actions"
  ON public.finding_actions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own finding actions"
  ON public.finding_actions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Intentionally NO UPDATE or DELETE policies — RLS denies by default, making rows immutable.