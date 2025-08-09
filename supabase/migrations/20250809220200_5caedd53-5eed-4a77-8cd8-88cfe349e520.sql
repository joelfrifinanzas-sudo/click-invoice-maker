-- Facturación: asegurar tablas, relaciones y campos mínimos sin afectar datos existentes
-- 1) Confirmación (no-op): existen companies, users_profiles, customers, products, invoices, invoice_items, payments, cotizaciones, cotizacion_items
--    A continuación, solo se crean relaciones/índices y columnas si faltan.

-- 2) Índices en columnas de relación (idempotentes)
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON public.invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON public.invoice_items(product_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_company_id ON public.cotizaciones(company_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_customer_id ON public.cotizaciones(customer_id);
CREATE INDEX IF NOT EXISTS idx_cotizacion_items_product_id ON public.cotizacion_items(product_id);

-- 3) Llaves foráneas (NO VALID para no romper datos existentes; aplican a nuevas filas)
DO $$ BEGIN
  -- invoices -> companies
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoices_company'
  ) THEN
    ALTER TABLE public.invoices
    ADD CONSTRAINT fk_invoices_company FOREIGN KEY (company_id)
    REFERENCES public.companies(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED NOT VALID;
  END IF;

  -- invoices -> customers
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoices_customer'
  ) THEN
    ALTER TABLE public.invoices
    ADD CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_id)
    REFERENCES public.customers(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED NOT VALID;
  END IF;

  -- invoice_items -> invoices
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoice_items_invoice'
  ) THEN
    ALTER TABLE public.invoice_items
    ADD CONSTRAINT fk_invoice_items_invoice FOREIGN KEY (invoice_id)
    REFERENCES public.invoices(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED NOT VALID;
  END IF;

  -- invoice_items -> products
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoice_items_product'
  ) THEN
    ALTER TABLE public.invoice_items
    ADD CONSTRAINT fk_invoice_items_product FOREIGN KEY (product_id)
    REFERENCES public.products(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED NOT VALID;
  END IF;

  -- payments -> invoices
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_payments_invoice'
  ) THEN
    ALTER TABLE public.payments
    ADD CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id)
    REFERENCES public.invoices(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED NOT VALID;
  END IF;

  -- cotizaciones -> companies
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_cotizaciones_company'
  ) THEN
    ALTER TABLE public.cotizaciones
    ADD CONSTRAINT fk_cotizaciones_company FOREIGN KEY (company_id)
    REFERENCES public.companies(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED NOT VALID;
  END IF;

  -- cotizaciones -> customers
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_cotizaciones_customer'
  ) THEN
    ALTER TABLE public.cotizaciones
    ADD CONSTRAINT fk_cotizaciones_customer FOREIGN KEY (customer_id)
    REFERENCES public.customers(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED NOT VALID;
  END IF;

  -- cotizacion_items -> products
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_cotizacion_items_product'
  ) THEN
    ALTER TABLE public.cotizacion_items
    ADD CONSTRAINT fk_cotizacion_items_product FOREIGN KEY (product_id)
    REFERENCES public.products(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED NOT VALID;
  END IF;
END $$;

-- 4) Campos mínimos faltantes para facturación: NCF y secuencia
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS ncf text,
  ADD COLUMN IF NOT EXISTS ncf_sequence bigint;

-- 5) Config de numeración de facturas por empresa (secuencia local NCF/prefijo)
CREATE TABLE IF NOT EXISTS public.empresa_facturacion_config (
  company_id uuid PRIMARY KEY,
  next_invoice_seq bigint NOT NULL DEFAULT 0,
  ncf_prefix text NOT NULL DEFAULT 'B01',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.empresa_facturacion_config ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='empresa_facturacion_config' AND policyname='company_read_write'
  ) THEN
    CREATE POLICY "company_read_write" ON public.empresa_facturacion_config
      FOR ALL
      USING (EXISTS (SELECT 1 FROM public.user_company uc WHERE uc.company_id = empresa_facturacion_config.company_id AND uc.user_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.user_company uc WHERE uc.company_id = empresa_facturacion_config.company_id AND uc.user_id = auth.uid()));
  END IF;
END $$;

DROP TRIGGER IF EXISTS empresa_facturacion_config_set_updated_at ON public.empresa_facturacion_config;
CREATE TRIGGER empresa_facturacion_config_set_updated_at
BEFORE UPDATE ON public.empresa_facturacion_config
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
