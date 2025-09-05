-- supabase/migrations/20250902120000_fix_function_permissions.sql

-- ... (DROP FUNCTION reste identique) ...
DROP FUNCTION IF EXISTS public.get_agent_properties_with_contacts(uuid) CASCADE;

-- On la recrée avec la correction de type
CREATE FUNCTION public.get_agent_properties_with_contacts(agent_uuid uuid)
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
    -- LA CORRECTION EST ICI : On convertit le résultat de COUNT(*) en integer
    (SELECT COUNT(*) FROM public.communications c WHERE c.property_id = p.id)::integer AS contacts_count,
    p.created_at
  FROM public.properties p
  WHERE p.agent_id = agent_uuid;
END;
$$;

-- ... (GRANT EXECUTE reste identique) ...
GRANT EXECUTE ON FUNCTION public.get_agent_properties_with_contacts(uuid) TO authenticated;
