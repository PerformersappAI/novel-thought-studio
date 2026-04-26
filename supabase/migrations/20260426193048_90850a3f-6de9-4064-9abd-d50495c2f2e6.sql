DO $$
DECLARE
  target_uid uuid := '1f817e50-48b0-4ea9-bb38-68fd149e1636';
BEGIN
  DELETE FROM public.audit_log WHERE user_id = target_uid;
  DELETE FROM public.notifications WHERE user_id = target_uid;
  DELETE FROM public.reported_violations WHERE user_id = target_uid;
  DELETE FROM public.likeness_scans WHERE user_id = target_uid;
  DELETE FROM public.consent_signatures WHERE user_id = target_uid;
  DELETE FROM public.certificates WHERE user_id = target_uid;
  DELETE FROM public.identity_verifications WHERE user_id = target_uid;
  DELETE FROM public.registry_assets WHERE user_id = target_uid;
  DELETE FROM public.user_subscriptions WHERE user_id = target_uid;
  DELETE FROM public.user_roles WHERE user_id = target_uid;
  DELETE FROM public.profiles WHERE user_id = target_uid;
  DELETE FROM auth.users WHERE id = target_uid;
END $$;