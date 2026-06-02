-- Revoke broad PUBLIC execute on all SECURITY DEFINER / helper functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.resolve_inquiry_destination() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_profile_to_registry() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_admin_field_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_registry_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;

-- has_role is referenced by RLS policies for signed-in users; keep it callable by authenticated
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

-- generate_registry_id may be invoked by app code for signed-in users
GRANT EXECUTE ON FUNCTION public.generate_registry_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_registry_id() TO service_role;

-- Trigger-only functions: service_role only (triggers fire regardless of grants)
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.resolve_inquiry_destination() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_profile_to_registry() TO service_role;
GRANT EXECUTE ON FUNCTION public.prevent_admin_field_changes() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;