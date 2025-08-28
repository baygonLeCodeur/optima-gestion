-- =================================================================
--         SYSTÈME D'ALERTES DE PROPRIÉTÉS PAR EMAIL (pg_cron)
-- =================================================================
-- Ce script met en place un système d'alertes pour les recherches
-- de propriétés sauvegardées par les utilisateurs. Il utilise pg_cron
-- pour planifier des vérifications périodiques et une Edge Function
-- pour l'envoi des notifications.
--
-- Ordre d'exécution :
-- 1. Activer l'extension pg_cron (doit être fait manuellement une fois).
-- 2. Déployer la fonction `check_new_properties_for_search`.
-- 3. Déployer la fonction `manage_property_alert_schedule`.
-- 4. Créer le trigger `on_saved_search_change` qui lie la logique aux
--    événements de la table `saved_searches`.
-- =================================================================

-- Étape 1: Activation de l'extension (à exécuter une seule fois dans l'éditeur SQL de Supabase)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- COMMENT ON EXTENSION pg_cron IS 'Système de planification de tâches pour PostgreSQL';

-- =================================================================
-- Étape 2: Fonction principale de vérification des nouvelles propriétés
-- =================================================================
-- Cette fonction est le cœur du système. Elle trouve les nouvelles
-- propriétés correspondant à une recherche sauvegardée et déclenche
-- une Edge Function si des résultats sont trouvés.

CREATE OR REPLACE FUNCTION public.check_new_properties_for_search(saved_search_id_arg uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Important pour que la fonction puisse accéder aux tables avec les permissions du créateur
AS $$
DECLARE
  search_row public.saved_searches;
  user_row public.users;
  new_properties json[];
  last_run_time timestamp with time zone;
  search_criteria jsonb;
BEGIN
  -- Récupérer la recherche sauvegardée et l'utilisateur associé
  SELECT * INTO search_row FROM public.saved_searches WHERE id = saved_search_id_arg;
  SELECT * INTO user_row FROM public.users WHERE id = search_row.user_id;

  -- Si la recherche ou l'utilisateur n'existe plus, ou si les alertes sont désactivées, arrêter.
  IF search_row IS NULL OR user_row IS NULL OR NOT search_row.email_alerts THEN
    RETURN;
  END IF;

  -- Déterminer la date de la dernière vérification pour ne chercher que les nouvelles annonces
  last_run_time := COALESCE(search_row.last_run, search_row.created_at);
  search_criteria := search_row.search_criteria::jsonb;

  -- Trouver les nouvelles propriétés qui correspondent aux critères de la recherche.
  -- NOTE: Cette requête est adaptée au nouveau schéma de la table `properties`.
  SELECT array_agg(p)
  INTO new_properties
  FROM public.properties p
  WHERE
    p.created_at > last_run_time
    AND p.status = 'available' -- Assurez-vous que ce statut est correct
    AND (search_criteria->>'is_for_rent' IS NULL OR p.is_for_rent = (search_criteria->>'is_for_rent')::boolean)
    AND (search_criteria->>'is_for_sale' IS NULL OR p.is_for_sale = (search_criteria->>'is_for_sale')::boolean)
    AND (search_criteria->>'property_type_id' IS NULL OR p.property_type_id = (search_criteria->>'property_type_id')::uuid)
    AND (search_criteria->>'city' IS NULL OR p.city ILIKE (search_criteria->>'city'))
    AND (search_criteria->>'min_price' IS NULL OR p.price >= (search_criteria->>'min_price')::numeric)
    AND (search_criteria->>'max_price' IS NULL OR p.price <= (search_criteria->>'max_price')::numeric)
    -- **MODIFIÉ** : Remplacement de number_of_bedrooms par number_of_rooms
    AND (search_criteria->>'min_rooms' IS NULL OR p.number_of_rooms >= (search_criteria->>'min_rooms')::integer)
    AND (search_criteria->>'min_bathrooms' IS NULL OR p.number_of_bathrooms >= (search_criteria->>'min_bathrooms')::integer);

  -- Si de nouvelles propriétés sont trouvées, appeler la Edge Function pour envoyer l'alerte
  IF array_length(new_properties, 1) > 0 THEN
    PERFORM net.http_post(
      url := 'https://lvcgrmvvbinnbtreurnn.supabase.co/functions/v1/send-property-alerts',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2Y2dybXZ2YmlubmJ0cmV1cm5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MDAzODYsImV4cCI6MjA2NjM3NjM4Nn0.ZqSTOiHS7eDIK4i-0w8Jz4r-bNvHlUlOqJ9y-dOQE9g'
       ),
      body := jsonb_build_object(
        'user', jsonb_build_object('email', user_row.email, 'full_name', user_row.full_name),
        'properties', new_properties,
        'search_name', search_row.name
      )
    );
  END IF;

  -- Mettre à jour la date de la dernière exécution pour cette recherche
  UPDATE public.saved_searches
  SET last_run = NOW()
  WHERE id = saved_search_id_arg;

