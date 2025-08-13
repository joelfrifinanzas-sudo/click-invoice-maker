-- Fix RLS errors when inserting into user_company by allowing superadmins and company SUPER_ADMINs to manage memberships
-- 1) Superadmin full access
CREATE POLICY IF NOT EXISTS uc_superadmin_all
ON public.user_company
AS PERMISSIVE
FOR ALL
USING (public.has_role(auth.uid(), 'superadmin'))
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- 2) Company SUPER_ADMIN can manage members
CREATE POLICY IF NOT EXISTS uc_company_super_admin_insert
ON public.user_company
AS PERMISSIVE
FOR INSERT
USING (public.is_company_super_admin(company_id))
WITH CHECK (public.is_company_super_admin(company_id));

CREATE POLICY IF NOT EXISTS uc_company_super_admin_update
ON public.user_company
AS PERMISSIVE
FOR UPDATE
USING (public.is_company_super_admin(company_id))
WITH CHECK (public.is_company_super_admin(company_id));

CREATE POLICY IF NOT EXISTS uc_company_super_admin_delete
ON public.user_company
AS PERMISSIVE
FOR DELETE
USING (public.is_company_super_admin(company_id));