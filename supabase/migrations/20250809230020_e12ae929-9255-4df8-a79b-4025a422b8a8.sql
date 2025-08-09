-- 1) Extend companies with admin fields
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS limit_invoices_per_month integer;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS limit_users integer;

-- 2) Global roles for app: superadmin
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type typ JOIN pg_namespace n ON n.oid = typ.typnamespace WHERE typ.typname = 'app_role' AND n.nspname = 'public') THEN
    CREATE TYPE public.app_role AS ENUM ('superadmin');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.app_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.app_user_roles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'app_user_roles' AND policyname = 'own roles select'
  ) THEN
    CREATE POLICY "own roles select" ON public.app_user_roles FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'app_user_roles' AND policyname = 'own roles insert'
  ) THEN
    CREATE POLICY "own roles insert" ON public.app_user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'app_user_roles' AND policyname = 'own roles update'
  ) THEN
    CREATE POLICY "own roles update" ON public.app_user_roles FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'app_user_roles' AND policyname = 'own roles delete'
  ) THEN
    CREATE POLICY "own roles delete" ON public.app_user_roles FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 3) Role check function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  select exists (
    select 1 from public.app_user_roles where user_id = _user_id and role = _role
  );
$$;

-- 4) Super Admin RPCs (SECURITY DEFINER)
-- List all companies
CREATE OR REPLACE FUNCTION public.su_companies_list()
RETURNS SETOF public.companies
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  select c.* from public.companies c
  where public.has_role(auth.uid(), 'superadmin');
$$;

-- Upsert company (create/update)
CREATE OR REPLACE FUNCTION public.su_company_upsert(
  _id uuid,
  _name text,
  _rnc text,
  _phone text,
  _address text,
  _currency text,
  _itbis_rate numeric,
  _active boolean,
  _plan text,
  _limit_invoices_per_month integer,
  _limit_users integer,
  _owner_user_id uuid DEFAULT NULL
)
RETURNS public.companies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company public.companies;
  v_owner uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _id IS NULL THEN
    v_owner := COALESCE(_owner_user_id, auth.uid());
    INSERT INTO public.companies(id, name, rnc, phone, address, currency, itbis_rate, owner_user_id, active, plan, limit_invoices_per_month, limit_users)
    VALUES (gen_random_uuid(), _name, _rnc, _phone, _address, COALESCE(_currency,'DOP'), COALESCE(_itbis_rate,0.18), v_owner, COALESCE(_active,true), COALESCE(_plan,'free'), _limit_invoices_per_month, _limit_users)
    RETURNING * INTO v_company;
    PERFORM public.add_owner_membership(v_company.id, v_owner);
    RETURN v_company;
  ELSE
    UPDATE public.companies
    SET name = COALESCE(_name, name),
        rnc = _rnc,
        phone = _phone,
        address = _address,
        currency = COALESCE(_currency, currency),
        itbis_rate = COALESCE(_itbis_rate, itbis_rate),
        active = COALESCE(_active, active),
        plan = COALESCE(_plan, plan),
        limit_invoices_per_month = _limit_invoices_per_month,
        limit_users = _limit_users
    WHERE id = _id
    RETURNING * INTO v_company;
    RETURN v_company;
  END IF;
END;
$$;

-- Toggle active
CREATE OR REPLACE FUNCTION public.su_company_set_active(_company_id uuid, _active boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.companies SET active = COALESCE(_active, active) WHERE id = _company_id;
END;
$$;

-- List NCF sequences for a company
CREATE OR REPLACE FUNCTION public.su_list_ncf_sequences(_company_id uuid)
RETURNS TABLE(ncf_type text, next_seq bigint, company_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.ncf_type, s.next_seq, s.company_id
  FROM public.empresa_ncf_sequences s
  WHERE public.has_role(auth.uid(),'superadmin') AND s.company_id = _company_id;
$$;

-- Upsert NCF sequence
CREATE OR REPLACE FUNCTION public.su_upsert_ncf_sequence(_company_id uuid, _ncf_type text, _next_seq bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  INSERT INTO public.empresa_ncf_sequences(company_id, ncf_type, next_seq)
  VALUES (_company_id, _ncf_type, COALESCE(_next_seq,0))
  ON CONFLICT (company_id, ncf_type) DO UPDATE SET next_seq = EXCLUDED.next_seq;
END;
$$;