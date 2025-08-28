# Supabase migrations & type generation

This project includes SQL migrations and helper types to improve runtime performance and TypeScript safety.

Files added:
- `supabase/migrations/001_create_view_properties_with_types.sql` — creates `view_properties_with_types` view.
- `supabase/migrations/002_create_function_get_agent_properties_with_contacts.sql` — creates RPC `get_agent_properties_with_contacts(uuid)`.

How to apply migrations (locally):

1. Install Supabase CLI and login (if not already):

```bash
npm install -g supabase
supabase login
```

2. Apply migrations (from repo root):

```bash
supabase db remote set <your-db-connection-string>
supabase db push --project-ref <your-project-ref>
```

Note: You may prefer to run these SQL files via your usual migration tooling.

Regenerate TypeScript types for Supabase (after migrations):

```bash
npx supabase gen types typescript --project-id <project-id> --schema public > src/types/supabase.ts
```

After regenerating types, run TypeScript check:

```bash
npm run typecheck
```

If you want me to run the migrations and regenerate types, provide access details or run the commands locally and then I will continue the sweep to remove temporary `RPCRow` / `Record<string, any>` placeholders and replace them with generated types.
