-- Plans catalog
CREATE TABLE IF NOT EXISTS public.app_plans (
  name text PRIMARY KEY,
  description text,
  limit_invoices_per_month integer,
  limit_users integer,
  storage_limit_mb integer,
  features jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_app_plans_updated_at'
  ) THEN
    CREATE TRIGGER trg_app_plans_updated_at
    BEFORE UPDATE ON public.app_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- RLS: only superadmin can manage/select
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='app_plans' AND policyname='superadmin_select'
  ) THEN
    CREATE POLICY superadmin_select ON public.app_plans FOR SELECT USING (public.has_role(auth.uid(),'superadmin'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='app_plans' AND policyname='superadmin_insert'
  ) THEN
    CREATE POLICY superadmin_insert ON public.app_plans FOR INSERT WITH CHECK (public.has_role(auth.uid(),'superadmin'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='app_plans' AND policyname='superadmin_update'
  ) THEN
    CREATE POLICY superadmin_update ON public.app_plans FOR UPDATE USING (public.has_role(auth.uid(),'superadmin'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='app_plans' AND policyname='superadmin_delete'
  ) THEN
    CREATE POLICY superadmin_delete ON public.app_plans FOR DELETE USING (public.has_role(auth.uid(),'superadmin'));
  END IF;
END $$;

-- Companies override: storage limit
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS storage_limit_mb integer;

-- RPCs to manage plans
CREATE OR REPLACE FUNCTION public.su_plans_list()
RETURNS SETOF public.app_plans
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM public.app_plans WHERE public.has_role(auth.uid(),'superadmin');
$$;

CREATE OR REPLACE FUNCTION public.su_plan_upsert(
  _name text,
  _description text,
  _limit_invoices_per_month integer,
  _limit_users integer,
  _storage_limit_mb integer,
  _features jsonb DEFAULT '{}'::jsonb
)
RETURNS public.app_plans
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_plan public.app_plans;
BEGIN
  IF NOT public.has_role(auth.uid(),'superadmin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  INSERT INTO public.app_plans(name, description, limit_invoices_per_month, limit_users, storage_limit_mb, features)
  VALUES (_name, _description, _limit_invoices_per_month, _limit_users, _storage_limit_mb, COALESCE(_features,'{}'::jsonb))
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    limit_invoices_per_month = EXCLUDED.limit_invoices_per_month,
    limit_users = EXCLUDED.limit_users,
    storage_limit_mb = EXCLUDED.storage_limit_mb,
    features = EXCLUDED.features,
    updated_at = now()
  RETURNING * INTO v_plan;
  RETURN v_plan;
END;
$$;

-- Update company upsert RPC to accept storage_limit_mb as override
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
  _owner_user_id uuid DEFAULT NULL,
  _storage_limit_mb integer DEFAULT NULL
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
  IF NOT public.has_role(auth.uid(),'superadmin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _id IS NULL THEN
    v_owner := COALESCE(_owner_user_id, auth.uid());
    INSERT INTO public.companies(id, name, rnc, phone, address, currency, itbis_rate, owner_user_id, active, plan, limit_invoices_per_month, limit_users, storage_limit_mb)
    VALUES (gen_random_uuid(), _name, _rnc, _phone, _address, COALESCE(_currency,'DOP'), COALESCE(_itbis_rate,0.18), v_owner, COALESCE(_active,true), COALESCE(_plan,'free'), _limit_invoices_per_month, _limit_users, _storage_limit_mb)
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
        limit_users = _limit_users,
        storage_limit_mb = _storage_limit_mb
    WHERE id = _id
    RETURNING * INTO v_company;
    RETURN v_company;
  END IF;
END;
$$;