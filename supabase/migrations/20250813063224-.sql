-- Create policies with safety guards
DO $$ BEGIN
  CREATE POLICY uc_superadmin_all
  ON public.user_company
  AS PERMISSIVE
  FOR ALL
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY uc_company_super_admin_insert
  ON public.user_company
  AS PERMISSIVE
  FOR INSERT
  USING (public.is_company_super_admin(company_id))
  WITH CHECK (public.is_company_super_admin(company_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY uc_company_super_admin_update
  ON public.user_company
  AS PERMISSIVE
  FOR UPDATE
  USING (public.is_company_super_admin(company_id))
  WITH CHECK (public.is_company_super_admin(company_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY uc_company_super_admin_delete
  ON public.user_company
  AS PERMISSIVE
  FOR DELETE
  USING (public.is_company_super_admin(company_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;