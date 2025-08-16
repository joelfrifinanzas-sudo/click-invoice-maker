-- Create canonical clients table with proper structure
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  company_id UUID NOT NULL,
  created_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON public.clients (company_id);
CREATE INDEX IF NOT EXISTS idx_clients_status_archived ON public.clients (status, archived);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_company_email_unique 
ON public.clients (company_id, email) 
WHERE email IS NOT NULL;

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "clients_select_company_members" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_company_members" ON public.clients;
DROP POLICY IF EXISTS "clients_update_company_members" ON public.clients;

-- RLS Policy: SELECT - allow when user is active member of the client's company
CREATE POLICY "clients_select_company_members" 
ON public.clients 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_company uc 
    WHERE uc.user_id = auth.uid() 
      AND uc.company_id = clients.company_id 
      AND uc.role IN ('owner', 'admin', 'manager', 'supervisor', 'cashier', 'cajera', 'employee')
  )
);

-- RLS Policy: INSERT - allow when user is active member of target company and sets created_by correctly
CREATE POLICY "clients_insert_company_members" 
ON public.clients 
FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT uc.company_id 
    FROM public.user_company uc 
    WHERE uc.user_id = auth.uid() 
      AND uc.role IN ('owner', 'admin', 'manager', 'supervisor', 'cashier', 'cajera', 'employee')
  ) 
  AND created_by = auth.uid()
);

-- RLS Policy: UPDATE - allow when user is active member and stays within same company
CREATE POLICY "clients_update_company_members" 
ON public.clients 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_company uc 
    WHERE uc.user_id = auth.uid() 
      AND uc.company_id = clients.company_id 
      AND uc.role IN ('owner', 'admin', 'manager', 'supervisor', 'cashier', 'cajera', 'employee')
  )
)
WITH CHECK (
  company_id IN (
    SELECT uc.company_id 
    FROM public.user_company uc 
    WHERE uc.user_id = auth.uid() 
      AND uc.role IN ('owner', 'admin', 'manager', 'supervisor', 'cashier', 'cajera', 'employee')
  )
);

-- Migrate data from existing clientes table to clients table
INSERT INTO public.clients (name, phone, email, company_id, created_by, status, archived, created_at)
SELECT 
  nombre as name,
  telefono as phone,
  email,
  company_id,
  COALESCE(created_by, company_id) as created_by, -- fallback to company_id if created_by is null
  COALESCE(status, 'active') as status,
  COALESCE(archived, false) as archived,
  created_at
FROM public.clientes
WHERE NOT EXISTS (
  SELECT 1 FROM public.clients c2 
  WHERE c2.company_id = clientes.company_id 
    AND c2.name = clientes.nombre
    AND COALESCE(c2.email, '') = COALESCE(clientes.email, '')
)
ON CONFLICT DO NOTHING;

-- Mark clientes table as deprecated by adding a comment
COMMENT ON TABLE public.clientes IS 'DEPRECATED: Use public.clients table instead. This table should not receive new writes.';

-- Migrate data from customers table if it exists and has data
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers' AND table_schema = 'public') THEN
    INSERT INTO public.clients (name, phone, email, company_id, created_by, status, archived, created_at)
    SELECT 
      name,
      phone,
      email,
      company_id,
      COALESCE(owner_user_id, company_id) as created_by,
      'active' as status,
      false as archived,
      created_at
    FROM public.customers
    WHERE NOT EXISTS (
      SELECT 1 FROM public.clients c2 
      WHERE c2.company_id = customers.company_id 
        AND c2.name = customers.name
        AND COALESCE(c2.email, '') = COALESCE(customers.email, '')
    )
    ON CONFLICT DO NOTHING;
    
    -- Mark customers table as deprecated
    COMMENT ON TABLE public.customers IS 'DEPRECATED: Use public.clients table instead. This table should not receive new writes.';
  END IF;
END $$;