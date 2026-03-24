CREATE POLICY "profiles_admin_select_all"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin());