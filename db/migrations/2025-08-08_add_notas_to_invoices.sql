-- Migración: Agregar columna opcional "notas" (text, máx 1000) a la tabla de facturas
-- No altera llaves ni campos existentes. Compatible con PostgREST y GraphQL automáticamente.

DO $$ 
BEGIN
  -- Detecta si la tabla es "invoices" o "facturas" y aplica el cambio
  IF to_regclass('public.invoices') IS NOT NULL THEN
    ALTER TABLE public.invoices
      ADD COLUMN IF NOT EXISTS notas text
      CHECK (char_length(notas) <= 1000);

    COMMENT ON COLUMN public.invoices.notas IS 'Notas de la factura (opcional, máx 1000 caracteres)';

  ELSIF to_regclass('public.facturas') IS NOT NULL THEN
    ALTER TABLE public.facturas
      ADD COLUMN IF NOT EXISTS notas text
      CHECK (char_length(notas) <= 1000);

    COMMENT ON COLUMN public.facturas.notas IS 'Notas de la factura (opcional, máx 1000 caracteres)';

  ELSE
    RAISE NOTICE 'No existe la tabla public.invoices ni public.facturas. Crea la tabla de facturas antes de agregar la columna notas.';
  END IF;
END $$;

-- Notas:
-- 1) PostgREST (API REST) y pg_graphql expondrán automáticamente la nueva columna.
-- 2) La columna es NULL por defecto (opcional) y limitada a 1000 caracteres mediante CHECK.
