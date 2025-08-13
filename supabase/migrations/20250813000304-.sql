-- Fix compute_global_role to avoid enum cast errors with company_role
-- Compare enum column as text to prevent invalid cast when checking non-existent labels
CREATE OR REPLACE FUNCTION public.compute_global_role(_user_id uuid)
RETURNS global_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_role public.global_role;
BEGIN
  -- Super admin override (existing model)
  IF public.has_role(_user_id, 'superadmin') THEN
    RETURN 'super_admin';
  END IF;

  -- Company-based roles using text comparison to avoid enum cast errors
  IF EXISTS (
    SELECT 1 FROM public.user_company uc
    WHERE uc.user_id = _user_id 
      AND (uc.role::text IN ('owner','admin','manager','supervisor'))
  ) THEN
    RETURN 'admin';
  ELSIF EXISTS (
    SELECT 1 FROM public.user_company uc
    WHERE uc.user_id = _user_id 
      AND (uc.role::text IN ('cashier','cajera'))
  ) THEN
    RETURN 'cajera';
  END IF;

  RETURN 'cliente';
END; $function$;