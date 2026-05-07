
CREATE TABLE public.identity_statements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  statement_text TEXT NOT NULL,
  digital_signature TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.identity_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own statements" ON public.identity_statements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own statements" ON public.identity_statements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all statements" ON public.identity_statements FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
