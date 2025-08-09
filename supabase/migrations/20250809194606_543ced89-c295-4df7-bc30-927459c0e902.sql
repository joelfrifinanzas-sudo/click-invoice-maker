-- MP-05 prerequisite: add company_id to users_profiles
alter table public.users_profiles
  add column if not exists company_id uuid references public.companies(id) on delete set null;

create index if not exists idx_users_profiles_company on public.users_profiles(company_id);