-- 1) Ensure users_profiles has last_company_id column (profiles is a view in this project)
ALTER TABLE public.users_profiles
ADD COLUMN IF NOT EXISTS last_company_id uuid;

-- 2) Create view to list current user's active memberships
CREATE OR REPLACE VIEW public.my_memberships AS
SELECT 
  m.company_id,
  c.name AS company_name,
  m.role
FROM public.company_members m
JOIN public.companies c ON c.id = m.company_id
WHERE m.user_id = auth.uid() AND m.status = 'active';