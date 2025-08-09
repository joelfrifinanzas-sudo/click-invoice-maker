-- Membership assistance utilities

-- 0) Invites table (optional) for pending owners or members
CREATE TABLE IF NOT EXISTS public.app_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  company_id uuid NOT NULL,
  role public.company_role NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'pending', -- pending | accepted | canceled
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_invites ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='app_invites' AND policyname='superadmin_rw_invites'
  ) THEN
    CREATE POLICY superadmin_rw_invites ON public.app_invites FOR ALL USING (public.has_role(auth.uid(),'superadmin')) WITH CHECK (public.has_role(auth.uid(),'superadmin'));
  END IF;
END $$;

-- 1) Users without membership in any active company
CREATE OR REPLACE FUNCTION public.su_users_without_membership()
RETURNS TABLE(id uuid, email text, display_name text, last_sign_in_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT u.id, u.email, p.display_name, u.last_sign_in_at
  FROM auth.users u
  LEFT JOIN public.users_profiles p ON p.id = u.id
  WHERE public.has_role(auth.uid(),'superadmin')
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_company uc
      JOIN public.companies c ON c.id = uc.company_id AND c.active = true
      WHERE uc.user_id = u.id
    );
$$;

-- 2) Assign or invite owner by email
CREATE OR REPLACE FUNCTION public.su_invite_or_assign_owner(_company_id uuid, _owner_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_user uuid; BEGIN
  IF NOT public.has_role(auth.uid(),'superadmin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT id INTO v_user FROM auth.users WHERE lower(email) = lower(_owner_email) LIMIT 1;
  IF v_user IS NULL THEN
    INSERT INTO public.app_invites(email, company_id, role, status) VALUES (_owner_email, _company_id, 'owner', 'pending')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_company(company_id, user_id, role)
    VALUES (_company_id, v_user, 'owner')
    ON CONFLICT (company_id, user_id) DO UPDATE SET role = EXCLUDED.role;
    PERFORM public.audit_log('role_changed', _company_id, v_user, 'Propietario asignado', jsonb_build_object('role','owner','email',_owner_email));
  END IF;
END; $$;

-- 3) Assign cashiers by email domain heuristic
CREATE OR REPLACE FUNCTION public.su_assign_cashier_by_domain(_company_id uuid, _domain text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_count int := 0; r record; BEGIN
  IF NOT public.has_role(auth.uid(),'superadmin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  FOR r IN SELECT id, email FROM auth.users WHERE email ILIKE '%'||'@'||_domain LOOP
    BEGIN
      INSERT INTO public.user_company(company_id, user_id, role)
      VALUES (_company_id, r.id, 'cashier')
      ON CONFLICT (company_id, user_id) DO UPDATE SET role = EXCLUDED.role;
      PERFORM public.audit_log('role_changed', _company_id, r.id, 'Rol asignado por dominio', jsonb_build_object('role','cashier','email',r.email));
      v_count := v_count + 1;
    EXCEPTION WHEN others THEN CONTINUE; END;
  END LOOP;
  RETURN v_count;
END; $$;

-- 4) Assign members by list of user ids
CREATE OR REPLACE FUNCTION public.su_assign_members(_company_id uuid, _user_ids uuid[], _role public.company_role)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_count int := 0; v_id uuid; BEGIN
  IF NOT public.has_role(auth.uid(),'superadmin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  FOREACH v_id IN ARRAY _user_ids LOOP
    BEGIN
      INSERT INTO public.user_company(company_id, user_id, role)
      VALUES (_company_id, v_id, _role)
      ON CONFLICT (company_id, user_id) DO UPDATE SET role = EXCLUDED.role;
      PERFORM public.audit_log('role_changed', _company_id, v_id, 'Rol asignado por lista', jsonb_build_object('role',_role));
      v_count := v_count + 1;
    EXCEPTION WHEN others THEN CONTINUE; END;
  END LOOP;
  RETURN v_count;
END; $$;