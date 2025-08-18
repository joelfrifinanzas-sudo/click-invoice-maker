-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_company table
CREATE TABLE IF NOT EXISTS public.user_company (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin','cajera','cliente')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','disabled')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY(user_id, company_id)
);

-- Create company_members_v view
CREATE OR REPLACE VIEW public.company_members_v AS
SELECT 
  uc.company_id, 
  uc.role, 
  uc.status, 
  p.email, 
  p.full_name, 
  uc.user_id,
  uc.created_at
FROM public.user_company uc 
JOIN public.profiles p ON p.id = uc.user_id;

-- Helper function: is_member
CREATE OR REPLACE FUNCTION public.is_member(company_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_company uc 
    WHERE uc.user_id = auth.uid() 
      AND uc.company_id = company_uuid 
      AND uc.status = 'active'
  );
$$;

-- Helper function: is_admin
CREATE OR REPLACE FUNCTION public.is_admin(company_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_company uc 
    WHERE uc.user_id = auth.uid() 
      AND uc.company_id = company_uuid 
      AND uc.role = 'admin' 
      AND uc.status = 'active'
  );
$$;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_company ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- RLS policies for companies
DROP POLICY IF EXISTS "Members can view companies" ON public.companies;
CREATE POLICY "Members can view companies" ON public.companies
  FOR SELECT USING (public.is_member(id));

DROP POLICY IF EXISTS "Owners can update companies" ON public.companies;
CREATE POLICY "Owners can update companies" ON public.companies
  FOR UPDATE USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;
CREATE POLICY "Authenticated users can create companies" ON public.companies
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- RLS policies for user_company
DROP POLICY IF EXISTS "Members can view company memberships" ON public.user_company;
CREATE POLICY "Members can view company memberships" ON public.user_company
  FOR SELECT USING (public.is_member(company_id));

DROP POLICY IF EXISTS "Admins can manage memberships" ON public.user_company;
CREATE POLICY "Admins can manage memberships" ON public.user_company
  FOR ALL USING (public.is_admin(company_id));

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_company_company_id ON public.user_company(company_id);
CREATE INDEX IF NOT EXISTS idx_user_company_user_id ON public.user_company(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);