-- Add es_usuario flag to customers to mark internal users
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS es_usuario boolean NOT NULL DEFAULT false;

-- Function to mark customers as users by matching email within a company
CREATE OR REPLACE FUNCTION public.mark_customers_as_users(_company_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_count int := 0;
BEGIN
  -- Ensure caller belongs to the company or is superadmin
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.user_company uc
      WHERE uc.user_id = auth.uid() AND uc.company_id = _company_id
    )
    OR public.has_role(auth.uid(),'superadmin')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.customers c
  SET es_usuario = true
  WHERE c.company_id = _company_id
    AND c.email IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users u
      WHERE lower(u.email) = lower(c.email)
    )
    AND c.es_usuario IS DISTINCT FROM true;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;