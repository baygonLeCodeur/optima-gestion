-- supabase/migrations/001_create_view_properties_with_types.sql
-- Vue pour retourner les propriétés avec leur type et tours virtuels pré-assemblés
CREATE VIEW public.view_properties_with_types AS
SELECT
  p.*,
  -- pt.id would duplicate p.property_type_id if the properties table already exposes it.
  -- We only expose the human-readable name from property_types to avoid duplicate column names.
  pt.name AS property_type_name,
  jsonb_agg(vt.*) FILTER (WHERE vt.id IS NOT NULL) AS virtual_tours
FROM properties p
LEFT JOIN property_types pt ON pt.id = p.property_type_id
LEFT JOIN virtual_tours vt ON vt.property_id = p.id
GROUP BY p.id, pt.name;

-- Grant select for anon/public role if needed
GRANT SELECT ON public.view_properties_with_types TO public;
