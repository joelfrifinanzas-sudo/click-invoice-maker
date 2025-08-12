-- 1) Helper function: check if current user is SUPER_ADMIN of a company
CREATE OR REPLACE FUNCTION public.is_company_super_admin(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1
    from public.company_members m
    where m.company_id = _company_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = 'SUPER_ADMIN'
  );
$$;

-- 2) Ensure unique index on company_members(company_id,email)
CREATE UNIQUE INDEX IF NOT EXISTS company_members_company_email_key
ON public.company_members (company_id, email);

-- 3) Enable RLS (idempotent)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- 4) Drop conflicting/legacy policies (if they exist)
-- products
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='Products owner can delete') THEN
    DROP POLICY "Products owner can delete" ON public.products;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='products_insert') THEN
    DROP POLICY "products_insert" ON public.products;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='products_select') THEN
    DROP POLICY "products_select" ON public.products;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='products_update') THEN
    DROP POLICY "products_update" ON public.products;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='cm_delete_products_admin_only') THEN
    DROP POLICY "cm_delete_products_admin_only" ON public.products;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='cm_insert_products_admin_only') THEN
    DROP POLICY "cm_insert_products_admin_only" ON public.products;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='cm_read_products') THEN
    DROP POLICY "cm_read_products" ON public.products;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='cm_update_products_admin_only') THEN
    DROP POLICY "cm_update_products_admin_only" ON public.products;
  END IF;
END $$;

-- clients
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='clients' AND policyname='clients_delete') THEN
    DROP POLICY "clients_delete" ON public.clients;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='clients' AND policyname='clients_insert') THEN
    DROP POLICY "clients_insert" ON public.clients;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='clients' AND policyname='clients_select') THEN
    DROP POLICY "clients_select" ON public.clients;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='clients' AND policyname='clients_update') THEN
    DROP POLICY "clients_update" ON public.clients;
  END IF;
END $$;

-- company_members
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='company_members' AND policyname='cmembers_admin_delete') THEN
    DROP POLICY "cmembers_admin_delete" ON public.company_members;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='company_members' AND policyname='cmembers_admin_insert') THEN
    DROP POLICY "cmembers_admin_insert" ON public.company_members;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='company_members' AND policyname='cmembers_admin_update') THEN
    DROP POLICY "cmembers_admin_update" ON public.company_members;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='company_members' AND policyname='cmembers_select_same_company') THEN
    DROP POLICY "cmembers_select_same_company" ON public.company_members;
  END IF;
END $$;

-- 5) New policies per spec
-- products: SELECT by active member; mutate only SUPER_ADMIN/ADMIN
CREATE POLICY prod_select_member
ON public.products
FOR SELECT
USING (public.is_company_member(company_id));

CREATE POLICY prod_insert_admin
ON public.products
FOR INSERT
WITH CHECK (public.is_company_admin(company_id));

CREATE POLICY prod_update_admin
ON public.products
FOR UPDATE
USING (public.is_company_admin(company_id))
WITH CHECK (public.is_company_admin(company_id));

CREATE POLICY prod_delete_admin
ON public.products
FOR DELETE
USING (public.is_company_admin(company_id));

-- clients: tenant_id is the company reference
CREATE POLICY clients_select_member
ON public.clients
FOR SELECT
USING (public.is_company_member(tenant_id));

CREATE POLICY clients_insert_admin
ON public.clients
FOR INSERT
WITH CHECK (public.is_company_admin(tenant_id));

CREATE POLICY clients_update_admin
ON public.clients
FOR UPDATE
USING (public.is_company_admin(tenant_id))
WITH CHECK (public.is_company_admin(tenant_id));

CREATE POLICY clients_delete_admin
ON public.clients
FOR DELETE
USING (public.is_company_admin(tenant_id));

-- company_members: select by active member
CREATE POLICY cm_select_member
ON public.company_members
FOR SELECT
USING (public.is_company_member(company_id));

CREATE POLICY cm_insert_admin
ON public.company_members
FOR INSERT
WITH CHECK (public.is_company_admin(company_id));

CREATE POLICY cm_delete_admin
ON public.company_members
FOR DELETE
USING (public.is_company_admin(company_id));

-- Allow admins to update non-sensitive fields; guard will enforce restrictions
CREATE POLICY cm_update_admin
ON public.company_members
FOR UPDATE
USING (public.is_company_admin(company_id))
WITH CHECK (public.is_company_admin(company_id));

-- 6) BEFORE UPDATE trigger to restrict role/status changes to SUPER_ADMIN only
CREATE OR REPLACE FUNCTION public.company_members_before_update_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role) OR (NEW.status IS DISTINCT FROM OLD.status) THEN
    IF NOT public.is_company_super_admin(NEW.company_id) THEN
      RAISE EXCEPTION 'Solo SUPER_ADMIN puede cambiar rol o status en company_members';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_company_members_before_update_guard'
  ) THEN
    CREATE TRIGGER trg_company_members_before_update_guard
    BEFORE UPDATE ON public.company_members
    FOR EACH ROW EXECUTE FUNCTION public.company_members_before_update_guard();
  END IF;
END $$;

-- 7) Trigger on auth.users to ensure a profile row exists in users_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users_profiles(id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created_profiles'
  ) THEN
    CREATE TRIGGER on_auth_user_created_profiles
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
  END IF;
END $$;

-- 8) Optional: expose a simple view named profiles for compatibility if needed
CREATE OR REPLACE VIEW public.profiles AS
SELECT id, company_id, created_at
FROM public.users_profiles;