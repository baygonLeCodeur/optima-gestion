-- supabase/migrations/002_create_function_get_agent_properties_with_contacts.sql
-- Fonction RPC qui retourne les propriétés d'un agent avec le nombre de contacts
-- Si une fonction existante a un type de retour différent, DROP avant CREATE
DROP FUNCTION IF EXISTS public.get_agent_properties_with_contacts(uuid) CASCADE;
CREATE FUNCTION public.get_agent_properties_with_contacts(agent_uuid uuid)
RETURNS TABLE (
  id uuid,
  title text,
  status text,
  price numeric,
  image_paths jsonb,
  view_count integer,
  contacts_count integer,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.status,
    p.price,
    p.image_paths,
    p.view_count,
    (SELECT COUNT(*) FROM contacts c WHERE c.property_id = p.id) AS contacts_count,
    p.created_at
  FROM properties p
  WHERE p.agent_id = agent_uuid;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_agent_properties_with_contacts(uuid) TO public;