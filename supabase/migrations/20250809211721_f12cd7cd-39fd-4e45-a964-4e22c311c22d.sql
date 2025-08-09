-- CTZ-01: Cotizaciones data model, numbering, totals, state flow, and RLS
-- Schema: public
-- NOTE: Uses existing function public.set_updated_at() and public.fn_calc_itbis()

-- 1) Enums for discount type and status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cotizacion_discount_type') THEN
    CREATE TYPE public.cotizacion_discount_type AS ENUM ('none','percent','amount');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cotizacion_status') THEN
    CREATE TYPE public.cotizacion_status AS ENUM ('borrador','enviada','vista','aceptada','rechazada','vencida','facturada');
  END IF;
END $$;

-- 2) Config table for numbering prefix and sequence per company
CREATE TABLE IF NOT EXISTS public.empresa_cotizacion_config (
  company_id uuid PRIMARY KEY,
  prefix text NOT NULL DEFAULT 'CTZ-',
  next_seq bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.empresa_cotizacion_config ENABLE ROW LEVEL SECURITY;

-- Membership-based RLS: Users who belong to the company can read/write
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'empresa_cotizacion_config' AND policyname = 'company_read_write'
  ) THEN
    CREATE POLICY "company_read_write" ON public.empresa_cotizacion_config
      FOR ALL
      USING (EXISTS (
        SELECT 1 FROM public.user_company uc 
        WHERE uc.company_id = empresa_cotizacion_config.company_id AND uc.user_id = auth.uid()
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_company uc 
        WHERE uc.company_id = empresa_cotizacion_config.company_id AND uc.user_id = auth.uid()
      ));
  END IF;
END $$;

-- Keep updated_at current
DROP TRIGGER IF EXISTS empresa_cotizacion_config_set_updated_at ON public.empresa_cotizacion_config;
CREATE TRIGGER empresa_cotizacion_config_set_updated_at
BEFORE UPDATE ON public.empresa_cotizacion_config
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Main tables: cotizaciones and cotizacion_items
CREATE TABLE IF NOT EXISTS public.cotizaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  customer_id uuid,
  number text,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  vence_el date,
  moneda text NOT NULL DEFAULT 'DOP',
  itbis_rate numeric NOT NULL DEFAULT 0.18,
  tipo_descuento public.cotizacion_discount_type NOT NULL DEFAULT 'none',
  valor_descuento numeric NOT NULL DEFAULT 0,
  notas text,
  terminos text,
  estado public.cotizacion_status NOT NULL DEFAULT 'borrador',
  total_neto numeric NOT NULL DEFAULT 0,
  total_itbis numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_cotizacion_num_per_company UNIQUE (company_id, number)
);

CREATE TABLE IF NOT EXISTS public.cotizacion_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id uuid NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
  product_id uuid,
  nombre text NOT NULL,
  qty numeric NOT NULL DEFAULT 1,
  precio_unitario numeric NOT NULL DEFAULT 0,
  itbis_rate numeric NOT NULL DEFAULT 0.18,
  subtotal numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cotizacion_items_cotizacion_id ON public.cotizacion_items(cotizacion_id);

-- Enable RLS
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizacion_items ENABLE ROW LEVEL SECURITY;

