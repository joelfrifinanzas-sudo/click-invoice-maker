-- 1) Companies: add missing columns and defaults
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS email_facturacion text,
  ADD COLUMN IF NOT EXISTS logo_url text;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='companies' AND column_name='currency'
  ) THEN
    ALTER TABLE public.companies ALTER COLUMN currency SET DEFAULT 'DOP';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='companies' AND column_name='itbis_rate'
  ) THEN
    ALTER TABLE public.companies ALTER COLUMN itbis_rate SET DEFAULT 0.18;
  END IF;
END $$;

-- 2) Profiles: ensure table and FKs
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  company_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  -- FK to auth.users(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_profiles_auth_users'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT fk_profiles_auth_users
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  -- FK to public.companies(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_profiles_company'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT fk_profiles_company
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3) RLS for companies per company_members
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='companies' AND policyname='cm_member_select'
  ) THEN
    CREATE POLICY "cm_member_select" ON public.companies
    FOR SELECT
    USING (public.is_company_member(id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='companies' AND policyname='cm_member_update'
  ) THEN
    CREATE POLICY "cm_member_update" ON public.companies
    FOR UPDATE
    USING (public.is_company_member(id))
    WITH CHECK (public.is_company_member(id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='companies' AND policyname='auth_insert_companies'
  ) THEN
    CREATE POLICY "auth_insert_companies" ON public.companies
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 4) Storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
SELECT 'company-logos', 'company-logos', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'company-logos'
);

-- Storage policies for the bucket
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='company_logos_public_select'
  ) THEN
    CREATE POLICY "company_logos_public_select"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'company-logos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='company_logos_insert_authenticated'
  ) THEN
    CREATE POLICY "company_logos_insert_authenticated"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'company-logos' AND auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='company_logos_update_authenticated'
  ) THEN
    CREATE POLICY "company_logos_update_authenticated"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'company-logos' AND auth.uid() IS NOT NULL)
    WITH CHECK (bucket_id = 'company-logos' AND auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='company_logos_delete_authenticated'
  ) THEN
    CREATE POLICY "company_logos_delete_authenticated"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'company-logos' AND auth.uid() IS NOT NULL);
  END IF;
END $$;