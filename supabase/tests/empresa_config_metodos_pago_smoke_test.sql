-- Smoke test: empresa_config.metodos_pago

-- 1) Existe la tabla y columna
select (
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'empresa_config' and column_name = 'metodos_pago'
  )
) as column_exists;

-- 2) Constraint de forma presente
select (
  exists (
    select 1 from pg_constraint
    where conname = 'empresa_config_metodos_pago_shape'
      and conrelid = 'public.empresa_config'::regclass
  )
) as shape_constraint_exists;

-- 3) (Opcional) Estado de llaves en la primera fila disponible
--    Si no hay filas, este SELECT no retornará registros
select
  (metodos_pago ? 'visa') as has_visa,
  (metodos_pago ? 'mastercard') as has_mastercard,
  (metodos_pago ? 'transferencia') as has_transferencia,
  (metodos_pago ? 'paypal') as has_paypal,
  (metodos_pago ? 'otros') as has_otros
from public.empresa_config
limit 1;
