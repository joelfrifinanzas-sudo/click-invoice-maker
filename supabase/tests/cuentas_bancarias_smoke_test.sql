-- Smoke test: cuentas_bancarias

-- 1) Existe la tabla
select (exists (
  select 1 from pg_catalog.pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where c.relname = 'cuentas_bancarias' and n.nspname = 'public'
)) as table_exists;

-- 2) Tipo enum creado
select (exists (
  select 1 from pg_type where typname = 'cuenta_bancaria_tipo'
)) as enum_exists;

-- 3) Función mask disponible
select (exists (
  select 1 from pg_proc where proname = 'mask' and pg_function_is_visible(oid)
)) as mask_exists;

-- 4) Trigger autocompleta banco_nombre (estructura)
select (exists (
  select 1 from pg_trigger where tgname in ('cuentas_bancarias_fill_banco_nombre_ins','cuentas_bancarias_fill_banco_nombre_upd')
)) as triggers_present;
