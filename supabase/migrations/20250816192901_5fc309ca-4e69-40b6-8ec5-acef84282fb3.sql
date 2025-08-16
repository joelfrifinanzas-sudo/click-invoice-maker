-- Add missing fields to clientes table for proper client management
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_clientes_company_status ON public.clientes(company_id, status) WHERE archived = false;
CREATE INDEX IF NOT EXISTS idx_clientes_created_by ON public.clientes(created_by);

-- Update existing records to have proper status
UPDATE public.clientes SET status = CASE WHEN is_active THEN 'active' ELSE 'inactive' END WHERE status IS NULL;