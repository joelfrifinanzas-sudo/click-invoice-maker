-- Migración: Catálogo de bancos RD
-- Crea tabla editable `bancos_rd` con RLS y semilla inicial
-- Requisitos de aceptación cubiertos:
--  - CRUD por admin (RLS restringe a admin, ver políticas abajo)
--  - Listado público de bancos activos (select permitido solo de activos)
--  - Orden alfabético disponible vía order nombre.asc (índice en lower(nombre))

-- Tabla
create table if not exists public.bancos_rd (
  id bigserial primary key,
  nombre text not null check (char_length(nombre) between 1 and 120),
  codigo text null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unicidad y performance de ordenamiento/búsqueda
create unique index if not exists bancos_rd_nombre_unique on public.bancos_rd (lower(nombre));
create unique index if not exists bancos_rd_codigo_unique on public.bancos_rd (codigo) where codigo is not null;
create index if not exists bancos_rd_activo_idx on public.bancos_rd (activo);
create index if not exists bancos_rd_nombre_order_idx on public.bancos_rd (lower(nombre) asc);

-- Trigger de updated_at
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_bancos_rd_updated_at on public.bancos_rd;
create trigger set_bancos_rd_updated_at
before update on public.bancos_rd
for each row execute function public.set_updated_at();

-- Semilla inicial (editable). ON CONFLICT DO NOTHING evita duplicados por unicidad de nombre
insert into public.bancos_rd (nombre, activo) values
  ('Banreservas', true),
  ('Banco Popular', true),
  ('Banco BHD', true),
  ('Banco Santa Cruz', true),
  ('Banco Caribe', true),
  ('Scotiabank RD', true),
  ('Banco Promerica', true),
  ('Banco Ademi', true),
  ('Banco BDI', true),
  ('Banco Vimenca', true),
  ('APAP', true),
  ('ACAP', true),
  ('La Nacional', true)
on conflict do nothing;

-- RLS y permisos
alter table public.bancos_rd enable row level security;

-- Lectura pública SOLO de bancos activos
create policy if not exists "Public can select active bancos" on public.bancos_rd
  for select using (activo);

-- CRUD solo para admin (JWT claim role = 'admin'). Ajusta según tu modelo de auth si es necesario.
create policy if not exists "Admins can CRUD bancos" on public.bancos_rd
  for all
  using ((auth.jwt() ->> 'role') = 'admin')
  with check ((auth.jwt() ->> 'role') = 'admin');

-- Grants (RLS sigue aplicando)
grant select on public.bancos_rd to anon, authenticated;
grant insert, update, delete on public.bancos_rd to authenticated;

-- Vista conveniente de bancos activos (nota: ORDER BY en vistas no es contractual; usar order=nombre.asc en API)
create or replace view public.bancos_rd_activos as
  select id, nombre, codigo, activo from public.bancos_rd where activo = true;

comment on table public.bancos_rd is 'Catálogo de bancos de República Dominicana (editable por admin)';
comment on view public.bancos_rd_activos is 'Bancos activos. Usar order=nombre.asc en API para orden alfabético.';
