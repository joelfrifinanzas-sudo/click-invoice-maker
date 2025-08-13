-- Create function to remove Super Admin role by email (revoke root)
CREATE OR REPLACE FUNCTION public.su_unset_root(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'superadmin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Normalize email and find user id
  SELECT id INTO v_user FROM auth.users WHERE lower(email) = lower(_email) LIMIT 1;

  -- Remove from app_roots registry
  DELETE FROM public.app_roots WHERE lower(email) = lower(_email);

  -- Remove explicit superadmin role assignment if exists
  IF v_user IS NOT NULL THEN
    DELETE FROM public.app_user_roles
    WHERE user_id = v_user AND role = 'superadmin';
  END IF;
END;
$function$;