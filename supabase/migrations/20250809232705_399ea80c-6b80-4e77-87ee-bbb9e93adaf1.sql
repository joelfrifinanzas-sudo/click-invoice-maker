-- Root superadmin support
-- To set the root account email (superadmin), run:
--   select public.su_set_root_email('root@example.com');
-- Replace with the desired email.

-- 1) Table to mark root users (global superadmins)
CREATE TABLE IF NOT EXISTS public.app_roots (
  user_id uuid PRIMARY KEY,
  email text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_roots ENABLE ROW LEVEL SECURITY;
-- Only superadmins can see/modify (prevents appearing in normal lists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='app_roots' AND policyname='superadmin_select_roots'
  ) THEN
    CREATE POLICY superadmin_select_roots ON public.app_roots FOR SELECT USING (public.has_role(auth.uid(),'superadmin'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='app_roots' AND policyname='superadmin_modify_roots'
  ) THEN
    CREATE POLICY superadmin_modify_roots ON public.app_roots FOR ALL USING (public.has_role(auth.uid(),'superadmin')) WITH CHECK (public.has_role(auth.uid(),'superadmin'));
  END IF;
END $$;

-- 2) Update has_role to honor app_roots for superadmin
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  select
    case
      when _role = 'superadmin' then (
        exists (select 1 from public.app_roots r where r.user_id = _user_id)
        or exists (select 1 from public.app_user_roles ur where ur.user_id = _user_id and ur.role = 'superadmin')
      )
      else exists (select 1 from public.app_user_roles ur where ur.user_id = _user_id and ur.role = _role)
    end
$$;

-- 3) Function to assign root by email
CREATE OR REPLACE FUNCTION public.su_set_root_email(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid;
BEGIN
  -- Find user in auth by email
  SELECT id INTO v_user FROM auth.users WHERE lower(email) = lower(_email) LIMIT 1;
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'No existe un usuario con ese email: %', _email;
  END IF;

  -- Register as root
  INSERT INTO public.app_roots(user_id, email)
  VALUES (v_user, _email)
  ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;

  -- Also ensure an app_user_roles entry exists (optional but convenient)
  INSERT INTO public.app_user_roles(user_id, role)
  VALUES (v_user, 'superadmin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- 4) Hide root users from the global users directory by default (optional)
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
    and not exists (select 1 from public.app_roots r where r.user_id = u.id)
    and (_name  is null or coalesce(p.display_name,'') ilike '%'||_name||'%')
    and (_email is null or coalesce(u.email,'')       ilike '%'||_email||'%')
  order by u.last_sign_in_at desc nulls last, u.created_at desc;
$$;