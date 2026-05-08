# Sécurité — OPTIMA GESTION

## Principes fondamentaux

1. **Defense in depth** : plusieurs couches de sécurité
2. **Least privilege** : chaque rôle accède uniquement à ce dont il a besoin
3. **Fail securely** : en cas d'erreur, rejeter la requête
4. **No secrets in code** : toutes les clés dans `.env.local`, jamais dans le code

---

## Variables d'environnement

### Règle absolue
- `.env.local` est dans `.gitignore` — vérifier à **chaque session** Claude Code
- `.env.example` est commité avec des valeurs vides
- Les variables préfixées `NEXT_PUBLIC_` sont exposées côté client — **ne jamais y mettre de secrets**
- `SUPABASE_SERVICE_ROLE_KEY` : uniquement dans les API Routes côté serveur

### Vérification au démarrage
```typescript
// lib/utils/check-env.ts — à appeler au boot de l'app
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
]

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Variable d'environnement manquante : ${key}`)
  }
})
```

---

## Headers de sécurité HTTP

### Configuration (`next.config.ts`)
```typescript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self)'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' cdn.jsdelivr.net",  // Pannellum CDN
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com",
      "img-src 'self' data: blob: *.supabase.co",
      "connect-src 'self' *.supabase.co api-checkout.cinetpay.com",
      "frame-src 'self'",
    ].join('; ')
  },
]
```

---

## Middleware d'authentification

### `middleware.ts` (racine du projet)
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/middleware'

// Routes protégées par rôle
const PROTECTED_ROUTES = {
  '/client': ['client', 'admin'],
  '/agent':  ['agent', 'admin'],
  '/admin':  ['admin'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const supabase = createServerClient(request)

  // Vérifier la session
  const { data: { user } } = await supabase.auth.getUser()

  // ⚠️ Le rôle est dans public.users, pas dans user_metadata
  let role: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', user.id)
      .single()
    if (!profile?.is_active) {
      return NextResponse.redirect(new URL('/auth/compte-desactive', request.url))
    }
    role = profile?.role ?? null
  }

  // Vérifier les droits d'accès
  for (const [prefix, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(prefix)) {
      if (!user) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }
      if (!role || !allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/client/:path*', '/agent/:path*', '/admin/:path*'],
}
```

---

## Validation des inputs (Zod)

### Règle : Valider TOUT côté serveur

Exemple de schémas :
```typescript
// types/schemas/property.ts
import { z } from 'zod'

export const CreatePropertySchema = z.object({
  title: z.string()
    .min(10, 'Le titre doit faire au moins 10 caractères')
    .max(200, 'Le titre ne doit pas dépasser 200 caractères')
    .trim(),
  description: z.string().min(50).max(5000).trim().optional(),
  address: z.string().min(5).max(300).trim(),
  price: z.number()
    .positive('Le prix doit être positif')
    .max(10_000_000_000, 'Prix trop élevé'),
  area_sqm: z.number().positive().max(100_000).optional(),   // ⚠️ area_sqm
  is_for_sale: z.boolean(),
  is_for_rent: z.boolean(),
  property_type_id: z.string().uuid(),
  city: z.string().min(2).max(100).trim(),
  number_of_rooms: z.number().int().min(0).max(50).optional(),      // ⚠️ number_of_rooms
  number_of_bathrooms: z.number().int().min(0).max(20).optional(),  // ⚠️ number_of_bathrooms
  security_deposit: z.number().int().min(0).optional(),  // Caution en mois
  advance_rent: z.number().int().min(0).optional(),      // Avance en mois
})

export const LeadFormSchema = z.object({
  full_name: z.string().min(2).max(100).trim(),   // ⚠️ full_name, pas name
  email: z.string().email('Email invalide').toLowerCase(),
  phone_number: z.string()                         // ⚠️ phone_number, pas phone
    .regex(/^\+?[0-9\s\-]{8,20}$/, 'Numéro de téléphone invalide')
    .optional(),
  interest: z.string().min(10).max(2000).trim().optional(),
  budget_min: z.number().positive().optional(),
  budget_max: z.number().positive().optional(),
  source: z.string().optional(),
})
```

---

## Supabase Row Level Security (RLS)

### Politiques attendues sur les tables principales

