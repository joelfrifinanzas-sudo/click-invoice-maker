-- Silence linter: explicit deny-all RLS policy for auth_login_attempts
DROP POLICY IF EXISTS auth_login_attempts_deny_all ON public.auth_login_attempts;
CREATE POLICY auth_login_attempts_deny_all
ON public.auth_login_attempts
AS RESTRICTIVE
FOR ALL
TO public
USING (false)
WITH CHECK (false);