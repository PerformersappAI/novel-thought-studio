CREATE OR REPLACE FUNCTION public.prevent_admin_field_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role'
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.admin_notes := OLD.admin_notes;
    NEW.external_risk_score := OLD.external_risk_score;
    NEW.union_verified := OLD.union_verified;
    NEW.external_actor_id := OLD.external_actor_id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_admin_field_changes() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_admin_field_changes() FROM anon;
REVOKE EXECUTE ON FUNCTION public.prevent_admin_field_changes() FROM authenticated;

ALTER TABLE public.profiles DISABLE TRIGGER profiles_protect_admin_fields;

UPDATE public.profiles
SET external_actor_id = '23740931-5fb7-4e96-9bce-5ff33a8c9444'
WHERE user_id = '43c06378-54cb-4308-9b96-ed0dc941b613'
  AND external_actor_id IS NULL;

ALTER TABLE public.profiles ENABLE TRIGGER profiles_protect_admin_fields;