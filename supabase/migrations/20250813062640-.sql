-- Grant superadmin to specific user by email and sync claims
-- 1) Ensure a row exists in app_roots for this email
INSERT INTO public.app_roots(user_id, email)
SELECT u.id, u.email
FROM auth.users u
WHERE lower(u.email) = lower('joelfri94@gmail.com')
ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;

-- 2) Ensure explicit app_user_roles entry exists
INSERT INTO public.app_user_roles(user_id, role)
SELECT u.id, 'superadmin'::public.app_role
FROM auth.users u
WHERE lower(u.email) = lower('joelfri94@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- 3) Sync JWT claims so the frontend sees role immediately
SELECT public.sync_user_claims(u.id)
FROM auth.users u
WHERE lower(u.email) = lower('joelfri94@gmail.com');