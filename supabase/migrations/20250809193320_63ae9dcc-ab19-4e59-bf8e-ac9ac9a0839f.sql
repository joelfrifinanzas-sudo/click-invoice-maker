-- MP-03: Invoices Core Schema
-- Create helper function for updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ITBIS calculation function
create or replace function public.fn_calc_itbis(net numeric, rate numeric default 0.18)
returns numeric
language sql
stable
as $$
  select coalesce(net, 0) * coalesce(rate, 0.18)
$$;

-- USERS PROFILES
create table if not exists public.users_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users_profiles enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='users_profiles' and policyname='Users can select own profile'
  ) then
    create policy "Users can select own profile"
    on public.users_profiles
    for select
    to authenticated
    using (auth.uid() = id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='users_profiles' and policyname='Users can insert own profile'
  ) then
    create policy "Users can insert own profile"
    on public.users_profiles
    for insert
    to authenticated
    with check (auth.uid() = id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='users_profiles' and policyname='Users can update own profile'
  ) then
    create policy "Users can update own profile"
    on public.users_profiles
    for update
    to authenticated
    using (auth.uid() = id);
  end if;
end $$;

create trigger users_profiles_set_updated_at
before update on public.users_profiles
for each row execute function public.set_updated_at();

-- COMPANIES
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  rnc text,
  address text,
  phone text,
  currency text not null default 'DOP',
  itbis_rate numeric not null default 0.18,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.companies enable row level security;

create index if not exists idx_companies_owner on public.companies(owner_user_id);

create trigger companies_set_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

-- RLS for companies
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='companies' and policyname='Companies owner can select'
  ) then
    create policy "Companies owner can select"
    on public.companies
    for select to authenticated
    using (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='companies' and policyname='Companies owner can insert'
  ) then
    create policy "Companies owner can insert"
    on public.companies
    for insert to authenticated
    with check (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='companies' and policyname='Companies owner can update'
  ) then
    create policy "Companies owner can update"
    on public.companies
    for update to authenticated
    using (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='companies' and policyname='Companies owner can delete'
  ) then
    create policy "Companies owner can delete"
    on public.companies
    for delete to authenticated
    using (auth.uid() = owner_user_id);
  end if;
end $$;

-- CUSTOMERS
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  rnc text,
  currency text not null default 'DOP',
  itbis_rate numeric not null default 0.18,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers enable row level security;

create index if not exists idx_customers_owner on public.customers(owner_user_id);
create index if not exists idx_customers_company on public.customers(company_id);

create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

-- RLS for customers
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='customers' and policyname='Customers owner can select'
  ) then
    create policy "Customers owner can select"
    on public.customers
    for select to authenticated
    using (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='customers' and policyname='Customers owner can insert'
  ) then
    create policy "Customers owner can insert"
    on public.customers
    for insert to authenticated
    with check (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='customers' and policyname='Customers owner can update'
  ) then
    create policy "Customers owner can update"
    on public.customers
    for update to authenticated
    using (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='customers' and policyname='Customers owner can delete'
  ) then
    create policy "Customers owner can delete"
    on public.customers
    for delete to authenticated
    using (auth.uid() = owner_user_id);
  end if;
end $$;

-- PRODUCTS
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  sku text,
  unit_price numeric not null default 0,
  currency text not null default 'DOP',
  itbis_rate numeric not null default 0.18,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create index if not exists idx_products_owner on public.products(owner_user_id);
create index if not exists idx_products_company on public.products(company_id);

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- RLS for products
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='products' and policyname='Products owner can select'
  ) then
    create policy "Products owner can select"
    on public.products
    for select to authenticated
    using (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='products' and policyname='Products owner can insert'
  ) then
    create policy "Products owner can insert"
    on public.products
    for insert to authenticated
    with check (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='products' and policyname='Products owner can update'
  ) then
    create policy "Products owner can update"
    on public.products
    for update to authenticated
    using (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='products' and policyname='Products owner can delete'
  ) then
    create policy "Products owner can delete"
    on public.products
    for delete to authenticated
    using (auth.uid() = owner_user_id);
  end if;
end $$;

-- INVOICES
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  number text,
  status text not null default 'draft',
  issue_date date not null default current_date,
  due_date date,
  currency text not null default 'DOP',
  itbis_rate numeric not null default 0.18,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invoices enable row level security;

create index if not exists idx_invoices_owner on public.invoices(owner_user_id);
create index if not exists idx_invoices_company on public.invoices(company_id);
create index if not exists idx_invoices_customer on public.invoices(customer_id);

create trigger invoices_set_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

