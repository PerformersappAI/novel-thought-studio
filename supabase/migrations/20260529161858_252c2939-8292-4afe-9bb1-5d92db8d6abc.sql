
-- Link registry entries to users and add listing/notification preferences
ALTER TABLE public.registry_performers
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS listed_on_registry boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cc_actor_on_inquiry boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS registry_performers_user_id_key
  ON public.registry_performers(user_id) WHERE user_id IS NOT NULL;

-- Allow performers to manage their own registry entry
DROP POLICY IF EXISTS "Anyone can view registry performers" ON public.registry_performers;
CREATE POLICY "Anyone can view listed registry performers"
  ON public.registry_performers FOR SELECT
  USING (listed_on_registry = true OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own registry entry"
  ON public.registry_performers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registry entry"
  ON public.registry_performers FOR UPDATE
  USING (auth.uid() = user_id);

-- Backfill existing rows as listed so demo entries stay visible
UPDATE public.registry_performers SET listed_on_registry = true WHERE listed_on_registry = false;

-- Track CC recipient on inquiries so the actor knows about a hit
ALTER TABLE public.performer_inquiries
  ADD COLUMN IF NOT EXISTS cc_email text;

CREATE OR REPLACE FUNCTION public.resolve_inquiry_destination()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _dest text;
  _cc text;
  _row record;
BEGIN
  SELECT inquiry_goes_to, inquiry_email, rep_email, cc_actor_on_inquiry
    INTO _row
  FROM public.registry_performers
  WHERE id = NEW.performer_id;

  IF _row.inquiry_goes_to = 'rep' AND _row.rep_email IS NOT NULL THEN
    _dest := _row.rep_email;
    IF _row.cc_actor_on_inquiry AND _row.inquiry_email IS NOT NULL THEN
      _cc := _row.inquiry_email;
    END IF;
  ELSE
    _dest := _row.inquiry_email;
  END IF;

  NEW.destination_email := _dest;
  NEW.cc_email := _cc;
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS resolve_inquiry_destination_trg ON public.performer_inquiries;
CREATE TRIGGER resolve_inquiry_destination_trg
  BEFORE INSERT ON public.performer_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.resolve_inquiry_destination();
