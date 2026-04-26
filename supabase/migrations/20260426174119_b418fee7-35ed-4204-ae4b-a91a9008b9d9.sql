-- Profile columns for onboarding
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS legal_name text,
  ADD COLUMN IF NOT EXISTS performance_type text,
  ADD COLUMN IF NOT EXISTS years_performing text,
  ADD COLUMN IF NOT EXISTS primary_market text,
  ADD COLUMN IF NOT EXISTS imdb_url text,
  ADD COLUMN IF NOT EXISTS agency_name text,
  ADD COLUMN IF NOT EXISTS headshot_url text,
  ADD COLUMN IF NOT EXISTS instagram_handle text,
  ADD COLUMN IF NOT EXISTS tiktok_handle text,
  ADD COLUMN IF NOT EXISTS youtube_handle text,
  ADD COLUMN IF NOT EXISTS is_discoverable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS face_descriptor jsonb,
  ADD COLUMN IF NOT EXISTS face_capture_front_url text,
  ADD COLUMN IF NOT EXISTS face_capture_left_url text,
  ADD COLUMN IF NOT EXISTS face_capture_right_url text,
  ADD COLUMN IF NOT EXISTS face_registered_at timestamptz;

-- Private bucket for face captures
INSERT INTO storage.buckets (id, name, public)
VALUES ('face-captures', 'face-captures', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies: users access only their own folder (face-captures/<user_id>/...)
CREATE POLICY "Users can view own face captures"
ON storage.objects FOR SELECT
USING (bucket_id = 'face-captures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own face captures"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'face-captures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own face captures"
ON storage.objects FOR UPDATE
USING (bucket_id = 'face-captures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own face captures"
ON storage.objects FOR DELETE
USING (bucket_id = 'face-captures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Public bucket for headshots (used on public performer profile)
INSERT INTO storage.buckets (id, name, public)
VALUES ('headshots', 'headshots', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Headshots are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'headshots');

CREATE POLICY "Users can upload own headshot"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'headshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own headshot"
ON storage.objects FOR UPDATE
USING (bucket_id = 'headshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own headshot"
ON storage.objects FOR DELETE
USING (bucket_id = 'headshots' AND auth.uid()::text = (storage.foldername(name))[1]);