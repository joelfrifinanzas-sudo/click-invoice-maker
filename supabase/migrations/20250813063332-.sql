-- Create UPDATE and DELETE policies for company SUPER_ADMIN
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