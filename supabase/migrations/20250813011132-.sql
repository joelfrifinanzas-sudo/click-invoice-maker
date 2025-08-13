-- Create helper to accept earliest invitation for current user
CREATE OR REPLACE FUNCTION public.cm_accept_any_invitation_for_me()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
  v_email text;
  v_inv public.company_members;
BEGIN
  SELECT lower(email) INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_inv
  FROM public.company_members
  WHERE lower(email) = v_email AND coalesce(status,'') IN ('invited','pending')
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_inv.id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.company_members
  SET user_id = auth.uid(), status = 'active'
  WHERE id = v_inv.id;

  RETURN v_inv.company_id;
END;
$$;