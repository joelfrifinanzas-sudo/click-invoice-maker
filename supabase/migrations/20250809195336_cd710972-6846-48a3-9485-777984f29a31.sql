-- MP-06: Storage buckets and policies

-- 1) Create buckets
insert into storage.buckets (id, name, public)
values
  ('company_branding', 'company_branding', true),
  ('invoices_pdfs', 'invoices_pdfs', false),
  ('uploads', 'uploads', false)
on conflict (id) do nothing;

-- 2) Policies on storage.objects
-- Public read for company_branding
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='company_branding_public_read'
  ) THEN
    CREATE POLICY "company_branding_public_read"
    ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'company_branding');
  END IF;
END $$;

-- Authenticated write on company_branding constrained by company folder
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='company_branding_insert_members'
  ) THEN
    CREATE POLICY "company_branding_insert_members"
    ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'company_branding' AND EXISTS (
        SELECT 1 FROM public.user_company uc
        WHERE uc.user_id = auth.uid()
          AND uc.company_id::text = (storage.foldername(name))[1]
      )
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='company_branding_update_members'
  ) THEN
    CREATE POLICY "company_branding_update_members"
    ON storage.objects
    FOR UPDATE TO authenticated
    USING (
      bucket_id = 'company_branding' AND EXISTS (
        SELECT 1 FROM public.user_company uc
        WHERE uc.user_id = auth.uid()
          AND uc.company_id::text = (storage.foldername(name))[1]
      )
    )
    WITH CHECK (
      bucket_id = 'company_branding' AND EXISTS (
        SELECT 1 FROM public.user_company uc
        WHERE uc.user_id = auth.uid()
          AND uc.company_id::text = (storage.foldername(name))[1]
      )
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='company_branding_delete_members'
  ) THEN
    CREATE POLICY "company_branding_delete_members"
    ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = 'company_branding' AND EXISTS (
        SELECT 1 FROM public.user_company uc
        WHERE uc.user_id = auth.uid()
          AND uc.company_id::text = (storage.foldername(name))[1]
      )
    );
  END IF;
END $$;

-- Private buckets: invoices_pdfs and uploads
-- Helper condition repeated inline to keep policies simple

-- invoices_pdfs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='invoices_pdfs_select_members'
  ) THEN
    CREATE POLICY "invoices_pdfs_select_members"
    ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = 'invoices_pdfs' AND EXISTS (
        SELECT 1 FROM public.user_company uc
        WHERE uc.user_id = auth.uid()
          AND uc.company_id::text = (storage.foldername(name))[1]
      )
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='invoices_pdfs_insert_members'
  ) THEN
    CREATE POLICY "invoices_pdfs_insert_members"
    ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'invoices_pdfs' AND EXISTS (
        SELECT 1 FROM public.user_company uc
        WHERE uc.user_id = auth.uid()
          AND uc.company_id::text = (storage.foldername(name))[1]
      )
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='invoices_pdfs_update_members'
  ) THEN
    CREATE POLICY "invoices_pdfs_update_members"
    ON storage.objects
    FOR UPDATE TO authenticated
    USING (
      bucket_id = 'invoices_pdfs' AND EXISTS (
        SELECT 1 FROM public.user_company uc
        WHERE uc.user_id = auth.uid()
          AND uc.company_id::text = (storage.foldername(name))[1]
      )
    )
    WITH CHECK (
      bucket_id = 'invoices_pdfs' AND EXISTS (
        SELECT 1 FROM public.user_company uc
        WHERE uc.user_id = auth.uid()
          AND uc.company_id::text = (storage.foldername(name))[1]
      )
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='invoices_pdfs_delete_members'
  ) THEN
    CREATE POLICY "invoices_pdfs_delete_members"
    ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = 'invoices_pdfs' AND EXISTS (
        SELECT 1 FROM public.user_company uc
        WHERE uc.user_id = auth.uid()
          AND uc.company_id::text = (storage.foldername(name))[1]
      )
    );
  END IF;
END $$;

-- uploads
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='uploads_select_members'
  ) THEN
    CREATE POLICY "uploads_select_members"
    ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = 'uploads' AND EXISTS (
        SELECT 1 FROM public.user_company uc
        WHERE uc.user_id = auth.uid()
          AND uc.company_id::text = (storage.foldername(name))[1]
      )
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='uploads_insert_members'
  ) THEN
    CREATE POLICY "uploads_insert_members"
    ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'uploads' AND EXISTS (
        SELECT 1 FROM public.user_company uc
        WHERE uc.user_id = auth.uid()
          AND uc.company_id::text = (storage.foldername(name))[1]
      )
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='uploads_update_members'
  ) THEN
    CREATE POLICY "uploads_update_members"
    ON storage.objects
    FOR UPDATE TO authenticated
    USING (
      bucket_id = 'uploads' AND EXISTS (
        SELECT 1 FROM public.user_company uc
        WHERE uc.user_id = auth.uid()
          AND uc.company_id::text = (storage.foldername(name))[1]
      )
    )
    WITH CHECK (
      bucket_id = 'uploads' AND EXISTS (
        SELECT 1 FROM public.user_company uc
        WHERE uc.user_id = auth.uid()
          AND uc.company_id::text = (storage.foldername(name))[1]
      )
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='uploads_delete_members'
  ) THEN
    CREATE POLICY "uploads_delete_members"
    ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = 'uploads' AND EXISTS (
        SELECT 1 FROM public.user_company uc
        WHERE uc.user_id = auth.uid()
          AND uc.company_id::text = (storage.foldername(name))[1]
      )
    );
  END IF;
END $$;