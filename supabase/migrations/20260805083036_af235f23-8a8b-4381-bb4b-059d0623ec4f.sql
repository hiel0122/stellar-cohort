-- 1. Lock down email column in self-update policy
DROP POLICY IF EXISTS profiles_update_own_safe ON public.profiles;
CREATE POLICY profiles_update_own_safe ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND email = (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid())
  AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  AND clearance_level = (SELECT p.clearance_level FROM public.profiles p WHERE p.id = auth.uid())
  AND COALESCE(allow_pages, '{}'::text[]) = (SELECT COALESCE(p.allow_pages, '{}'::text[]) FROM public.profiles p WHERE p.id = auth.uid())
  AND COALESCE(deny_pages, '{}'::text[]) = (SELECT COALESCE(p.deny_pages, '{}'::text[]) FROM public.profiles p WHERE p.id = auth.uid())
);

-- 2. Pin search_path on functions that lack it
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at_settings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;