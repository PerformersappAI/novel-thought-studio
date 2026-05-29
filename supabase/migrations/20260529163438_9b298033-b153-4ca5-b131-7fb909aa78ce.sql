DROP INDEX IF EXISTS public.registry_performers_user_id_key;
DELETE FROM public.registry_performers a USING public.registry_performers b WHERE a.ctid < b.ctid AND a.user_id = b.user_id AND a.user_id IS NOT NULL;
ALTER TABLE public.registry_performers ADD CONSTRAINT registry_performers_user_id_key UNIQUE (user_id);