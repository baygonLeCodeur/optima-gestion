# CLAUDE.md — OPTIMA GESTION

## Identité du projet
Plateforme web SaaS haut de gamme pour **OPTIMA GESTION**, entreprise ivoirienne de gestion immobilière.
Développée sous **INTELLECT CERTAINTY**.
Le projet doit être **commercialisable, évolutif, performant et sécurisé**.

## Stack technique
- **Frontend** : Next.js 14+ (App Router, TypeScript strict)
- **Styling** : Tailwind CSS (thème custom : blanc, noir, vert)
- **Backend** : API Routes Next.js + Server Actions
- **Base de données** : PostgreSQL via Supabase (client `@supabase/supabase-js`)
- **Auth** : NextAuth.js (compatible avec tables `accounts`, `sessions`, `verification_tokens`)
- **ORM/Queries** : Supabase client uniquement (pas de Prisma)
- **State management** : Zustand ou React Context selon la complexité
- **Formulaires** : React Hook Form + Zod (validation stricte)

## Règles critiques sur le schéma de données
> Ces erreurs sont les plus fréquentes — les mémoriser.

| ❌ Ne pas écrire | ✅ Écrire à la place |
|-----------------|---------------------|
| `phone` | `phone_number` |
| `avatar_url` | `image` |
| `bedrooms` | `number_of_rooms` |
| `bathrooms` | `number_of_bathrooms` |
| `area` | `area_sqm` |
| `views_count` | `view_count` |
| `images` (JSONB) | `image_paths` (TEXT[]) |
| `filters` (saved_searches) | `search_criteria` |
| `body` (notifications) | `message` |
| `is_active` (agent_availabilities) | `is_available` |
| `duration_min` (visits) | `duration_minutes` |
| `status = 'disponible'` | `status = 'available'` |
| `status = 'loue'` | `status = 'rented'` |
| `status = 'vendu'` | `status = 'sold'` |
| `visit_type = 'physique'` | `visit_type = 'physical'` |
| `lead.status = 'nouveau'` | `lead.status = 'new'` |
| `user_metadata.role` | `SELECT role FROM users WHERE id = auth.uid()` |

### Récupérer le rôle utilisateur
Le rôle est dans `public.users.role`, **pas** dans `auth.users.user_metadata`.
Utiliser la fonction SQL déjà en base : `get_my_role()` dans les politiques RLS.
En TypeScript côté serveur :
```typescript
const { data: profile } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single()
const role = profile?.role  // 'client' | 'agent' | 'admin'
```

### Modèle économique agent (tables spécifiques)
- `agent_wallets` : solde du portefeuille de chaque agent
- `funds_deposit` : historique des recharges via CinetPay
- `ads_activating` : chaque activation d'annonce déduit du wallet ; expire automatiquement après 30 jours (trigger)

## Architecture des espaces
La plateforme est organisée en **4 espaces distincts** avec **12 interfaces** :

| Espace | Interfaces |
|---|---|
| Public | Page d'accueil, Détail d'un bien |
| Client | Dashboard, Recherche avancée, Espace personnel |
| Agent | Dashboard, Gestion annonces, Leads/Communications, Calendrier |
| Admin | Dashboard, Gestion utilisateurs, Configuration & Rapports |

Structure des routes Next.js :
```
/                          → Espace public - Accueil + recherche globale
/acheter                   → Espace public - Biens à vendre (is_for_sale=true)
/louer                     → Espace public - Biens à louer (is_for_rent=true)
/location-vente            → Espace public - Location-vente (is_for_sale=true AND is_for_rent=true)
/a-propos                  → Espace public - Présentation OPTIMA GESTION
/vendre                    → Espace public - Formulaire mandat de vente / contact
/bien/[id]                 → Espace public - Détail d'un bien
/auth/login                → Authentification
/auth/register             → Authentification
/client/dashboard          → Espace client
/client/recherche          → Espace client
/client/profil             → Espace client
/agent/dashboard           → Espace agent
/agent/annonces            → Espace agent
/agent/leads               → Espace agent
/agent/calendrier          → Espace agent
/admin/dashboard           → Espace admin
/admin/utilisateurs        → Espace admin
/admin/configuration       → Espace admin
```

## Logique des types de transaction (CRITIQUE)
La table `properties` utilise **deux booléens combinés**, pas un champ `transaction_type` :

| Page | Requête Supabase |
|------|-----------------|
| `/acheter` | `is_for_sale=true AND is_for_rent=false` |
| `/louer` | `is_for_rent=true AND is_for_sale=false` |
| `/location-vente` | `is_for_sale=true AND is_for_rent=true` |
| Toutes les annonces | `is_for_sale=true OR is_for_rent=true` |

Ne jamais créer un champ `transaction_type` — utiliser exclusivement ces deux booléens.

## Filtre de recherche en cascade (UI existante)
Le moteur de recherche public fonctionne en **4 niveaux dépendants** :
1. **Type de bien** → alimente la liste des villes disponibles
2. **Ville** (`city`) → alimente la liste des secteurs disponibles
3. **Secteur** (`zip_code` ou champ dédié dans `properties`) → alimente la fourchette de prix
4. **Prix** → filtre final

