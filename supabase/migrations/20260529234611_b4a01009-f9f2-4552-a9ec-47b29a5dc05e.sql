
-- 1. Credentials: remove broad authenticated-read policy, add owner-only
DROP POLICY IF EXISTS "Authenticated users can view non-sensitive credential fields" ON public.credentials;

CREATE POLICY "Users can view own credentials"
  ON public.credentials FOR SELECT
  TO authenticated
  USING (auth.uid() = actor_id);

-- 2. Legal documents: allow public (anon) read of active documents
DROP POLICY IF EXISTS "Anyone authenticated can view active legal docs" ON public.legal_documents;

CREATE POLICY "Anyone can view active legal docs"
  ON public.legal_documents FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

GRANT SELECT ON public.legal_documents TO anon;

-- 3. Profiles: prevent users from modifying admin-managed fields
CREATE OR REPLACE FUNCTION public.prevent_admin_field_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.admin_notes := OLD.admin_notes;
    NEW.external_risk_score := OLD.external_risk_score;
    NEW.union_verified := OLD.union_verified;
    NEW.external_actor_id := OLD.external_actor_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_admin_fields ON public.profiles;
CREATE TRIGGER profiles_protect_admin_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_admin_field_changes();
