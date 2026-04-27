CREATE POLICY "Users can delete own scans"
ON public.likeness_scans
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);