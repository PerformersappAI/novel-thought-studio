DROP POLICY IF EXISTS "Anyone can submit inquiries" ON public.performer_inquiries;

CREATE POLICY "Anyone can submit valid inquiries"
ON public.performer_inquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (
  performer_id IS NOT NULL
  AND btrim(sender_name) <> ''
  AND sender_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  AND btrim(message) <> ''
  AND (destination_email IS NULL OR destination_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
  AND (cc_email IS NULL OR cc_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;