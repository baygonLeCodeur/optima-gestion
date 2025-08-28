-- Activer l'extension pg_cron si ce n'est pas déjà fait
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Accorder les permissions nécessaires à l'utilisateur postgres
GRANT USAGE ON SCHEMA cron TO postgres;

-- Supprimer l'ancien job s'il existe, sans générer d'erreur s'il n'existe pas.
-- C'est la section corrigée.
DO $$
BEGIN
  PERFORM cron.unschedule('daily-visit-reminders');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Le job "daily-visit-reminders" n''existait pas, la suppression est ignorée.';
END;
$$;


-- Planifier le job pour s'exécuter tous les jours à 8h00 UTC
SELECT cron.schedule(
    'daily-visit-reminders',
    '0 8 * * *', -- 'Minute Hour Day Month DayOfWeek' -> Tous les jours à 8h00
    $$
    SELECT net.http_post(
        url:='https://lvcgrmvvbinnbtreurnn.supabase.co/functions/v1/send-visit-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2Y2dybXZ2YmlubmJ0cmV1cm5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MDAzODYsImV4cCI6MjA2NjM3NjM4Nn0.ZqSTOiHS7eDIK4i-0w8Jz4r-bNvHlUlOqJ9y-dOQE9g"}'
    ) AS request_id;
    $$
);
