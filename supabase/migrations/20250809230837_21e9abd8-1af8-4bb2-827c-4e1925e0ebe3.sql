-- Listar miembros de una empresa (solo superadmin)
CREATE OR REPLACE FUNCTION public.su_company_members(_company_id uuid)
RETURNS TABLE(user_id uuid, email text, display_name text, role public.company_role)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  select u.id as user_id, u.email, p.display_name, uc.role
  from public.user_company uc
  join auth.users u on u.id = uc.user_id
  left join public.users_profiles p on p.id = u.id
  where public.has_role(auth.uid(),'superadmin') and uc.company_id = _company_id
  order by p.display_name nulls last, u.email;
$$;

-- Cambiar/definir rol de un miembro (upsert)
CREATE OR REPLACE FUNCTION public.su_company_set_member_role(
  _company_id uuid,
  _user_id uuid,
  _role public.company_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'superadmin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  INSERT INTO public.user_company(company_id, user_id, role)
  VALUES (_company_id, _user_id, _role)
  ON CONFLICT (company_id, user_id) DO UPDATE SET role = EXCLUDED.role;
END;
$$;

-- Quitar miembro de empresa
CREATE OR REPLACE FUNCTION public.su_company_remove_member(
  _company_id uuid,
  _user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'superadmin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  DELETE FROM public.user_company WHERE company_id = _company_id AND user_id = _user_id;
END;
$$;