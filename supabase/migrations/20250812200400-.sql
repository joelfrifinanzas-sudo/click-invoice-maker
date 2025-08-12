begin;
-- Enable realtime support for clients and products
alter table public.clients replica identity full;
alter table public.products replica identity full;

-- Ensure both tables are in the realtime publication
alter publication supabase_realtime add table if not exists public.clients;
alter publication supabase_realtime add table if not exists public.products;
commit;