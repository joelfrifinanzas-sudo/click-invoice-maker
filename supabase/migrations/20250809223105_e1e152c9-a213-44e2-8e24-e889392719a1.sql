-- Add cancellation metadata to invoices and guard updates
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS canceled_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS canceled_by uuid NULL;

-- Optional index for querying by status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_invoices_status'
  ) THEN
    CREATE INDEX idx_invoices_status ON public.invoices(status);
  END IF;
END $$;

-- Guard updates: allow edits only when status = 'pendiente'; allow cancel transition from any state
CREATE OR REPLACE FUNCTION public.invoices_before_update_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow cancel transition and stamp metadata
  IF NEW.status = 'anulada' AND OLD.status IS DISTINCT FROM 'anulada' THEN
    NEW.canceled_at := COALESCE(NEW.canceled_at, now());
    IF NEW.canceled_by IS NULL THEN
      NEW.canceled_by := auth.uid();
    END IF;
    RETURN NEW;
  END IF;

  -- Permit updates only when current status is 'pendiente'
  IF OLD.status IS DISTINCT FROM 'pendiente' THEN
    RAISE EXCEPTION 'Solo se puede editar la factura si su estado es "pendiente"';
  END IF;

  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'invoices_before_update_guard_trg'
  ) THEN
    CREATE TRIGGER invoices_before_update_guard_trg
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.invoices_before_update_guard();
  END IF;
END $$;