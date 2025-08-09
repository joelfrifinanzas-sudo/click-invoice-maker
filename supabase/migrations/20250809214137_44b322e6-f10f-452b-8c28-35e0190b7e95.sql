-- CTZ-03 cron setup: ensure pg_cron exists and schedule job
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA cron;

DO $$ BEGIN
  PERFORM 1 FROM cron.job WHERE jobname = 'cotizaciones-expire-daily';
  IF NOT FOUND THEN
    PERFORM cron.schedule('cotizaciones-expire-daily', '0 3 * * *', 'SELECT public.cotizaciones_mark_overdue();');
  END IF;
END $$;