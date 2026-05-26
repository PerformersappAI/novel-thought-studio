CREATE TABLE public.scan_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_scan_id UUID,
  scan_type TEXT NOT NULL,
  query_label TEXT,
  period_month DATE NOT NULL DEFAULT date_trunc('month', now())::date,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scan_reports_user_period ON public.scan_reports(user_id, period_month DESC);
CREATE INDEX idx_scan_reports_created ON public.scan_reports(created_at DESC);

ALTER TABLE public.scan_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
  ON public.scan_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports"
  ON public.scan_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all reports"
  ON public.scan_reports FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));