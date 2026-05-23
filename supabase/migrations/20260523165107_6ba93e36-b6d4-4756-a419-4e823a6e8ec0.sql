
-- 1. profiles: remove broad anon SELECT (view public_profiles is used instead)
DROP POLICY IF EXISTS "Public can view discoverable performer profiles" ON public.profiles;

-- 2. identity_verifications: scope to authenticated only
DROP POLICY IF EXISTS "Users can insert own verification" ON public.identity_verifications;
DROP POLICY IF EXISTS "Users can view own verification" ON public.identity_verifications;
DROP POLICY IF EXISTS "Admins can view all verifications" ON public.identity_verifications;
DROP POLICY IF EXISTS "Admins can update verifications" ON public.identity_verifications;

CREATE POLICY "Users can insert own verification" ON public.identity_verifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own verification" ON public.identity_verifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all verifications" ON public.identity_verifications
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update verifications" ON public.identity_verifications
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. notifications: scope admin INSERT to authenticated
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. contracts: add UPDATE policy
CREATE POLICY "Users can update own contracts" ON public.contracts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. registry_assets: add DELETE policy for owners
CREATE POLICY "Users can delete own assets" ON public.registry_assets
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. scan_runs: tighten SELECT — remove unassigned (actor_id IS NULL) leak
DROP POLICY IF EXISTS "Users can view own or unassigned scan runs" ON public.scan_runs;
CREATE POLICY "Users can view own scan runs" ON public.scan_runs
  FOR SELECT TO authenticated USING (
    actor_id IS NOT NULL AND actor_id IN (
      SELECT external_actor_id FROM public.profiles
      WHERE user_id = auth.uid() AND external_actor_id IS NOT NULL
    )
  );

-- 7. user_roles: explicit admin-only write policies (prevents accidental escalation)
CREATE POLICY "Only admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. Revoke public EXECUTE on SECURITY DEFINER helpers (keep authenticated for has_role)
REVOKE EXECUTE ON FUNCTION public.generate_registry_id() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
