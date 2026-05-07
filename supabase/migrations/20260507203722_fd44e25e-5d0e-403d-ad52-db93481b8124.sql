
CREATE TABLE public.ai_consent_declarations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  voice_cloning BOOLEAN NOT NULL DEFAULT false,
  face_likeness BOOLEAN NOT NULL DEFAULT false,
  name_use BOOLEAN NOT NULL DEFAULT false,
  posthumous_use BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.ai_consent_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own declarations"
ON public.ai_consent_declarations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own declarations"
ON public.ai_consent_declarations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own declarations"
ON public.ai_consent_declarations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all declarations"
ON public.ai_consent_declarations FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_ai_consent_updated_at
BEFORE UPDATE ON public.ai_consent_declarations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