-- RLS policies — membership-based, like invoices
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cotizaciones' AND policyname='company_read_write'
  ) THEN
    CREATE POLICY "company_read_write" ON public.cotizaciones
      FOR ALL
      USING (EXISTS (
        SELECT 1 FROM public.user_company uc 
        WHERE uc.company_id = cotizaciones.company_id AND uc.user_id = auth.uid()
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_company uc 
        WHERE uc.company_id = cotizaciones.company_id AND uc.user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cotizacion_items' AND policyname='company_read_write'
  ) THEN
    CREATE POLICY "company_read_write" ON public.cotizacion_items
      FOR ALL
      USING (EXISTS (
        SELECT 1 FROM public.user_company uc 
        JOIN public.cotizaciones c ON c.id = cotizacion_items.cotizacion_id
        WHERE uc.company_id = c.company_id AND uc.user_id = auth.uid()
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_company uc 
        JOIN public.cotizaciones c ON c.id = cotizacion_items.cotizacion_id
        WHERE uc.company_id = c.company_id AND uc.user_id = auth.uid()
      ));
  END IF;
END $$;

-- 4) Numbering: function to get next number per company with configurable prefix
CREATE OR REPLACE FUNCTION public.next_cotizacion_number(_company_id uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_prefix text;
  v_seq bigint;
  v_num text;
BEGIN
  -- Ensure config row exists
  INSERT INTO public.empresa_cotizacion_config(company_id)
  VALUES (_company_id)
  ON CONFLICT (company_id) DO NOTHING;

  -- Increment and get the next sequence atomically
  UPDATE public.empresa_cotizacion_config
  SET next_seq = next_seq + 1
  WHERE company_id = _company_id
  RETURNING prefix, next_seq INTO v_prefix, v_seq;

  IF v_prefix IS NULL THEN
    v_prefix := 'CTZ-';
  END IF;

  v_num := v_prefix || to_char(v_seq, 'FM000000');
  RETURN v_num;
END;
$$;

-- 5) Totals recalculation based on items and discount
CREATE OR REPLACE FUNCTION public.cotizaciones_recalc_totals(_cotizacion_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_neto numeric := 0;
  v_itbis_rate numeric := 0.18;
  v_tipo public.cotizacion_discount_type := 'none';
  v_desc_val numeric := 0;
  v_descuento numeric := 0;
  v_itbis numeric := 0;
  v_total numeric := 0;
BEGIN
  SELECT
    COALESCE(SUM(i.subtotal), 0),
    c.itbis_rate, c.tipo_descuento, COALESCE(c.valor_descuento, 0)
  INTO v_neto, v_itbis_rate, v_tipo, v_desc_val
  FROM public.cotizaciones c
  LEFT JOIN public.cotizacion_items i ON i.cotizacion_id = c.id
  WHERE c.id = _cotizacion_id
  GROUP BY c.itbis_rate, c.tipo_descuento, c.valor_descuento;

  -- Discount calculation
  IF v_tipo = 'percent' THEN
    v_descuento := v_neto * (v_desc_val / 100.0);
  ELSIF v_tipo = 'amount' THEN
    v_descuento := v_desc_val;
  ELSE
    v_descuento := 0;
  END IF;

  -- ITBIS per spec: itbis = neto * itbis_rate (not after discount)
  v_itbis := public.fn_calc_itbis(v_neto, v_itbis_rate);

  -- Total per spec: total = neto + itbis - descuento
  v_total := v_neto + v_itbis - v_descuento;

  UPDATE public.cotizaciones
  SET total_neto = COALESCE(v_neto, 0),
      total_itbis = COALESCE(v_itbis, 0),
      total = COALESCE(v_total, 0)
  WHERE id = _cotizacion_id;
END;
$$;

-- 6) Triggers for items to compute subtotal and recalc parent totals
CREATE OR REPLACE FUNCTION public.cotizacion_items_before_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.subtotal := COALESCE(NEW.qty,0) * COALESCE(NEW.precio_unitario,0);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.cotizacion_items_after_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM public.cotizaciones_recalc_totals(OLD.cotizacion_id);
  ELSE
    PERFORM public.cotizaciones_recalc_totals(NEW.cotizacion_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS cotizacion_items_before_insupd ON public.cotizacion_items;
CREATE TRIGGER cotizacion_items_before_insupd
BEFORE INSERT OR UPDATE ON public.cotizacion_items
FOR EACH ROW EXECUTE FUNCTION public.cotizacion_items_before_write();

DROP TRIGGER IF EXISTS cotizacion_items_after_idu ON public.cotizacion_items;
CREATE TRIGGER cotizacion_items_after_idu
AFTER INSERT OR UPDATE OR DELETE ON public.cotizacion_items
FOR EACH ROW EXECUTE FUNCTION public.cotizacion_items_after_change();

-- 7) Triggers for cotizaciones: numbering, state flow, updated_at, and totals on core field changes
CREATE OR REPLACE FUNCTION public.cotizaciones_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Auto number if null
  IF NEW.number IS NULL THEN
    NEW.number := public.next_cotizacion_number(NEW.company_id);
  END IF;
  RETURN NEW;
