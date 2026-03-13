
CREATE TABLE public.likeness_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  query TEXT NOT NULL,
  scan_type TEXT NOT NULL DEFAULT 'web_search',
  status TEXT NOT NULL DEFAULT 'pending',
  results JSONB DEFAULT '[]'::jsonb,
  result_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.likeness_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scans" ON public.likeness_scans
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans" ON public.likeness_scans
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scans" ON public.likeness_scans
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all scans" ON public.likeness_scans
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
