-- Listado global de usuarios con filtros y últimos accesos (solo superadmin)
CREATE OR REPLACE FUNCTION public.su_users_list(
  _name text DEFAULT NULL,
  _email text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  email text,
  display_name text,
  phone text,
  companies_count integer,
  last_sign_in_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  select 
    u.id,
    u.email,
    p.display_name,
    p.phone,
    coalesce((select count(*) from public.user_company uc where uc.user_id = u.id),0) as companies_count,
    u.last_sign_in_at
  from auth.users u
  left join public.users_profiles p on p.id = u.id
  where public.has_role(auth.uid(),'superadmin')
    and (_name  is null or coalesce(p.display_name,'') ilike '%'||_name||'%')
    and (_email is null or coalesce(u.email,'')       ilike '%'||_email||'%')
  order by u.last_sign_in_at desc nulls last, u.created_at desc;
$$;

-- Membresías por usuario
CREATE OR REPLACE FUNCTION public.su_user_memberships(_user_id uuid)
RETURNS TABLE(company_id uuid, company_name text, role public.company_role)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  select uc.company_id, c.name as company_name, uc.role
  from public.user_company uc
  join public.companies c on c.id = uc.company_id
  where public.has_role(auth.uid(),'superadmin') and uc.user_id = _user_id
  order by c.created_at desc;
$$;

-- Agregar/actualizar membresía (no elimina)
CREATE OR REPLACE FUNCTION public.su_add_user_to_company(
  _user_id uuid,
  _company_id uuid,
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
  INSERT INTO public.user_company(user_id, company_id, role)
  VALUES (_user_id, _company_id, _role)
  ON CONFLICT (company_id, user_id)
  DO UPDATE SET role = EXCLUDED.role;
END;
$$;