Respecter strictement cette UX lors de toute modification du moteur de recherche.

## Intégrations externes (architecture évolutive)

### Paiement — CinetPay
- Méthodes : WAVE, Orange Money, MTN Money, Moov Money
- Fichier de config : `lib/cinetpay/config.ts`
- **Clé API non encore disponible** → créer les interfaces et les types, utiliser un flag `CINETPAY_ENABLED=false` dans `.env`
- La logique de paiement doit être encapsulée dans `lib/cinetpay/client.ts`

### Visites virtuelles — Pannellum
- Bibliothèque JS : `pannellum` (via CDN ou npm)
- Composant dédié : `components/VirtualTour/PannellumViewer.tsx`
- **Pas de clé API requise** → peut être implémenté directement
- Données de tour depuis la table `virtual_tours` (Supabase)

### Signature électronique — Adobe Sign
- Fichier de config : `lib/adobe-sign/config.ts`
- **Clé API non encore disponible** → flag `ADOBE_SIGN_ENABLED=false` dans `.env`
- Interface utilisateur à construire avec un mode "simulation" activable

### Communication — WhatsApp
- Liens directs : `whatsapp://send?phone=NUMERO&text=MESSAGE`
- Pas d'API, pas de clé → **implémentable immédiatement**
- Composant : `components/Communication/WhatsAppButton.tsx`

### Wallet agent — Modèle économique
- Les agents rechargent leur `agent_wallets.balance` via CinetPay (`funds_deposit`)
- Chaque activation d'annonce (`ads_activating`) déduit un montant du wallet
- L'annonce expire automatiquement après 30 jours (trigger SQL déjà en base)
- Vérifier le solde avant activation dans `lib/wallet/check-balance.ts`
- Tables concernées : `agent_wallets`, `funds_deposit`, `ads_activating`

## Standards de code obligatoires

### TypeScript
- `strict: true` dans `tsconfig.json` — aucune exception
- Typage explicite de toutes les fonctions, props, et retours d'API
- Pas de `any` — utiliser `unknown` si nécessaire
- Tous les types Supabase générés dans `types/supabase.ts`

### Architecture des fichiers
```
src/
├── app/                    # Routes Next.js App Router
├── components/             # Composants réutilisables
│   ├── ui/                 # Composants UI génériques (boutons, inputs...)
│   ├── layout/             # Header, Footer, Sidebar
│   ├── properties/         # Composants liés aux biens
│   ├── dashboard/          # Composants dashboard
│   └── [feature]/          # Un dossier par fonctionnalité
├── lib/                    # Logique métier et utilitaires
│   ├── supabase/           # Client et helpers Supabase
│   ├── cinetpay/           # Intégration CinetPay
│   ├── adobe-sign/         # Intégration Adobe Sign
│   └── utils/              # Fonctions utilitaires pures
├── hooks/                  # Custom React hooks
├── stores/                 # Zustand stores
├── types/                  # Types TypeScript globaux
└── constants/              # Constantes de l'application
```

### Nommage
- **Composants** : PascalCase (`PropertyCard.tsx`)
- **Hooks** : camelCase avec préfixe `use` (`usePropertySearch.ts`)
- **Fichiers utilitaires** : kebab-case (`format-price.ts`)
- **Tables Supabase** : snake_case (respecter le schéma existant)
- **Variables d'env** : UPPER_SNAKE_CASE

### CSS / Tailwind
- Utiliser exclusivement les classes Tailwind
- Pas de CSS inline sauf animations complexes
- Thème custom dans `tailwind.config.ts` :
  - `primary` : vert OPTIMA
  - `neutral` : noir/blanc
- Responsive obligatoire : mobile-first

## Sécurité (règles non négociables)
- Jamais de clé secrète côté client
- `.env.local` dans `.gitignore` — vérifier à chaque session
- RLS (Row Level Security) Supabase activé et vérifié sur toutes les tables sensibles
- Validation des inputs : **Zod côté serveur** sur toutes les API routes
- Sanitisation des données avant insertion en base
- Middleware Next.js pour la protection des routes authentifiées
- Headers de sécurité configurés dans `next.config.ts` (CSP, X-Frame-Options, etc.)

## Performance
- Images : `next/image` obligatoire avec `sizes` et `priority` appropriés
- Lazy loading des composants lourds (Pannellum, cartes)
- Pagination côté serveur pour toutes les listes
- Mise en cache : `unstable_cache` ou `revalidate` sur les données publiques

## Workflow de développement
- Travailler **module par module** dans l'ordre défini dans `docs/todo.md`
- Cocher les tâches dans `docs/todo.md` à chaque complétion
- Créer des **composants atomiques réutilisables** avant les pages
- Tester chaque API route avant d'intégrer dans le frontend

## Docs de référence
@docs/architecture.md
@docs/database-schema.md
@docs/api-standards.md
@docs/ui-design-system.md
@docs/integrations.md
@docs/security.md
@docs/todo.md
