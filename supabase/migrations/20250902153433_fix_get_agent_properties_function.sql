-- Fichier: 20250903103000_fix_get_agent_properties_function.sql
-- Objectif: Corriger la fonction get_agent_properties_with_contacts pour résoudre l'incompatibilité de type (bigint vs integer).

-- On supprime l'ancienne version de la fonction si elle existe, pour garantir une recréation propre.
DROP FUNCTION IF EXISTS public.get_agent_properties_with_contacts(uuid);

-- On recrée la fonction avec la correction de type (le casting ::integer).
CREATE OR REPLACE FUNCTION public.get_agent_properties_with_contacts(agent_uuid uuid)
RETURNS TABLE (
  id uuid,
  title text,
  status text,
  price numeric,
  image_paths jsonb,
  view_count integer,
  contacts_count integer, -- On promet bien un integer
  created_at timestamptz
) 
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.status,
    p.price,
    to_jsonb(p.image_paths),
    p.view_count,
    -- La correction cruciale : on convertit le résultat de COUNT(*) en integer
    (SELECT COUNT(*) FROM public.communications c WHERE c.property_id = p.id)::integer AS contacts_count,
    p.created_at
  FROM public.properties p
  WHERE p.agent_id = agent_uuid;
END;
$$;

-- On s'assure que les permissions sont correctes pour les utilisateurs authentifiés.
GRANT EXECUTE ON FUNCTION public.get_agent_properties_with_contacts(uuid) TO authenticated;
