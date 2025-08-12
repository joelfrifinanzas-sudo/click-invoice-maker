begin;
-- Enable realtime support for clients and products
alter table public.clients replica identity full;
alter table public.products replica identity full;

-- Add to realtime publication (no IF NOT EXISTS in Postgres)
DO $$ BEGIN
  BEGIN
    EXECUTE 'alter publication supabase_realtime add table public.clients';
  EXCEPTION WHEN duplicate_object THEN
    -- already added
    NULL;
  END;
  BEGIN
    EXECUTE 'alter publication supabase_realtime add table public.products';
  EXCEPTION WHEN duplicate_object THEN
    -- already added
    NULL;
  END;
END $$;
commit;