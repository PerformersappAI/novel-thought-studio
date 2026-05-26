
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS consent_given boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_date timestamptz;

CREATE TABLE IF NOT EXISTS public.identity_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_key text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.identity_checklist TO authenticated;
GRANT ALL ON public.identity_checklist TO service_role;

ALTER TABLE public.identity_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own checklist"
  ON public.identity_checklist
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all checklist"
  ON public.identity_checklist
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
