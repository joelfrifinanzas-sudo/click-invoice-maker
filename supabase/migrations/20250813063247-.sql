-- Fix INSERT policy syntax: only WITH CHECK is allowed
DO $$ BEGIN
  DROP POLICY IF EXISTS uc_company_super_admin_insert ON public.user_company;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY uc_company_super_admin_insert
  ON public.user_company
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK (public.is_company_super_admin(company_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