END;
$$;

-- =================================================================
-- Étape 3: Fonction de gestion du cycle de vie des tâches cron
-- =================================================================
-- Cette fonction est déclenchée par le trigger. Elle crée, met à jour
-- ou supprime une tâche cron en fonction des modifications apportées
-- à la table `saved_searches`.

CREATE OR REPLACE FUNCTION public.manage_property_alert_schedule()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  job_name TEXT := 'check-search-' || COALESCE(NEW.id, OLD.id);
  cron_expression TEXT;
BEGIN
  -- CAS 1: Une recherche est supprimée (DELETE)
  IF (TG_OP = 'DELETE') THEN
    -- On supprime la tâche cron associée pour éviter les exécutions inutiles
    PERFORM cron.unschedule(job_name);
    RETURN OLD;
  END IF;

  -- CAS 2: Une recherche est insérée (INSERT) ou mise à jour (UPDATE)
  
  -- Par précaution, on supprime toute tâche existante pour cette recherche.
  -- Cela gère les changements de fréquence et évite les doublons.
  PERFORM cron.unschedule(job_name);

  -- Si les alertes email sont activées pour cette recherche, on planifie une nouvelle tâche.
  IF NEW.email_alerts THEN
    -- On détermine la fréquence en fonction de la colonne `alert_frequency`
    cron_expression := CASE NEW.alert_frequency
      WHEN 'daily' THEN '0 9 * * *'   -- Tous les jours à 9h00 UTC
      WHEN 'weekly' THEN '0 9 * * 1'  -- Tous les lundis à 9h00 UTC
      -- Le cas 'immediate' est géré par l'application, pas par cron.
      ELSE NULL
    END;

    -- On planifie la tâche uniquement si une expression cron valide a été déterminée
    IF cron_expression IS NOT NULL THEN
      PERFORM cron.schedule(
        job_name,
        cron_expression,
        -- La commande SQL est passée en une seule ligne pour éviter les erreurs de syntaxe
        'SELECT public.check_new_properties_for_search(' || quote_literal(NEW.id::text) || ')'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- =================================================================
-- Étape 4: Trigger sur la table `saved_searches`
-- =================================================================
-- Ce trigger exécute la fonction `manage_property_alert_schedule`
-- après chaque insertion, suppression, ou mise à jour pertinente
-- dans la table `saved_searches`.

-- On supprime d'abord l'ancien trigger s'il existe pour garantir une installation propre.
DROP TRIGGER IF EXISTS on_saved_search_change ON public.saved_searches;

-- Création du trigger qui surveille les changements.
CREATE TRIGGER on_saved_search_change
  -- Se déclenche après une insertion, une suppression, ou une mise à jour des colonnes clés.
  AFTER INSERT OR DELETE OR UPDATE OF email_alerts, alert_frequency
  ON public.saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION public.manage_property_alert_schedule();

COMMENT ON TRIGGER on_saved_search_change ON public.saved_searches
IS 'Gère automatiquement les tâches cron pour les alertes de propriétés lors de la modification d''une recherche.';
-- ==================================================================