-- MP-2: Server-side rate limit for login attempts (5 per 15 minutes by IP/email)

-- 1) Table to log attempts
CREATE TABLE IF NOT EXISTS public.auth_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  email text NOT NULL,
  ip text,
  ok boolean NOT NULL DEFAULT false
);

-- Indexes for time-window queries
CREATE INDEX IF NOT EXISTS idx_auth_login_attempts_email_time ON public.auth_login_attempts (email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_login_attempts_ip_time ON public.auth_login_attempts (ip, created_at DESC);

-- Enable RLS (we'll use SECURITY DEFINER functions to access)
ALTER TABLE public.auth_login_attempts ENABLE ROW LEVEL SECURITY;

-- Strict default deny
DROP POLICY IF EXISTS auth_login_attempts_all ON public.auth_login_attempts;

-- 2) Function to log an attempt (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.auth_log_attempt(_email text, _ip text, _ok boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.auth_login_attempts(email, ip, ok)
  VALUES (lower(coalesce(_email,'')), nullif(_ip,''), coalesce(_ok,false));
END; $$;

-- 3) Function to check rate limit combining email and IP windows
CREATE OR REPLACE FUNCTION public.auth_rate_limit_check(_email text, _ip text, _window_mins int DEFAULT 15, _max_attempts int DEFAULT 5)
RETURNS TABLE(blocked boolean, failures int, retry_after_seconds int)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_until timestamptz := now() - make_interval(mins => _window_mins);
  v_fail_email int := 0;
  v_fail_ip int := 0;
  v_min_ts timestamptz := NULL;
BEGIN
  SELECT count(*), min(created_at)
    INTO v_fail_email, v_min_ts
  FROM public.auth_login_attempts
  WHERE ok = false
    AND email = lower(coalesce(_email,''))
    AND created_at >= v_until;

  SELECT count(*)
    INTO v_fail_ip
  FROM public.auth_login_attempts
  WHERE ok = false
    AND coalesce(ip,'') = coalesce(_ip,'')
    AND created_at >= v_until;

  failures := GREATEST(v_fail_email, v_fail_ip);
  blocked := failures >= _max_attempts;

  IF blocked AND v_min_ts IS NOT NULL THEN
    retry_after_seconds := GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (v_until + make_interval(mins => _window_mins) - v_min_ts)))::int);
  ELSE
    retry_after_seconds := 0;
  END IF;
  RETURN NEXT;
END; $$;