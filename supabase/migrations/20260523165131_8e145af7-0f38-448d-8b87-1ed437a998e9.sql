
-- Revoke EXECUTE on remaining SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_registry_id() FROM anon, authenticated, public;

-- Restrict listing of objects in the public `headshots` bucket.
-- Direct file URLs continue to work because storage object reads via public URL bypass RLS for public buckets.
DROP POLICY IF EXISTS "Public headshots are viewable" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view headshots" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

CREATE POLICY "Owners can list own headshots"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'headshots' AND auth.uid()::text = (storage.foldername(name))[1]);
