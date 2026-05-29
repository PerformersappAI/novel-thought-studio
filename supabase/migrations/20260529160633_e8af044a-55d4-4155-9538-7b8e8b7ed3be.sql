GRANT SELECT ON public.registry_performers TO anon, authenticated;
GRANT ALL ON public.registry_performers TO service_role;
GRANT INSERT ON public.performer_inquiries TO anon, authenticated;
GRANT ALL ON public.performer_inquiries TO service_role;