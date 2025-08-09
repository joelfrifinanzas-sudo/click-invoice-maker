-- Make helper membership functions use SECURITY INVOKER (remove SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.add_owner_membership(_company_id uuid, _user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_company(company_id, user_id, role)
  VALUES (_company_id, _user_id, 'owner')
  ON CONFLICT (company_id, user_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.companies_after_insert_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.add_owner_membership(NEW.id, NEW.owner_user_id);
  RETURN NEW;
END;
$$;