-- RLS for invoices
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='invoices' and policyname='Invoices owner can select'
  ) then
    create policy "Invoices owner can select"
    on public.invoices
    for select to authenticated
    using (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='invoices' and policyname='Invoices owner can insert'
  ) then
    create policy "Invoices owner can insert"
    on public.invoices
    for insert to authenticated
    with check (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='invoices' and policyname='Invoices owner can update'
  ) then
    create policy "Invoices owner can update"
    on public.invoices
    for update to authenticated
    using (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='invoices' and policyname='Invoices owner can delete'
  ) then
    create policy "Invoices owner can delete"
    on public.invoices
    for delete to authenticated
    using (auth.uid() = owner_user_id);
  end if;
end $$;

-- INVOICE ITEMS
create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  description text,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  currency text not null default 'DOP',
  itbis_rate numeric not null default 0.18,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invoice_items enable row level security;

create index if not exists idx_invoice_items_owner on public.invoice_items(owner_user_id);
create index if not exists idx_invoice_items_invoice on public.invoice_items(invoice_id);
create index if not exists idx_invoice_items_product on public.invoice_items(product_id);

create trigger invoice_items_set_updated_at
before update on public.invoice_items
for each row execute function public.set_updated_at();

-- Keep owner_user_id in sync from invoice
create or replace function public.invoice_items_set_owner()
returns trigger
language plpgsql
as $$
begin
  if new.owner_user_id is null then
    select owner_user_id into new.owner_user_id from public.invoices where id = new.invoice_id;
  end if;
  return new;
end;
$$;

create trigger invoice_items_fill_owner
before insert or update of invoice_id on public.invoice_items
for each row execute function public.invoice_items_set_owner();

-- RLS for invoice_items
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='invoice_items' and policyname='Invoice items owner can select'
  ) then
    create policy "Invoice items owner can select"
    on public.invoice_items
    for select to authenticated
    using (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='invoice_items' and policyname='Invoice items owner can insert'
  ) then
    create policy "Invoice items owner can insert"
    on public.invoice_items
    for insert to authenticated
    with check (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='invoice_items' and policyname='Invoice items owner can update'
  ) then
    create policy "Invoice items owner can update"
    on public.invoice_items
    for update to authenticated
    using (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='invoice_items' and policyname='Invoice items owner can delete'
  ) then
    create policy "Invoice items owner can delete"
    on public.invoice_items
    for delete to authenticated
    using (auth.uid() = owner_user_id);
  end if;
end $$;

-- PAYMENTS
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric not null,
  currency text not null default 'DOP',
  method text,
  paid_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create index if not exists idx_payments_owner on public.payments(owner_user_id);
create index if not exists idx_payments_invoice on public.payments(invoice_id);

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

-- Keep owner_user_id in sync from invoice on payments as well
create or replace function public.payments_set_owner()
returns trigger
language plpgsql
as $$
begin
  if new.owner_user_id is null then
    select owner_user_id into new.owner_user_id from public.invoices where id = new.invoice_id;
  end if;
  return new;
end;
$$;

create trigger payments_fill_owner
before insert or update of invoice_id on public.payments
for each row execute function public.payments_set_owner();

-- RLS for payments
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='payments' and policyname='Payments owner can select'
  ) then
    create policy "Payments owner can select"
    on public.payments
    for select to authenticated
    using (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='payments' and policyname='Payments owner can insert'
  ) then
    create policy "Payments owner can insert"
    on public.payments
    for insert to authenticated
    with check (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='payments' and policyname='Payments owner can update'
  ) then
    create policy "Payments owner can update"
    on public.payments
    for update to authenticated
    using (auth.uid() = owner_user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='payments' and policyname='Payments owner can delete'
  ) then
    create policy "Payments owner can delete"
    on public.payments
    for delete to authenticated
    using (auth.uid() = owner_user_id);
  end if;
end $$;

-- View for invoice totals
create or replace view public.v_invoice_totals as
select
  i.id as invoice_id,
  coalesce(sum(it.quantity * it.unit_price), 0)::numeric as net,
  coalesce(sum(public.fn_calc_itbis((it.quantity * it.unit_price), coalesce(it.itbis_rate, i.itbis_rate))), 0)::numeric as itbis,
  (coalesce(sum(it.quantity * it.unit_price), 0)
   + coalesce(sum(public.fn_calc_itbis((it.quantity * it.unit_price), coalesce(it.itbis_rate, i.itbis_rate))), 0))::numeric as total,
  i.currency
from public.invoices i
left join public.invoice_items it on it.invoice_id = i.id
group by i.id, i.currency;
