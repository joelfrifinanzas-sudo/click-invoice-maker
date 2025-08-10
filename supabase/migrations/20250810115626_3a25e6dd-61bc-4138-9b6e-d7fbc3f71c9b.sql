-- MP-1: Auth + Roles + RBAC foundation without breaking existing modules
-- 1) Enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'global_role') THEN
    CREATE TYPE public.global_role AS ENUM ('super_admin','admin','cajera','cliente');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
    CREATE TYPE public.account_status AS ENUM ('active','suspended');
  END IF;
END $$;

-- 2) Extend users_profiles with global fields (non-breaking, all optional except status)
ALTER TABLE public.users_profiles
  ADD COLUMN IF NOT EXISTS global_role public.global_role,
  ADD COLUMN IF NOT EXISTS status public.account_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_login timestamptz,
  ADD COLUMN IF NOT EXISTS tenant_id uuid;

-- 3) Helpers: compute role and tenant from existing data
CREATE OR REPLACE FUNCTION public.compute_global_role(_user_id uuid)
RETURNS public.global_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_role public.global_role;
BEGIN
  -- Super admin override (existing model)
  IF public.has_role(_user_id, 'superadmin') THEN
    RETURN 'super_admin';
  END IF;

  -- Company-based roles
  IF EXISTS (
    SELECT 1 FROM public.user_company uc
    WHERE uc.user_id = _user_id AND uc.role IN ('owner','admin','manager','supervisor')
  ) THEN
    RETURN 'admin';
  ELSIF EXISTS (
    SELECT 1 FROM public.user_company uc
    WHERE uc.user_id = _user_id AND uc.role IN ('cashier')
  ) THEN
    RETURN 'cajera';
  END IF;

  RETURN 'cliente';
END; $$;

CREATE OR REPLACE FUNCTION public.resolve_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_tenant uuid;
BEGIN
  -- Prefer explicit profile.tenant_id, then profile.company_id, then first membership
  SELECT COALESCE(up.tenant_id, up.company_id) INTO v_tenant
  FROM public.users_profiles up WHERE up.id = _user_id;

  IF v_tenant IS NOT NULL THEN RETURN v_tenant; END IF;

  SELECT uc.company_id INTO v_tenant
  FROM public.user_company uc
  WHERE uc.user_id = _user_id
  ORDER BY uc.created_at ASC
  LIMIT 1;

  RETURN v_tenant;  -- may be null
END; $$;

-- 4) Expose JWT helpers (for policies and server checks)
CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  select lower(coalesce((auth.jwt() ->> 'role'), ''))
$$;

CREATE OR REPLACE FUNCTION public.jwt_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  select nullif(auth.jwt() ->> 'tenant_id','')::uuid
$$;

-- 5) Sync user claims into auth.users metadata
CREATE OR REPLACE FUNCTION public.sync_user_claims(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role public.global_role;
  v_tenant uuid;
  v_status public.account_status;
  v_meta jsonb;
BEGIN
  SELECT public.compute_global_role(_user_id) INTO v_role;
  SELECT public.resolve_tenant_id(_user_id) INTO v_tenant;
  SELECT COALESCE(up.status, 'active') INTO v_status FROM public.users_profiles up WHERE up.id = _user_id;

  -- Merge into raw_user_meta_data
  UPDATE auth.users u
  SET raw_user_meta_data = COALESCE(u.raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', v_role::text)
    || jsonb_build_object('tenant_id', v_tenant::text)
    || jsonb_build_object('status', v_status::text)
  WHERE u.id = _user_id;
END; $$;

-- 6) Trigger to keep claims in sync when profile changes
CREATE OR REPLACE FUNCTION public.users_profiles_after_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.sync_user_claims(NEW.id);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_users_profiles_after_change ON public.users_profiles;
CREATE TRIGGER trg_users_profiles_after_change
AFTER INSERT OR UPDATE ON public.users_profiles
FOR EACH ROW EXECUTE FUNCTION public.users_profiles_after_change();

-- 7) Lightweight RPC to touch login and refresh claims
CREATE OR REPLACE FUNCTION public.touch_login()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.users_profiles SET last_login = now() WHERE id = auth.uid();
  PERFORM public.sync_user_claims(auth.uid());
  RETURN true;
END; $$;

-- 8) Optional RPC to force sync
CREATE OR REPLACE FUNCTION public.sync_my_claims()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.sync_user_claims(auth.uid());
  RETURN true;
END; $$;
