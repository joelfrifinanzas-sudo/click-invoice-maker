-- 1) Policy to allow owners to insert their own membership after creating the company
DO $$ BEGIN
  CREATE POLICY uc_owner_self_insert
  ON public.user_company
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'owner'::public.company_role
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = user_company.company_id
        AND c.owner_user_id = auth.uid()
        AND c.active = true
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Transactional RPC to create company and link user respecting RLS
CREATE OR REPLACE FUNCTION public.company_create_and_link(
  _name text,
  _rnc text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _currency text DEFAULT 'DOP'
)
RETURNS TABLE(company_id uuid, assigned_role text)
LANGUAGE plpgsql
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Step 1 & 2: create company with minimal fields, owner_user_id = current user
  INSERT INTO public.companies (id, name, owner_user_id, rnc, phone, currency, active)
  VALUES (gen_random_uuid(), NULLIF(trim(_name),''), auth.uid(), NULLIF(trim(_rnc),''), NULLIF(trim(_phone),''), COALESCE(NULLIF(_currency,''), 'DOP'), true)
  RETURNING id INTO v_company_id;

  -- Guard: ensure name provided (table requires NOT NULL but be explicit for error readability)
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Company creation failed';
  END IF;

  -- Step 3: link membership as owner (RLS enforced by policy uc_owner_self_insert)
  INSERT INTO public.user_company (company_id, user_id, role)
  VALUES (v_company_id, auth.uid(), 'owner');

  -- Return result
  company_id := v_company_id;
  assigned_role := 'owner';
  RETURN NEXT;
END;
$$;
