-- Add index and foreign key for invoices.cliente_id -> clients.id
DO $$
BEGIN
  IF to_regclass('public.invoices') IS NOT NULL AND to_regclass('public.clients') IS NOT NULL THEN
    -- Create index to speed up lookups by cliente_id
    CREATE INDEX IF NOT EXISTS idx_invoices_cliente_id ON public.invoices (cliente_id);

    -- Add FK constraint only if it does not already exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.invoices'::regclass
        AND conname = 'fk_invoices_cliente_id_clients'
    ) THEN
      ALTER TABLE public.invoices
      ADD CONSTRAINT fk_invoices_cliente_id_clients
      FOREIGN KEY (cliente_id)
      REFERENCES public.clients(id)
      ON DELETE SET NULL;
    END IF;
  ELSE
    RAISE NOTICE 'Table public.invoices or public.clients does not exist. Skipping FK and index creation.';
  END IF;
END $$;