**Table `properties`** (politiques réelles)
```sql
-- Lecture publique des biens disponibles
-- ⚠️ status = 'available' (anglais), et double condition is_for_sale/is_for_rent
CREATE POLICY "Public can view available properties"
ON public.properties FOR SELECT
USING (status = 'available' AND (is_for_sale = true OR is_for_rent = true));

-- Agents gèrent leurs biens + admins voient tout
CREATE POLICY "Agents can manage their properties"
ON public.properties FOR ALL
USING (agent_id = auth.uid() OR get_my_role() = 'admin');
-- ⚠️ get_my_role() lit dans public.users, pas dans user_metadata
```

**Table `leads`** (politiques réelles)
```sql
-- Agents sur leurs leads assignés + admins
CREATE POLICY "Agents can manage assigned leads"
ON public.leads FOR ALL
USING (
    assigned_agent_id = auth.uid() OR 
    get_my_role() = 'admin'
);
-- ⚠️ Pas de politique d'insertion publique dans le schéma fourni
-- Si le formulaire de contact doit insérer des leads sans auth, ajouter :
-- CREATE POLICY "Anyone can create a lead" ON public.leads FOR INSERT WITH CHECK (true);
```

**Table `visits`** (politiques réelles)
```sql
-- Les trois parties impliquées + admins
CREATE POLICY "Involved parties can manage visits"
ON public.visits FOR ALL
USING (
    client_id = auth.uid() OR 
    agent_id = auth.uid() OR 
    get_my_role() = 'admin'
);
```

---

## Sécurité des uploads (Supabase Storage)

```typescript
// Vérifications avant upload
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_DOC_TYPES = ['application/pdf']
// ⚠️ Après upload, stocker le PATH dans image_paths[] (TEXT[]), pas l'URL complète
// L'URL publique se reconstruit via supabase.storage.from('property-images').getPublicUrl(path)

export function validateImageFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return 'Le fichier ne doit pas dépasser 10 MB'
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Format non supporté (jpg, png, webp uniquement)'
  }
  return null // OK
}

// Nommage sécurisé des fichiers (éviter path traversal)
export function generateSafeFilename(originalName: string, userId: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() ?? 'jpg'
  return `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
}
```

---

## Protection du Webhook CinetPay

```typescript
// Vérification de la signature du webhook
import { createHmac } from 'crypto'

export function verifyCinetPayWebhook(
  body: string,
  signature: string,
  secretKey: string
): boolean {
  const expected = createHmac('sha256', secretKey)
    .update(body)
    .digest('hex')
  return signature === expected
}
```

---

## Audit et Logs

- Toutes les actions sensibles écrites dans `audit_logs` (Supabase)
- Champs : `user_id`, `action`, `resource_type`, `resource_id`, `ip_address`, `created_at`
- Actions à logger : login, logout, création/modification/suppression de biens, paiements, signature de documents, changement de rôle

---

## Checklist de sécurité (à vérifier avant chaque déploiement)

### Secrets et variables d'env
- [ ] `.env.local` absent du commit (`git status`)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` non préfixé `NEXT_PUBLIC_`
- [ ] `NEXTAUTH_SECRET` présent et robuste (32+ caractères)
- [ ] Variables de production configurées sur Vercel (Settings → Environment Variables)
- [ ] `NEXTAUTH_URL=https://optima-gestion.vercel.app` en production
- [ ] `NEXT_PUBLIC_APP_URL=https://optima-gestion.vercel.app` en production

### Code et API
- [ ] RLS activé sur toutes les tables Supabase
- [ ] Headers de sécurité configurés dans `next.config.ts`
- [ ] Toutes les API Routes valident le body avec Zod
- [ ] Toutes les API Routes vérifient l'authentification
- [ ] CORS configuré (origines : `optima-gestion.vercel.app` seulement en prod)
- [ ] Pas de `console.log` avec données sensibles en production
- [ ] Rate limiting sur les endpoints publics (formulaire contact, login)

### Spécifique au site en production
- [ ] Les pages publiques existantes (`/`, `/acheter`, `/louer`, `/location-vente`, `/a-propos`) toujours fonctionnelles après chaque déploiement
- [ ] La RLS sur `properties` autorise bien la lecture publique (`status='available'`)
- [ ] La RLS sur `testimonials` autorise bien la lecture publique (`is_approved=true`)
- [ ] Le formulaire de contact génère bien un `lead` dans la table `leads`