END;
$$;

-- State machine and automatic expiration handling
CREATE OR REPLACE FUNCTION public.cotizaciones_before_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_allowed boolean := false;
BEGIN
  -- Automatic expiration: enviada/vista -> vencida if vence_el < today
  IF (NEW.estado IN ('enviada','vista') AND NEW.vence_el IS NOT NULL AND NEW.vence_el < CURRENT_DATE) THEN
    NEW.estado := 'vencida';
  END IF;

  IF NEW.estado <> OLD.estado THEN
    -- Validate allowed transitions
    IF OLD.estado = 'borrador' AND NEW.estado = 'enviada' THEN
      v_allowed := true;
    ELSIF OLD.estado = 'enviada' AND NEW.estado IN ('vista','vencida') THEN
      v_allowed := true;
    ELSIF OLD.estado = 'vista' AND NEW.estado IN ('aceptada','rechazada','vencida') THEN
      v_allowed := true;
    ELSIF OLD.estado = 'aceptada' AND NEW.estado = 'facturada' THEN
      v_allowed := true;
    ELSE
      RAISE EXCEPTION 'Transición de estado inválida: % -> %', OLD.estado, NEW.estado;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cotizaciones_before_ins ON public.cotizaciones;
CREATE TRIGGER cotizaciones_before_ins
BEFORE INSERT ON public.cotizaciones
FOR EACH ROW EXECUTE FUNCTION public.cotizaciones_before_insert();

DROP TRIGGER IF EXISTS cotizaciones_before_upd ON public.cotizaciones;
CREATE TRIGGER cotizaciones_before_upd
BEFORE UPDATE ON public.cotizaciones
FOR EACH ROW EXECUTE FUNCTION public.cotizaciones_before_update();

-- updated_at trigger
DROP TRIGGER IF EXISTS cotizaciones_set_updated_at ON public.cotizaciones;
CREATE TRIGGER cotizaciones_set_updated_at
BEFORE UPDATE ON public.cotizaciones
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Recalculate totals when key fields change on cotizaciones
CREATE OR REPLACE FUNCTION public.cotizaciones_after_update_recalc()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF (OLD.itbis_rate IS DISTINCT FROM NEW.itbis_rate) 
     OR (OLD.tipo_descuento IS DISTINCT FROM NEW.tipo_descuento)
     OR (OLD.valor_descuento IS DISTINCT FROM NEW.valor_descuento) THEN
    PERFORM public.cotizaciones_recalc_totals(NEW.id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS cotizaciones_after_upd_recalc ON public.cotizaciones;
CREATE TRIGGER cotizaciones_after_upd_recalc
AFTER UPDATE ON public.cotizaciones
FOR EACH ROW EXECUTE FUNCTION public.cotizaciones_after_update_recalc();

-- 8) View for totals per spec
CREATE OR REPLACE VIEW public.v_cotizacion_totales AS
SELECT 
  c.id AS cotizacion_id,
  c.moneda,
  COALESCE(SUM(i.subtotal), 0) AS neto,
  public.fn_calc_itbis(COALESCE(SUM(i.subtotal), 0), c.itbis_rate) AS itbis,
  (COALESCE(SUM(i.subtotal), 0) 
     + public.fn_calc_itbis(COALESCE(SUM(i.subtotal), 0), c.itbis_rate)
     - CASE 
         WHEN c.tipo_descuento = 'percent' THEN COALESCE(SUM(i.subtotal), 0) * (COALESCE(c.valor_descuento,0) / 100.0)
         WHEN c.tipo_descuento = 'amount' THEN COALESCE(c.valor_descuento, 0)
         ELSE 0
       END
  ) AS total
FROM public.cotizaciones c
LEFT JOIN public.cotizacion_items i ON i.cotizacion_id = c.id
GROUP BY c.id, c.moneda, c.itbis_rate, c.tipo_descuento, c.valor_descuento;
