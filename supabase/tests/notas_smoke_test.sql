-- Test básico: verifica que la columna "notas" exista y sea de tipo text
DO $$
DECLARE
  t regclass;
  col_count int;
BEGIN
  IF to_regclass('public.invoices') IS NOT NULL THEN
    t := 'public.invoices'::regclass;
  ELSIF to_regclass('public.facturas') IS NOT NULL THEN
    t := 'public.facturas'::regclass;
  ELSE
    RAISE EXCEPTION 'No existe la tabla de facturas (invoices/facturas)';
  END IF;

  SELECT count(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = split_part(t::text, '.', 2)
    AND column_name = 'notas'
    AND data_type = 'text';

  IF col_count = 1 THEN
    RAISE NOTICE 'OK: columna "notas" existe en %', t;
  ELSE
    RAISE EXCEPTION 'FALLO: columna "notas" no encontrada en %', t;
  END IF;
END $$;

-- Cómo verificar desde la API REST (PostgREST):
-- 1) Crear con notas:
--    POST /rest/v1/invoices  (o /rest/v1/facturas)
--    {
--      "...otros_campos_obligatorios": "...",
--      "notas": "Texto de notas (<=1000)"
--    }
-- 2) Obtener con notas:
--    GET /rest/v1/invoices?select=*&id=eq.<ID>
--    (debería incluir el campo "notas")
--
-- GraphQL (pg_graphql) expone automáticamente el campo en los tipos involucrados.
