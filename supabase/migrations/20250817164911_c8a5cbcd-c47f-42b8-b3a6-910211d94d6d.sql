-- Drop table if it exists to start fresh
DROP TABLE IF EXISTS public.clients CASCADE;

-- Create canonical clients table with proper structure
CREATE TABLE public.clients (
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
CREATE INDEX idx_clients_company_id ON public.clients (company_id);
CREATE INDEX idx_clients_status_archived ON public.clients (status, archived);
CREATE UNIQUE INDEX idx_clients_company_email_unique 
ON public.clients (company_id, email) 
WHERE email IS NOT NULL;

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SELECT - allow when user is member of the client's company
CREATE POLICY "clients_select_company_members" 
ON public.clients 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_company uc 
    WHERE uc.user_id = auth.uid() 
      AND uc.company_id = clients.company_id
  )
);

-- RLS Policy: INSERT - allow when user is member of target company and sets created_by correctly
CREATE POLICY "clients_insert_company_members" 
ON public.clients 
FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT uc.company_id 
    FROM public.user_company uc 
    WHERE uc.user_id = auth.uid()
  ) 
  AND created_by = auth.uid()
);

-- RLS Policy: UPDATE - allow when user is member and stays within same company
CREATE POLICY "clients_update_company_members" 
ON public.clients 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_company uc 
    WHERE uc.user_id = auth.uid() 
      AND uc.company_id = clients.company_id
  )
)
WITH CHECK (
  company_id IN (
    SELECT uc.company_id 
    FROM public.user_company uc 
    WHERE uc.user_id = auth.uid()
  )
);