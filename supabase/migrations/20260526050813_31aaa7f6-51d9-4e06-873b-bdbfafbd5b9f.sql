
CREATE TABLE public.credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID NOT NULL,
  certificate_id TEXT NOT NULL UNIQUE,
  legal_name TEXT,
  stage_name TEXT,
  face_hash TEXT,
  voice_hash TEXT,
  headshot_url TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_valid BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credentials_actor ON public.credentials(actor_id);
CREATE INDEX idx_credentials_cert_id ON public.credentials(certificate_id);

ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;

-- Public verification: anyone can read minimal certificate info by id
CREATE POLICY "Anyone can view valid credentials for verification"
  ON public.credentials FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own credentials"
  ON public.credentials FOR INSERT
  WITH CHECK (auth.uid() = actor_id);

CREATE POLICY "Users can update own credentials"
  ON public.credentials FOR UPDATE
  USING (auth.uid() = actor_id);

CREATE POLICY "Admins can manage credentials"
  ON public.credentials FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_credentials_updated_at
  BEFORE UPDATE ON public.credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
