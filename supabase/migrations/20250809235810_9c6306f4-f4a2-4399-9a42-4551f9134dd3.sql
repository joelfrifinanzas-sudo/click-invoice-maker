-- Create enum for client type
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_type') THEN
    CREATE TYPE public.client_type AS ENUM ('Empresarial','Individuo');
  END IF;
END $$;

-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  tipo_cliente public.client_type NOT NULL,
  saludo text NULL,
  nombre_pila text NULL,
  apellido text NULL,
  nombre_empresa text NULL,
  nombre_visualizacion text NOT NULL,
  email text NULL,
  telefono_laboral text NULL,
  telefono_movil text NULL,
  pais_tel text NOT NULL DEFAULT 'DO',
  documento text NULL,
  es_contribuyente boolean NOT NULL DEFAULT false,
  notas text NULL,
  tenant_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  activo boolean NOT NULL DEFAULT true
);

-- Unique constraints per tenant (case-sensitive by spec). Use partial indexes to ignore NULLs.
CREATE UNIQUE INDEX IF NOT EXISTS uq_clients_tenant_nombre_visualizacion
  ON public.clients (tenant_id, nombre_visualizacion);

CREATE UNIQUE INDEX IF NOT EXISTS uq_clients_tenant_email
  ON public.clients (tenant_id, email) WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_clients_tenant_documento
  ON public.clients (tenant_id, documento) WHERE documento IS NOT NULL;

-- Additional indexes per requirements
CREATE INDEX IF NOT EXISTS idx_clients_tenant_nombre_visualizacion
  ON public.clients (tenant_id, nombre_visualizacion);

CREATE INDEX IF NOT EXISTS idx_clients_tenant_documento
  ON public.clients (tenant_id, documento);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Policies
-- SELECT: superadmin or company member with role admin/owner/cashier
DROP POLICY IF EXISTS clients_select ON public.clients;
CREATE POLICY clients_select
ON public.clients FOR SELECT
USING (
  public.has_role(auth.uid(),'superadmin') OR
  EXISTS (
    SELECT 1 FROM public.user_company uc
    WHERE uc.user_id = auth.uid()
      AND uc.company_id = clients.tenant_id
      AND uc.role IN ('admin','owner','cashier')
  )
);

-- INSERT: superadmin or company admin/owner only
DROP POLICY IF EXISTS clients_insert ON public.clients;
CREATE POLICY clients_insert
ON public.clients FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(),'superadmin') OR
  EXISTS (
    SELECT 1 FROM public.user_company uc
    WHERE uc.user_id = auth.uid()
      AND uc.company_id = tenant_id
      AND uc.role IN ('admin','owner')
  )
);

-- UPDATE: superadmin or company admin/owner only
DROP POLICY IF EXISTS clients_update ON public.clients;
CREATE POLICY clients_update
ON public.clients FOR UPDATE
USING (
  public.has_role(auth.uid(),'superadmin') OR
  EXISTS (
    SELECT 1 FROM public.user_company uc
    WHERE uc.user_id = auth.uid()
      AND uc.company_id = clients.tenant_id
      AND uc.role IN ('admin','owner')
  )
)
WITH CHECK (
  public.has_role(auth.uid(),'superadmin') OR
  EXISTS (
    SELECT 1 FROM public.user_company uc
    WHERE uc.user_id = auth.uid()
      AND uc.company_id = clients.tenant_id
      AND uc.role IN ('admin','owner')
  )
);

-- DELETE: superadmin or company admin/owner only
DROP POLICY IF EXISTS clients_delete ON public.clients;
CREATE POLICY clients_delete
ON public.clients FOR DELETE
USING (
  public.has_role(auth.uid(),'superadmin') OR
  EXISTS (
    SELECT 1 FROM public.user_company uc
    WHERE uc.user_id = auth.uid()
      AND uc.company_id = clients.tenant_id
      AND uc.role IN ('admin','owner')
  )
);

-- RPC for upserting a client, enforcing tenant via auth/membership
CREATE OR REPLACE FUNCTION public.upsert_client(payload json)
RETURNS public.clients
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company uuid;
  v_id uuid;
  v_rec public.clients;
BEGIN
  v_company := NULLIF(payload->>'tenant_id','')::uuid;
  IF v_company IS NULL THEN
    RAISE EXCEPTION 'tenant_id es requerido en payload';
  END IF;

  IF NOT (
    public.has_role(auth.uid(),'superadmin') OR
    EXISTS (SELECT 1 FROM public.user_company uc WHERE uc.user_id = auth.uid() AND uc.company_id = v_company)
  ) THEN
    RAISE EXCEPTION 'No autorizado para este tenant';
  END IF;

  v_id := NULLIF(payload->>'id','')::uuid;

  -- Try UPDATE first when id present and belongs to tenant
  IF v_id IS NOT NULL THEN
    UPDATE public.clients c SET
      tipo_cliente = (payload->>'tipo_cliente')::public.client_type,
      saludo = NULLIF(payload->>'saludo',''),
      nombre_pila = NULLIF(payload->>'nombre_pila',''),
      apellido = NULLIF(payload->>'apellido',''),
      nombre_empresa = NULLIF(payload->>'nombre_empresa',''),
      nombre_visualizacion = (payload->>'nombre_visualizacion'),
      email = NULLIF(payload->>'email',''),
      telefono_laboral = NULLIF(payload->>'telefono_laboral',''),
      telefono_movil = NULLIF(payload->>'telefono_movil',''),
      pais_tel = COALESCE(NULLIF(payload->>'pais_tel',''), 'DO'),
      documento = NULLIF(payload->>'documento',''),
      es_contribuyente = COALESCE((payload->>'es_contribuyente')::boolean, false),
      notas = NULLIF(payload->>'notas',''),
      activo = COALESCE((payload->>'activo')::boolean, true)
    WHERE c.id = v_id AND c.tenant_id = v_company
    RETURNING * INTO v_rec;
  END IF;

  IF v_rec.id IS NULL THEN
    INSERT INTO public.clients (
      id, tipo_cliente, saludo, nombre_pila, apellido, nombre_empresa,
      nombre_visualizacion, email, telefono_laboral, telefono_movil,
      pais_tel, documento, es_contribuyente, notas, tenant_id, activo
    ) VALUES (
      COALESCE(v_id, gen_random_uuid()),
      (payload->>'tipo_cliente')::public.client_type,
      NULLIF(payload->>'saludo',''),
      NULLIF(payload->>'nombre_pila',''),
      NULLIF(payload->>'apellido',''),
      NULLIF(payload->>'nombre_empresa',''),
      (payload->>'nombre_visualizacion'),
      NULLIF(payload->>'email',''),
      NULLIF(payload->>'telefono_laboral',''),
      NULLIF(payload->>'telefono_movil',''),
      COALESCE(NULLIF(payload->>'pais_tel',''), 'DO'),
      NULLIF(payload->>'documento',''),
      COALESCE((payload->>'es_contribuyente')::boolean, false),
      NULLIF(payload->>'notas',''),
      v_company,
      COALESCE((payload->>'activo')::boolean, true)
    ) RETURNING * INTO v_rec;
  END IF;

  RETURN v_rec;
END;
$$;