-- Add voice print columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS voice_print_url text,
  ADD COLUMN IF NOT EXISTS voice_print_demo_url text,
  ADD COLUMN IF NOT EXISTS voice_print_hash text,
  ADD COLUMN IF NOT EXISTS voice_registered_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS voice_print_duration_seconds integer;

-- Create private voice-prints bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-prints', 'voice-prints', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: users manage their own voice prints (folder = user_id)
CREATE POLICY "Users can upload own voice prints"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-prints'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own voice prints"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'voice-prints'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Users can update own voice prints"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'voice-prints'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own voice prints"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'voice-prints'
  AND auth.uid()::text = (storage.foldername(name))[1]
);