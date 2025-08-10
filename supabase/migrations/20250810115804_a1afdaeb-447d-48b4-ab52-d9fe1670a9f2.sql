-- Fix linter: set search_path for SQL functions
CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS text
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  select lower(coalesce((auth.jwt() ->> 'role'), ''))
$$;

CREATE OR REPLACE FUNCTION public.jwt_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  select nullif(auth.jwt() ->> 'tenant_id','')::uuid
$$;