-- Migración: Cuentas bancarias propias para recibir pagos
-- Entidad: public.cuentas_bancarias
-- Requisitos:
--  - { id, banco_id FK, banco_nombre denormalizado, tipo, alias, numero, moneda='DOP', activa, preferida, created_at }
--  - Validaciones de longitud y tipo
--  - Unicidad: {empresa_id, banco_id, numero}
--  - Auto-relleno banco_nombre en create/update
--  - RLS por empresa

-- Tipo enumerado para "tipo" de cuenta
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'cuenta_bancaria_tipo'
  ) THEN
    CREATE TYPE public.cuenta_bancaria_tipo AS ENUM ('ahorros', 'corriente', 'cheques');
  END IF;
END $$;

-- Función utilitaria: updated_at automático
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función utilitaria: obtener company_id del JWT de forma segura (puede devolver NULL)
CREATE OR REPLACE FUNCTION public.current_company_id() RETURNS uuid AS $$
DECLARE
  cid uuid;
BEGIN
  BEGIN
    cid := (auth.jwt() ->> 'company_id')::uuid;
  EXCEPTION WHEN others THEN
    cid := NULL;
  END;
  RETURN cid;
END;
$$ LANGUAGE plpgsql STABLE;

-- Función utilitaria: mask para números de cuenta (solo muestra últimos 4)
CREATE OR REPLACE FUNCTION public.mask(val text) RETURNS text AS $$
  SELECT CASE
    WHEN val IS NULL OR length(regexp_replace(val, '\\s', '', 'g')) = 0 THEN NULL
    ELSE '•••• ' || right(regexp_replace(val, '\\s', '', 'g'), 4)
  END
$$ LANGUAGE sql IMMUTABLE;

-- Tabla principal
CREATE TABLE IF NOT EXISTS public.cuentas_bancarias (
  id            bigserial PRIMARY KEY,
  empresa_id    uuid NOT NULL,
  banco_id      bigint NOT NULL REFERENCES public.bancos_rd(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  banco_nombre  text NOT NULL,
  tipo          public.cuenta_bancaria_tipo NOT NULL,
  alias         text NOT NULL CHECK (char_length(alias) BETWEEN 2 AND 60),
  numero        text NOT NULL CHECK (char_length(numero) BETWEEN 6 AND 30),
  moneda        text NOT NULL DEFAULT 'DOP',
  activa        boolean NOT NULL DEFAULT true,
  preferida     boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cuentas_bancarias_unique UNIQUE (empresa_id, banco_id, numero)
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS cuentas_bancarias_empresa_idx ON public.cuentas_bancarias (empresa_id);
CREATE INDEX IF NOT EXISTS cuentas_bancarias_activa_idx ON public.cuentas_bancarias (activa);
CREATE INDEX IF NOT EXISTS cuentas_bancarias_alias_idx ON public.cuentas_bancarias (lower(alias));

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_cuentas_bancarias_updated_at ON public.cuentas_bancarias;
CREATE TRIGGER set_cuentas_bancarias_updated_at
BEFORE UPDATE ON public.cuentas_bancarias
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger: completar banco_nombre en insert/update
CREATE OR REPLACE FUNCTION public.cuentas_bancarias_set_banco_nombre() RETURNS trigger AS $$
BEGIN
  SELECT nombre INTO NEW.banco_nombre FROM public.bancos_rd WHERE id = NEW.banco_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cuentas_bancarias_fill_banco_nombre_ins ON public.cuentas_bancarias;
CREATE TRIGGER cuentas_bancarias_fill_banco_nombre_ins
BEFORE INSERT ON public.cuentas_bancarias
FOR EACH ROW EXECUTE FUNCTION public.cuentas_bancarias_set_banco_nombre();

DROP TRIGGER IF EXISTS cuentas_bancarias_fill_banco_nombre_upd ON public.cuentas_bancarias;
CREATE TRIGGER cuentas_bancarias_fill_banco_nombre_upd
BEFORE UPDATE OF banco_id ON public.cuentas_bancarias
FOR EACH ROW EXECUTE FUNCTION public.cuentas_bancarias_set_banco_nombre();

-- RLS: acceso por empresa
ALTER TABLE public.cuentas_bancarias ENABLE ROW LEVEL SECURITY;

-- Solo usuarios autenticados pueden operar; restringido a su empresa
CREATE POLICY IF NOT EXISTS "read own cuentas by company" ON public.cuentas_bancarias
  FOR SELECT USING (empresa_id = public.current_company_id());

CREATE POLICY IF NOT EXISTS "insert own cuentas by company" ON public.cuentas_bancarias
  FOR INSERT WITH CHECK (empresa_id = public.current_company_id());

CREATE POLICY IF NOT EXISTS "update own cuentas by company" ON public.cuentas_bancarias
  FOR UPDATE USING (empresa_id = public.current_company_id()) WITH CHECK (empresa_id = public.current_company_id());

CREATE POLICY IF NOT EXISTS "delete own cuentas by company" ON public.cuentas_bancarias
  FOR DELETE USING (empresa_id = public.current_company_id());

-- Grants (RLS aplica)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cuentas_bancarias TO authenticated;

COMMENT ON TABLE public.cuentas_bancarias IS 'Cuentas bancarias de la empresa para recibir pagos. Scope por empresa_id.';
COMMENT ON COLUMN public.cuentas_bancarias.numero IS 'Al mostrar, usar public.mask(numero)';
