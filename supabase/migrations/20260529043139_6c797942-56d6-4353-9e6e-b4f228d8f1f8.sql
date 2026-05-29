
CREATE TABLE public.performer_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  performer_id uuid NOT NULL REFERENCES public.registry_performers(id) ON DELETE CASCADE,
  sender_name text NOT NULL,
  sender_email text NOT NULL,
  company text,
  message text NOT NULL,
  destination_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.performer_inquiries TO anon, authenticated;
GRANT ALL ON public.performer_inquiries TO service_role;

ALTER TABLE public.performer_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit inquiries"
  ON public.performer_inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view inquiries"
  ON public.performer_inquiries FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.resolve_inquiry_destination()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
BEGIN
  SELECT CASE WHEN inquiry_goes_to = 'rep' AND rep_email IS NOT NULL THEN rep_email
              ELSE inquiry_email END
    INTO _email
  FROM public.registry_performers
  WHERE id = NEW.performer_id;
  NEW.destination_email := _email;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_inquiry_destination
  BEFORE INSERT ON public.performer_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.resolve_inquiry_destination();
