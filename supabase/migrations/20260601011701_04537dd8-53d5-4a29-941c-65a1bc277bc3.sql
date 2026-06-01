
CREATE TABLE public.evidence_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL,
  source_type text NOT NULL DEFAULT 'url',
  verdict text,
  note text,
  analysis jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidence_log TO authenticated;
GRANT ALL ON public.evidence_log TO service_role;

ALTER TABLE public.evidence_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own evidence" ON public.evidence_log
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own evidence" ON public.evidence_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own evidence" ON public.evidence_log
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own evidence" ON public.evidence_log
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all evidence" ON public.evidence_log
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_evidence_log_user ON public.evidence_log(user_id, created_at DESC);
