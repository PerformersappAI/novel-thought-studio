CREATE OR REPLACE FUNCTION public.generate_registry_id()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN 'CMF-' || to_char(now(), 'YYYY') || '-' || lpad((floor(random() * 100000))::text, 5, '0');
END;
$function$;