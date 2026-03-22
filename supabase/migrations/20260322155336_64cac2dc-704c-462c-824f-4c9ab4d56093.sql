
-- Update handle_new_user to support account_type and generate slug
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _account_type text;
  _role app_role;
  _slug text;
BEGIN
  _account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'performer');
  
  IF _account_type = 'producer' THEN
    _role := 'producer';
  ELSE
    _role := 'performer';
  END IF;

  -- Generate slug from full_name
  _slug := lower(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), '[^a-zA-Z0-9]+', '-', 'g'));
  _slug := trim(both '-' from _slug);
  -- Append short unique suffix
  _slug := _slug || '-' || substr(gen_random_uuid()::text, 1, 6);

  INSERT INTO public.profiles (user_id, full_name, account_type, stage_name, union_affiliation, company_name, production_type, slug)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    _account_type,
    COALESCE(NEW.raw_user_meta_data->>'stage_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'union_affiliation', 'non-union'),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'production_type', ''),
    _slug
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);

  RETURN NEW;
END;
$$;

-- Attach trigger (drop and recreate to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
