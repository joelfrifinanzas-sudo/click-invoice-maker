-- Migración: Agregar metodos_pago a empresa_config
-- Alcance: añadir columna JSONB con defaults y validaciones; expuesta por REST/GraphQL automáticamente

DO $$
BEGIN
  IF to_regclass('public.empresa_config') IS NOT NULL THEN
    -- Agregar columna con default y not null
    ALTER TABLE public.empresa_config
      ADD COLUMN IF NOT EXISTS metodos_pago jsonb NOT NULL DEFAULT (
        jsonb_build_object(
          'visa', false,
          'mastercard', false,
          'transferencia', true,
          'paypal', false,
          'otros', false
        )
      );

    -- Constraint: forma y tipos estrictos (solo esas 5 llaves, booleanas)
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'empresa_config_metodos_pago_shape'
          AND conrelid = 'public.empresa_config'::regclass
      ) THEN
        ALTER TABLE public.empresa_config
          ADD CONSTRAINT empresa_config_metodos_pago_shape CHECK (
            metodos_pago ? 'visa' AND metodos_pago ? 'mastercard' AND metodos_pago ? 'transferencia' AND metodos_pago ? 'paypal' AND metodos_pago ? 'otros'
            AND jsonb_typeof(metodos_pago->'visa') = 'boolean'
            AND jsonb_typeof(metodos_pago->'mastercard') = 'boolean'
            AND jsonb_typeof(metodos_pago->'transferencia') = 'boolean'
            AND jsonb_typeof(metodos_pago->'paypal') = 'boolean'
            AND jsonb_typeof(metodos_pago->'otros') = 'boolean'
            AND (metodos_pago - 'visa' - 'mastercard' - 'transferencia' - 'paypal' - 'otros') = '{}'::jsonb
          );
      END IF;
    END $$;

    -- Backfill de filas existentes (si hubiese NULL o faltan llaves)
    UPDATE public.empresa_config ec SET metodos_pago = (
      COALESCE(ec.metodos_pago, '{}'::jsonb)
      || jsonb_build_object('visa',         COALESCE((ec.metodos_pago->>'visa')::boolean, false))
      || jsonb_build_object('mastercard',   COALESCE((ec.metodos_pago->>'mastercard')::boolean, false))
      || jsonb_build_object('transferencia',COALESCE((ec.metodos_pago->>'transferencia')::boolean, true))
      || jsonb_build_object('paypal',       COALESCE((ec.metodos_pago->>'paypal')::boolean, false))
      || jsonb_build_object('otros',        COALESCE((ec.metodos_pago->>'otros')::boolean, false))
    );

    COMMENT ON COLUMN public.empresa_config.metodos_pago IS 'Métodos de pago configurables por empresa: visa, mastercard, transferencia, paypal, otros.';
  ELSE
    RAISE NOTICE 'Tabla public.empresa_config no existe. Crea la tabla antes de agregar metodos_pago.';
  END IF;
END $$;
