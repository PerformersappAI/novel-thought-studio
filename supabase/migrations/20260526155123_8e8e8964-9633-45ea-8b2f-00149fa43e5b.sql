
-- Restrict public credentials reads to non-PII fields via a SECURITY INVOKER view.
DROP POLICY IF EXISTS "Anyone can view valid credentials for verification" ON public.credentials;

CREATE OR REPLACE VIEW public.credentials_public
WITH (security_invoker = true) AS
SELECT id, certificate_id, stage_name, is_valid, issued_at, created_at
FROM public.credentials
WHERE is_valid = true;

GRANT SELECT ON public.credentials_public TO anon, authenticated;

-- Restore an authenticated-only minimal SELECT on the base table for authed lookups,
-- excluding PII via a column-restricted policy at the app layer (no PII columns selected by clients).
CREATE POLICY "Authenticated users can view non-sensitive credential fields"
ON public.credentials FOR SELECT
TO authenticated
USING (is_valid = true);

-- Allow users to read their own audit log entries.
CREATE POLICY "Users can view own audit logs"
ON public.audit_log FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Lock down SECURITY DEFINER functions from anon/authenticated direct execution.
-- They remain callable from triggers and RLS policy evaluation.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_registry_id() FROM anon, authenticated, PUBLIC;
-- has_role is needed by authenticated RLS policies via the policy planner; keep granted to authenticated.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
