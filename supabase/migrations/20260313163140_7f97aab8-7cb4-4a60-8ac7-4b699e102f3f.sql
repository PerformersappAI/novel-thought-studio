
-- Fix overly permissive INSERT policies
DROP POLICY "System can insert audit logs" ON public.audit_log;
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
