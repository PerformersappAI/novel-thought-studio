
CREATE TABLE public.dmca_notices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  infringing_url TEXT NOT NULL,
  notice_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dmca_notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notices"
ON public.dmca_notices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notices"
ON public.dmca_notices FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all notices"
ON public.dmca_notices FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
