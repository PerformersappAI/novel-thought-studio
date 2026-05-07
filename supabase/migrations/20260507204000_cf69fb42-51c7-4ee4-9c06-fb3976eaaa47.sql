
-- Create incident_reports table
CREATE TABLE public.incident_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  infringing_url TEXT NOT NULL,
  violation_type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  evidence_url TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
ON public.incident_reports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports"
ON public.incident_reports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all reports"
ON public.incident_reports FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all reports"
ON public.incident_reports FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_incident_reports_updated_at
BEFORE UPDATE ON public.incident_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for evidence
INSERT INTO storage.buckets (id, name, public) VALUES ('incident-evidence', 'incident-evidence', false);

CREATE POLICY "Users can upload own evidence"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'incident-evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own evidence"
ON storage.objects FOR SELECT
USING (bucket_id = 'incident-evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all evidence"
ON storage.objects FOR SELECT
USING (bucket_id = 'incident-evidence' AND has_role(auth.uid(), 'admin'::app_role));
