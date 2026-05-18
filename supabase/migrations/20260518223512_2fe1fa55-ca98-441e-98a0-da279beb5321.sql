DROP POLICY IF EXISTS "Users can view own scan runs" ON public.scan_runs;

CREATE POLICY "Users can view own or unassigned scan runs"
ON public.scan_runs
FOR SELECT
TO authenticated
USING (
  actor_id IS NULL
  OR actor_id IN (
    SELECT external_actor_id
    FROM public.profiles
    WHERE user_id = auth.uid()
      AND external_actor_id IS NOT NULL
  )
);