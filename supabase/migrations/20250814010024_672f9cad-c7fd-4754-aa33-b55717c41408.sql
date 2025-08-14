-- Harden function: set search_path explicitly (security linter)
CREATE OR REPLACE FUNCTION public.company_create_and_link(
  _name text,
  _rnc text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _currency text DEFAULT 'DOP'
)
RETURNS TABLE(company_id uuid, assigned_role text)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.companies (id, name, owner_user_id, rnc, phone, currency, active)
  VALUES (gen_random_uuid(), NULLIF(trim(_name),''), auth.uid(), NULLIF(trim(_rnc),''), NULLIF(trim(_phone),''), COALESCE(NULLIF(_currency,''), 'DOP'), true)
  RETURNING id INTO v_company_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Company creation failed';
  END IF;

  INSERT INTO public.user_company (company_id, user_id, role)
  VALUES (v_company_id, auth.uid(), 'owner');

  company_id := v_company_id;
  assigned_role := 'owner';
  RETURN NEXT;
END;
$$;