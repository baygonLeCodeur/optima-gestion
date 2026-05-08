# Architecture — OPTIMA GESTION

## Vue d'ensemble

L'application suit une architecture **monolithique modulaire** basée sur Next.js App Router.
Toute la logique est dans un seul dépôt (frontend + backend via API Routes).

```
Client Browser
      │
      ▼
┌─────────────────────────────────────┐
│         Next.js App (Vercel)        │
│  ┌──────────┐   ┌────────────────┐  │
│  │  App     │   │  API Routes    │  │
│  │  Router  │   │  /api/**       │  │
│  │  (Pages) │   │  (Server-side) │  │
│  └──────────┘   └───────┬────────┘  │
└───────────────────────┬─┴───────────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ Supabase │  │CinetPay  │  │Adobe Sign│
    │  (DB +   │  │  (API)   │  │  (API)   │
    │   Auth + │  └──────────┘  └──────────┘
    │ Storage) │
    └──────────┘
```

## Structure des fichiers

```
optima-gestion/
├── CLAUDE.md                          # Instructions Claude Code
├── docs/                              # Documentation du projet
│   ├── todo.md
│   ├── architecture.md
│   ├── database-schema.md
│   ├── api-standards.md
│   ├── ui-design-system.md
│   ├── integrations.md
│   └── security.md
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Page d'accueil (/) — recherche globale
│   │   ├── acheter/
│   │   │   └── page.tsx               # Biens à vendre (is_for_sale=true AND is_for_rent=false)
│   │   ├── louer/
│   │   │   └── page.tsx               # Biens à louer (is_for_rent=true AND is_for_sale=false)
│   │   ├── location-vente/
│   │   │   └── page.tsx               # Location-vente (is_for_sale=true AND is_for_rent=true)
│   │   ├── a-propos/
│   │   │   └── page.tsx               # Présentation OPTIMA GESTION
│   │   ├── vendre/
│   │   │   └── page.tsx               # Formulaire mandat / contact vendeur
│   │   ├── bien/
│   │   │   └── [id]/page.tsx          # Détail bien (/bien/[id])
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── client/
│   │   │   ├── layout.tsx             # Layout espace client
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── recherche/page.tsx
│   │   │   └── profil/page.tsx
│   │   ├── agent/
│   │   │   ├── layout.tsx             # Layout espace agent
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── annonces/
│   │   │   │   ├── page.tsx           # Liste annonces
│   │   │   │   ├── nouvelle/page.tsx  # Créer annonce
│   │   │   │   └── [id]/page.tsx      # Modifier annonce
│   │   │   ├── leads/page.tsx
│   │   │   └── calendrier/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx             # Layout espace admin
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── utilisateurs/page.tsx
│   │   │   └── configuration/page.tsx
│   │   └── api/                       # API Routes (server-side)
│   │       ├── auth/
│   │       ├── properties/
│   │       ├── leads/
│   │       ├── visits/
│   │       ├── payments/
│   │       │   ├── initiate/route.ts
│   │       │   └── webhook/route.ts
│   │       ├── documents/
│   │       └── admin/
│   │
│   ├── components/
│   │   ├── ui/                        # Composants atomiques
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Pagination.tsx
│   │   │   └── Toast.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── AuthLayout.tsx
│   │   ├── properties/
│   │   │   ├── PropertyCard.tsx
│   │   │   ├── PropertyGrid.tsx
│   │   │   ├── PropertyList.tsx
│   │   │   ├── PropertyFilters.tsx
│   │   │   ├── PropertyForm.tsx
│   │   │   └── PropertyMap.tsx
│   │   ├── virtual-tour/
│   │   │   └── PannellumViewer.tsx
│   │   ├── communication/
│   │   │   └── WhatsAppButton.tsx
│   │   ├── payments/
│   │   │   └── CinetPayForm.tsx
│   │   ├── documents/
│   │   │   └── SignatureWidget.tsx
│   │   └── dashboard/
│   │       ├── KPICard.tsx
│   │       ├── RecentActivity.tsx
│   │       └── Charts.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # Client côté navigateur
│   │   │   ├── server.ts              # Client côté serveur (SSR)
│   │   │   └── middleware.ts          # Helper middleware
│   │   ├── cinetpay/
│   │   │   ├── config.ts              # Config CinetPay
│   │   │   └── client.ts             # Wrapper API CinetPay
│   │   ├── adobe-sign/
│   │   │   ├── config.ts              # Config Adobe Sign
│   │   │   └── client.ts             # Wrapper API Adobe Sign
│   │   └── utils/
│   │       ├── format-price.ts        # Formatage prix FCFA
│   │       ├── format-date.ts         # Formatage dates
│   │       └── cn.ts                  # Utilitaire classnames
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProperties.ts
│   │   ├── useLeads.ts
│   │   └── useNotifications.ts
│   │
│   ├── stores/                        # Zustand stores
│   │   ├── authStore.ts
│   │   └── searchStore.ts
│   │
│   ├── types/
│   │   ├── supabase.ts                # Types générés depuis Supabase
│   │   ├── property.ts                # Types métier biens
│   │   ├── user.ts                    # Types utilisateurs
│   │   └── lead.ts                    # Types leads
│   │
│   └── constants/
│       ├── property-types.ts
│       ├── roles.ts
│       └── routes.ts
│
├── middleware.ts                       # Protection des routes
├── next.config.ts                      # Config Next.js + headers sécurité
├── tailwind.config.ts                  # Thème OPTIMA
├── tsconfig.json                       # TypeScript strict
├── .env.local                          # Variables d'environnement (non commité)
└── .env.example                        # Template variables d'env (commité)
```

## Flux de données

### Lecture de données (publique)
```
Page (Server Component)
  → lib/supabase/server.ts
  → Requête Supabase (avec RLS)
  → Données → Props → Composant React
```

### Mutation de données (authentifié)
```
Composant Client
  → API Route /api/**
  → Validation Zod (serveur)
  → lib/supabase/server.ts
  → Supabase (avec RLS)
  → Réponse JSON
```

### Auth Flow
```
User → /auth/login
  → NextAuth.js (credentials ou OAuth)
  → Session stockée dans public.sessions
  → middleware.ts vérifie la session
  → Requête SELECT role, is_active FROM public.users WHERE id = session.userId
  → Redirection selon le rôle : admin → /admin/dashboard, agent → /agent/dashboard, client → /client/dashboard
```

## Gestion des rôles

Les rôles sont stockés dans `user_metadata.role` de Supabase Auth :

| Rôle | Valeur | Accès |
|------|--------|-------|
| Administrateur | `admin` | Tous les espaces |
| Agent | `agent` | Espace agent + public |
| Client | `client` | Espace client + public |
| Public | *(non connecté)* | Espace public seulement |

Le middleware `middleware.ts` intercepte toutes les routes et vérifie :
1. La présence d'un JWT valide
2. Le rôle de l'utilisateur vs. la route demandée
3. Redirige vers `/auth/login` si non authentifié
4. Redirige vers `/` si le rôle ne correspond pas
