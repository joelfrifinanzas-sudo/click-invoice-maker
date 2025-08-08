-- Smoke test: bancos_rd
-- Verifica existencia, semilla mínima y selección de activos

-- 1) Existe la tabla
select
  (exists (
    select 1 from pg_catalog.pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relname = 'bancos_rd' and n.nspname = 'public'
  )) as table_exists;

-- 2) Semilla mínima (>= 13 activos)
select (count(*) >= 13) as seeded_ok from public.bancos_rd where activo = true;

-- 3) Prueba de orden alfabético (consulta soporta order=nombre.asc)
--    Aquí solo mostramos los primeros 5 nombres ascendentes como señal de vida
select nombre from public.bancos_rd where activo = true order by lower(nombre) asc limit 5;
