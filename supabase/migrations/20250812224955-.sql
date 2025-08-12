-- Membership bootstrap function per spec
CREATE OR REPLACE FUNCTION public.cm_bootstrap_membership(_company_id uuid, _email text)
RETURNS public.company_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec public.company_members;
  v_cnt int := 0;
BEGIN
  -- How many members exist for this company?
  SELECT count(*) INTO v_cnt FROM public.company_members WHERE company_id = _company_id;

  IF v_cnt = 0 THEN
    -- First user becomes SUPER_ADMIN
    INSERT INTO public.company_members(id, company_id, user_id, email, role, status)
    VALUES (gen_random_uuid(), _company_id, auth.uid(), lower(coalesce(_email,'')), 'SUPER_ADMIN', 'active')
    RETURNING * INTO v_rec;
    RETURN v_rec;
  END IF;

  -- If invited by email and not yet linked, attach user_id and activate
  SELECT * INTO v_rec
  FROM public.company_members
  WHERE company_id = _company_id AND lower(email) = lower(coalesce(_email,''))
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_rec.id IS NOT NULL AND v_rec.user_id IS NULL THEN
    UPDATE public.company_members
    SET user_id = auth.uid(), status = 'active'
    WHERE id = v_rec.id
    RETURNING * INTO v_rec;
    RETURN v_rec;
  END IF;

  -- Otherwise, ensure there is a row for this user; create as CLIENTE active if missing
  SELECT * INTO v_rec
  FROM public.company_members
  WHERE company_id = _company_id AND user_id = auth.uid()
  LIMIT 1;

  IF v_rec.id IS NULL THEN
    INSERT INTO public.company_members(id, company_id, user_id, email, role, status)
    VALUES (gen_random_uuid(), _company_id, auth.uid(), lower(coalesce(_email,'')), 'CLIENTE', 'active')
    RETURNING * INTO v_rec;
  END IF;

  RETURN v_rec;
END;
$$;