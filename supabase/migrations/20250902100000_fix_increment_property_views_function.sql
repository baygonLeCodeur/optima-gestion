create or replace function public.increment_property_views(property_uuid uuid)
returns void
language sql
security definer
as $function$
  update public.properties
  set view_count = view_count + 1
  where id = property_uuid;
$function$;