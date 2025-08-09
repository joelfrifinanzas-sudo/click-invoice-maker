-- MP-04 (fix): company-based RLS with mapping table

-- Create enum safely
DO $$
BEGIN
  CREATE TYPE public.company_role AS ENUM ('owner', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

-- user_company table
CREATE TABLE IF NOT EXISTS public.user_company (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.company_role NOT NULL DEFAULT 'owner',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

ALTER TABLE public.user_company ENABLE ROW LEVEL SECURITY;

-- RLS: users can read their own memberships
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_company' AND policyname='user_company_select_own'
  ) THEN
    CREATE POLICY "user_company_select_own"
    ON public.user_company
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Backfill owners from companies
INSERT INTO public.user_company (company_id, user_id, role)
SELECT c.id, c.owner_user_id, 'owner'::public.company_role
FROM public.companies c
ON CONFLICT (company_id, user_id) DO NOTHING;

-- Helper functions and trigger to auto-insert membership
CREATE OR REPLACE FUNCTION public.add_owner_membership(_company_id uuid, _user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.add_owner_membership(NEW.id, NEW.owner_user_id);
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'companies_add_owner_membership'
  ) THEN
    CREATE TRIGGER companies_add_owner_membership
    AFTER INSERT ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.companies_after_insert_membership();
  END IF;
END $$;

-- Companies policies (membership-based select/update, restricted insert)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='companies' AND policyname='company_read_companies'
  ) THEN
    CREATE POLICY "company_read_companies"
    ON public.companies
    FOR SELECT TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.user_company uc
      WHERE uc.company_id = companies.id AND uc.user_id = auth.uid()
    ));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='companies' AND policyname='company_update_companies'
  ) THEN
    CREATE POLICY "company_update_companies"
    ON public.companies
    FOR UPDATE TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.user_company uc
      WHERE uc.company_id = companies.id AND uc.user_id = auth.uid()
    ));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='companies' AND policyname='company_insert_companies'
  ) THEN
    CREATE POLICY "company_insert_companies"
    ON public.companies
    FOR INSERT TO authenticated
    WITH CHECK (owner_user_id = auth.uid());
  END IF;
END $$;

-- Helper expression: company membership check
-- Customers
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='customers' AND policyname='company_read_write'
  ) THEN
    CREATE POLICY "company_read_write"
    ON public.customers
    FOR ALL TO authenticated
    USING (
      company_id = auth.uid()::uuid OR EXISTS (
        SELECT 1 FROM public.user_company uc
        WHERE uc.company_id = customers.company_id AND uc.user_id = auth.uid()
      )
    )
    WITH CHECK (
      company_id = auth.uid()::uuid OR EXISTS (
        SELECT 1 FROM public.user_company uc
        WHERE uc.company_id = customers.company_id AND uc.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Products
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='company_read_write'
  ) THEN
    CREATE POLICY "company_read_write"
    ON public.products
    FOR ALL TO authenticated
    USING (
      company_id = auth.uid()::uuid OR EXISTS (
        SELECT 1 FROM public.user_company uc
        WHERE uc.company_id = products.company_id AND uc.user_id = auth.uid()
      )
    )
    WITH CHECK (
      company_id = auth.uid()::uuid OR EXISTS (
        SELECT 1 FROM public.user_company uc
        WHERE uc.company_id = products.company_id AND uc.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Invoices
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invoices' AND policyname='company_read_write'
  ) THEN
    CREATE POLICY "company_read_write"
    ON public.invoices
    FOR ALL TO authenticated
    USING (
      company_id = auth.uid()::uuid OR EXISTS (
        SELECT 1 FROM public.user_company uc
        WHERE uc.company_id = invoices.company_id AND uc.user_id = auth.uid()
      )
    )
    WITH CHECK (
      company_id = auth.uid()::uuid OR EXISTS (
        SELECT 1 FROM public.user_company uc
        WHERE uc.company_id = invoices.company_id AND uc.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Invoice items (via invoice)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invoice_items' AND policyname='company_read_write'
  ) THEN
    CREATE POLICY "company_read_write"
    ON public.invoice_items
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.invoices i
        JOIN public.user_company uc ON uc.company_id = i.company_id AND uc.user_id = auth.uid()
        WHERE i.id = invoice_items.invoice_id
      ) OR EXISTS (
        SELECT 1 FROM public.invoices i2
        WHERE i2.id = invoice_items.invoice_id AND i2.company_id = auth.uid()::uuid
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.invoices i
        JOIN public.user_company uc ON uc.company_id = i.company_id AND uc.user_id = auth.uid()
        WHERE i.id = invoice_items.invoice_id
      ) OR EXISTS (
        SELECT 1 FROM public.invoices i2
        WHERE i2.id = invoice_items.invoice_id AND i2.company_id = auth.uid()::uuid
      )
    );
  END IF;
END $$;

-- Payments (via invoice)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payments' AND policyname='company_read_write'
  ) THEN
    CREATE POLICY "company_read_write"
    ON public.payments
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.invoices i
        JOIN public.user_company uc ON uc.company_id = i.company_id AND uc.user_id = auth.uid()
        WHERE i.id = payments.invoice_id
      ) OR EXISTS (
        SELECT 1 FROM public.invoices i2
        WHERE i2.id = payments.invoice_id AND i2.company_id = auth.uid()::uuid
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.invoices i
        JOIN public.user_company uc ON uc.company_id = i.company_id AND uc.user_id = auth.uid()
        WHERE i.id = payments.invoice_id
      ) OR EXISTS (
        SELECT 1 FROM public.invoices i2
        WHERE i2.id = payments.invoice_id AND i2.company_id = auth.uid()::uuid
      )
    );
  END IF;
END $$;