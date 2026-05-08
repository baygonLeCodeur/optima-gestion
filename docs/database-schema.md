# Schéma de base de données — OPTIMA GESTION
> Schéma réel de la base Supabase (PostgreSQL). Source de vérité pour tous les accès aux données.
> **Ne jamais deviner les noms de colonnes — toujours se référer à ce fichier.**

---

## Extensions activées
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- Génération UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- Chiffrement
```

---

## Résumé des tables

| Table | Rôle |
|-------|------|
| `users` | Profils utilisateurs (clients, agents, admins) — compatible NextAuth.js |
| `accounts` | Comptes OAuth NextAuth.js |
| `sessions` | Sessions NextAuth.js |
| `verification_tokens` | Tokens de vérification email NextAuth.js |
| `property_types` | Types de biens (appartement, maison, bureau, terrain…) |
| `properties` | Biens immobiliers |
| `virtual_tours` | Visites virtuelles Pannellum par bien |
| `agent_availabilities` | Créneaux de disponibilité des agents |
| `visits` | Visites planifiées |
| `leads` | Prospects avec tracking UTM et suivi de conversion |
| `communications` | Historique de toutes les communications |
| `documents` | Documents avec intégration Adobe Sign |
| `property_estimations` | Estimations de valeur des biens |
| `payments` | Paiements CinetPay (clients) |
| `agent_wallets` | Portefeuilles virtuels des agents |
| `funds_deposit` | Dépôts de fonds dans les wallets agents |
| `ads_activating` | Activation et expiration des annonces payantes |
| `testimonials` | Témoignages clients (affichage public si approuvés) |
| `user_favorites` | Biens favoris des clients |
| `saved_searches` | Recherches sauvegardées avec alertes email |
| `notifications` | Notifications in-app |
| `audit_logs` | Journal d'audit complet |

---

## Tables détaillées

### `users`
> ⚠️ Le rôle est stocké dans cette table (`role`), **pas** dans `auth.users.user_metadata`.
> Pour récupérer le rôle depuis les politiques RLS, utiliser la fonction `get_my_role()`.

```sql
CREATE TABLE public.users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email               TEXT UNIQUE NOT NULL,
    email_verified      TIMESTAMP WITH TIME ZONE,
    full_name           TEXT,
    phone_number        TEXT,          -- ⚠️ phone_number, pas phone
    image               TEXT,          -- Avatar (pas avatar_url)
    role                TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'agent', 'admin')),
    provider            TEXT,          -- 'google', 'credentials', etc.
    provider_account_id TEXT,
    is_active           BOOLEAN DEFAULT TRUE,
    last_login          TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `accounts` (NextAuth.js)
```sql
CREATE TABLE public.accounts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type                TEXT NOT NULL,
    provider            TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    refresh_token       TEXT,
    access_token        TEXT,
    expires_at          INTEGER,
    token_type          TEXT,
    scope               TEXT,
    id_token            TEXT,
    session_state       TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider, provider_account_id)
);
```

### `sessions` (NextAuth.js)
```sql
CREATE TABLE public.sessions (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token TEXT UNIQUE NOT NULL,
    user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    expires       TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `verification_tokens` (NextAuth.js)
```sql
CREATE TABLE public.verification_tokens (
    identifier TEXT NOT NULL,
    token      TEXT UNIQUE NOT NULL,
    expires    TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (identifier, token)
);
```

### `property_types`
```sql
CREATE TABLE public.property_types (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT UNIQUE NOT NULL,    -- Identifiant technique
    description TEXT,
    icon_name   TEXT,                    -- Nom icône Lucide React (pas icon)
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `properties`
> ⚠️ Points d'attention critiques :
> - **Pas de champ `transaction_type`** — les trois modes sont encodés par deux booléens :
>   - Vente pure       : `is_for_sale = true  AND is_for_rent = false`  → page `/acheter`
>   - Location pure    : `is_for_rent = true  AND is_for_sale = false`  → page `/louer`
>   - Location-vente   : `is_for_sale = true  AND is_for_rent = true`   → page `/location-vente`
> - Superficie → `area_sqm` (pas `area`)
> - Chambres → `number_of_rooms` (pas `bedrooms`)
> - Salles de bain → `number_of_bathrooms` (pas `bathrooms`)
> - Vues → `view_count` (pas `views_count`)
> - Images → `image_paths TEXT[]` (pas `images JSONB`)
> - Status en anglais : `'available'`, `'rented'`, `'sold'`, `'under_contract'`, `'archived'`
> - Le filtre de recherche public fonctionne en cascade : Type → Ville (`city`) → Secteur (`zip_code`) → Prix

```sql
CREATE TABLE public.properties (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title                TEXT NOT NULL,
    description          TEXT,
    address              TEXT NOT NULL,
    city                 TEXT NOT NULL,
    zip_code             TEXT,
    country              TEXT NOT NULL DEFAULT 'Côte d''Ivoire',
    latitude             NUMERIC(10, 8),
    longitude            NUMERIC(11, 8),
    price                NUMERIC(15, 2) NOT NULL,
    security_deposit     SMALLINT,      -- Caution en nombre de mois
    advance_rent         SMALLINT,      -- Avance en nombre de mois
    currency             TEXT NOT NULL DEFAULT 'XOF',
    area_sqm             NUMERIC(10, 2),
    number_of_rooms      INTEGER,
    number_of_bathrooms  INTEGER,
    number_of_parkings   INTEGER DEFAULT 0,
    has_garden           BOOLEAN DEFAULT FALSE,
    has_pool             BOOLEAN DEFAULT FALSE,
    has_elevator         BOOLEAN DEFAULT FALSE,
    floor_number         INTEGER,
    total_floors         INTEGER,
    year_built           INTEGER,
    energy_rating        TEXT CHECK (energy_rating IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
    property_type_id     UUID NOT NULL REFERENCES public.property_types(id) ON DELETE RESTRICT,
    status               TEXT NOT NULL DEFAULT 'available'
                         CHECK (status IN ('available', 'rented', 'sold', 'under_contract', 'archived')),
    is_for_sale          BOOLEAN NOT NULL DEFAULT FALSE,
    is_for_rent          BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured          BOOLEAN DEFAULT FALSE,
    view_count           INTEGER DEFAULT 0,
    image_paths          TEXT[] DEFAULT ARRAY[]::TEXT[],
    video_paths          TEXT[] DEFAULT ARRAY[]::TEXT[],
    document_paths       TEXT[] DEFAULT ARRAY[]::TEXT[],  -- Plans, diagnostics
    amenities            TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    agent_id             UUID REFERENCES public.users(id) ON DELETE SET NULL
);
```

### `virtual_tours`
> ⚠️ Champs supplémentaires vs. schéma initial : `default_scene`, `hotspots`, `auto_rotate`, `auto_rotate_speed`

```sql
CREATE TABLE public.virtual_tours (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id       UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    title             TEXT NOT NULL,
    default_scene     TEXT,               -- ID de la scène affichée par défaut
    scenes            JSONB NOT NULL,     -- Config scènes Pannellum
    hotspots          JSONB,              -- Points d'intérêt globaux
    auto_rotate       BOOLEAN DEFAULT FALSE,
    auto_rotate_speed NUMERIC(3,1) DEFAULT 2.0,
    is_active         BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `agent_availabilities`
```sql
CREATE TABLE public.agent_availabilities (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id            UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    day_of_week         INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Dimanche
    start_time          TIME NOT NULL,
    end_time            TIME NOT NULL,
    is_available        BOOLEAN DEFAULT TRUE,   -- ⚠️ is_available, pas is_active
    max_visits_per_slot INTEGER DEFAULT 1,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `visits`
> ⚠️ Status en anglais : `'pending'`, `'confirmed'`, `'canceled'`, `'completed'`, `'no_show'`
> Pas de champ `lead_id` dans cette table.

```sql
CREATE TABLE public.visits (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id      UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    client_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    agent_id         UUID REFERENCES public.users(id) ON DELETE SET NULL,
    scheduled_at     TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,           -- ⚠️ duration_minutes, pas duration_min
    visitor_count    INTEGER DEFAULT 1,
    visit_type       TEXT DEFAULT 'physical'
                     CHECK (visit_type IN ('physical', 'virtual')),  -- anglais
    status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'confirmed', 'canceled', 'completed', 'no_show')),
    client_notes     TEXT,
    agent_notes      TEXT,
    reminder_sent    BOOLEAN DEFAULT FALSE,
    feedback_rating  INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
    feedback_comment TEXT,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `leads`
> ⚠️ Status en anglais : `'new'`, `'contacted'`, `'qualified'`, `'disqualified'`, `'converted'`
> Champs supplémentaires : `budget_min/max`, `preferred_areas`, `property_types`, `utm_*`, `priority`, `next_follow_up`

```sql
CREATE TABLE public.leads (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email             TEXT UNIQUE NOT NULL,
    full_name         TEXT,
    phone_number      TEXT,
    budget_min        NUMERIC(15, 2),
    budget_max        NUMERIC(15, 2),
    preferred_areas   TEXT[],
    property_types    TEXT[],
    interest          TEXT,
    source            TEXT,
    utm_source        TEXT,
    utm_medium        TEXT,
    utm_campaign      TEXT,
    status            TEXT NOT NULL DEFAULT 'new'
                      CHECK (status IN ('new', 'contacted', 'qualified', 'disqualified', 'converted')),
    priority          TEXT DEFAULT 'medium'
                      CHECK (priority IN ('low', 'medium', 'high')),
    assigned_agent_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    last_contact_at   TIMESTAMP WITH TIME ZONE,
    next_follow_up    TIMESTAMP WITH TIME ZONE,
    conversion_date   TIMESTAMP WITH TIME ZONE,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `communications`
> ⚠️ Architecture différente : pas de `agent_id` dédié — utiliser `sender_id` / `receiver_id`
> Types : `'email'`, `'sms'`, `'call'`, `'whatsapp'`, `'internal_message'` (pas `'appel'` ni `'note'`)

```sql
CREATE TABLE public.communications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id           UUID REFERENCES public.users(id) ON DELETE SET NULL,
    receiver_id         UUID REFERENCES public.users(id) ON DELETE SET NULL,
    lead_id             UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    property_id         UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    type                TEXT NOT NULL
                        CHECK (type IN ('email', 'sms', 'call', 'whatsapp', 'internal_message')),
    subject             TEXT,
    body                TEXT NOT NULL,
    attachments         TEXT[],
    whatsapp_message_id TEXT,
    delivery_status     TEXT DEFAULT 'pending'
                        CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    read_at             TIMESTAMP WITH TIME ZONE,
    sent_at             TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `documents`
> ⚠️ Champs réels Adobe Sign : `adobe_agreement_id`, `signature_status`, `signature_url`, `signed_document_url`
> Types : `'lease'`, `'sale_agreement'`, `'mandate'`, `'estimate'`, `'invoice'`, `'other'`
> `signature_status` : `'draft'`, `'sent'`, `'signed'`, `'cancelled'`, `'expired'`

```sql
CREATE TABLE public.documents (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_type        TEXT NOT NULL
                         CHECK (document_type IN ('lease', 'sale_agreement', 'mandate', 'estimate', 'invoice', 'other')),
    template_id          UUID,
    title                TEXT NOT NULL,
    file_path            TEXT NOT NULL,
    file_name            TEXT,
    file_size            INTEGER,
    mime_type            TEXT,
    property_id          UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    client_id            UUID REFERENCES public.users(id) ON DELETE CASCADE,
    agent_id             UUID REFERENCES public.users(id) ON DELETE SET NULL,
    -- Adobe Sign
    adobe_agreement_id   TEXT,
    signature_status     TEXT DEFAULT 'draft'
                         CHECK (signature_status IN ('draft', 'sent', 'signed', 'cancelled', 'expired')),
    signature_url        TEXT,
    signed_document_url  TEXT,
    -- Signatures traditionnelles
    is_signed            BOOLEAN DEFAULT FALSE,
    signed_by_client_at  TIMESTAMP WITH TIME ZONE,
    signed_by_agent_at   TIMESTAMP WITH TIME ZONE,
    -- Metadata
    variables            JSONB,
    version              INTEGER DEFAULT 1,
    parent_document_id   UUID REFERENCES public.documents(id),
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `property_estimations`
```sql
CREATE TABLE public.property_estimations (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id             UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    client_id               UUID REFERENCES public.users(id) ON DELETE CASCADE,
    agent_id                UUID REFERENCES public.users(id) ON DELETE SET NULL,
    estimation_type         TEXT DEFAULT 'automatic'
                            CHECK (estimation_type IN ('automatic', 'manual', 'expert')),
    estimated_value         NUMERIC(15, 2) NOT NULL,
    confidence_score        NUMERIC(3, 2),
    currency                TEXT NOT NULL DEFAULT 'XOF',
    market_trends           JSONB,
    comparable_properties   JSONB,
    parameters_used         JSONB,
    notes                   TEXT,
    is_shared_with_client   BOOLEAN DEFAULT FALSE,
    valid_until             TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `payments`
> ⚠️ Champs CinetPay réels : `cinetpay_transaction_id` (UNIQUE), `cinetpay_payment_token`, `customer_phone`
> Méthodes : `'WAVE'`, `'ORANGE_MONEY'`, `'MTN_MONEY'`, `'MOOV_MONEY'`, `'CARD'`

```sql
CREATE TABLE public.payments (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id               UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    property_id             UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    document_id             UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    amount                  NUMERIC(15, 2) NOT NULL,
    currency                TEXT NOT NULL DEFAULT 'XOF',
    fees                    NUMERIC(15, 2) DEFAULT 0,
    net_amount              NUMERIC(15, 2),
    payment_method          TEXT NOT NULL,  -- 'WAVE', 'ORANGE_MONEY', 'MTN_MONEY', 'MOOV_MONEY', 'CARD'
    cinetpay_transaction_id TEXT UNIQUE,
    cinetpay_payment_token  TEXT,
    status                  TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
    payment_date            TIMESTAMP WITH TIME ZONE,
    refund_date             TIMESTAMP WITH TIME ZONE,
    description             TEXT,
    customer_phone          TEXT,
    return_url              TEXT,
    cancel_url              TEXT,
    webhook_data            JSONB,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `agent_wallets`
> Table spécifique au modèle économique : les agents rechargent un wallet pour activer leurs annonces.

```sql
CREATE TABLE public.agent_wallets (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id   UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    balance    NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    currency   TEXT NOT NULL DEFAULT 'XOF',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `funds_deposit`
> Historique des dépôts dans les wallets agents (via CinetPay).

```sql
CREATE TABLE public.funds_deposit (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id                UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    wallet_id               UUID NOT NULL REFERENCES public.agent_wallets(id) ON DELETE CASCADE,
    amount                  NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    currency                TEXT NOT NULL DEFAULT 'XOF',
    payment_method          TEXT NOT NULL,
    cinetpay_transaction_id TEXT UNIQUE,
    cinetpay_payment_token  TEXT,
    status                  TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
    payment_date            TIMESTAMP WITH TIME ZONE,
    webhook_data            JSONB,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `ads_activating`
> Activation d'une annonce payante, déduit du wallet agent.
> ⚠️ `expires_at` est calculé automatiquement par trigger : `activated_at + 30 jours`.

```sql
CREATE TABLE public.ads_activating (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id      UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    agent_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount_deducted  NUMERIC(15, 2) NOT NULL,
    currency         TEXT NOT NULL DEFAULT 'XOF',
    activated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at       TIMESTAMP WITH TIME ZONE  -- Calculé par trigger (activated_at + 30 jours)
);
```

### `testimonials`
> Témoignages clients. Visibles publiquement uniquement si `is_approved = TRUE`.
> ⚠️ `id` est un `BIGINT` (pas UUID).

```sql
CREATE TABLE public.testimonials (
    id          BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    name        TEXT NOT NULL,
    title       TEXT,
    description TEXT NOT NULL,
    avatar_text TEXT,              -- Initiales ou emoji, pas d'image
    is_approved BOOLEAN DEFAULT FALSE NOT NULL
);
```

### `user_favorites`
```sql
CREATE TABLE public.user_favorites (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);
```

### `saved_searches`
> ⚠️ Critères stockés dans `search_criteria` (pas `filters`). Fréquence d'alerte : `'immediate'`, `'daily'`, `'weekly'`.

```sql
CREATE TABLE public.saved_searches (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    search_criteria  JSONB NOT NULL,    -- ⚠️ search_criteria, pas filters
    email_alerts     BOOLEAN DEFAULT FALSE,
    alert_frequency  TEXT DEFAULT 'daily'
                     CHECK (alert_frequency IN ('immediate', 'daily', 'weekly')),
    is_active        BOOLEAN DEFAULT TRUE,
    last_run         TIMESTAMP WITH TIME ZONE,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `notifications`
> ⚠️ Le corps de la notification est dans `message` (pas `body`). Pas de champ `link`.
> Champ `data JSONB` pour les métadonnées additionnelles.

```sql
CREATE TABLE public.notifications (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type       TEXT NOT NULL,
    title      TEXT NOT NULL,
    message    TEXT NOT NULL,    -- ⚠️ message, pas body
    data       JSONB,            -- Données supplémentaires (ex: lien, id ressource)
    is_read    BOOLEAN DEFAULT FALSE,
    read_at    TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `audit_logs`
> ⚠️ Structure orientée diff : `table_name`, `record_id`, `action` (`'INSERT'`/`'UPDATE'`/`'DELETE'`), `old_values`, `new_values`.

```sql
CREATE TABLE public.audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name  TEXT NOT NULL,
    record_id   UUID NOT NULL,
    action      TEXT NOT NULL,   -- 'INSERT', 'UPDATE', 'DELETE'
    old_values  JSONB,
    new_values  JSONB,
    user_id     UUID REFERENCES public.users(id),
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Requêtes types par page publique

```typescript
// /acheter — Vente pure
supabase.from('properties')
  .select('*, property_types(name, icon_name)')
  .eq('status', 'available')
  .eq('is_for_sale', true)
  .eq('is_for_rent', false)

// /louer — Location pure
supabase.from('properties')
  .select('*, property_types(name, icon_name)')
  .eq('status', 'available')
  .eq('is_for_rent', true)
  .eq('is_for_sale', false)

// /location-vente — Les deux simultanément
supabase.from('properties')
  .select('*, property_types(name, icon_name)')
  .eq('status', 'available')
  .eq('is_for_sale', true)
  .eq('is_for_rent', true)

// Page d'accueil — Biens mis en avant (toutes catégories)
supabase.from('properties')
  .select('*, property_types(name, icon_name)')
  .eq('status', 'available')
  .eq('is_featured', true)
  .or('is_for_sale.eq.true,is_for_rent.eq.true')

// Filtre en cascade — Secteurs disponibles pour une ville et un type
supabase.from('properties')
  .select('zip_code')
  .eq('city', selectedCity)
  .eq('property_type_id', selectedTypeId)
  .eq('status', 'available')
  .not('zip_code', 'is', null)
  // Dédupliquer côté JS avec [...new Set(data.map(p => p.zip_code))]
```

---

## Fonctions utilitaires (déjà en base)

```sql
-- Récupérer le rôle de l'utilisateur courant (utilisé dans les politiques RLS)
get_my_role() RETURNS TEXT

-- Incrémenter le compteur de vues d'un bien
increment_property_views(property_uuid UUID) RETURNS VOID

-- Mise à jour automatique de updated_at (trigger sur toutes les tables concernées)
update_updated_at_column() RETURNS TRIGGER
```

---

## Politiques RLS actives

| Table | Politique clé |
|-------|--------------|
| `testimonials` | Lecture publique si `is_approved = TRUE` |
| `users` | Lecture/écriture sur son propre profil ; admins : accès total |
| `property_types` | Lecture publique ; écriture admin seulement |
| `properties` | Lecture publique si `status = 'available'` ; agents gèrent les leurs ; admins voient tout |
| `visits` | Accès aux parties impliquées (`client_id`, `agent_id`) + admins |
| `leads` | Agents sur leurs leads assignés + admins |
| `communications` | `sender_id` ou `receiver_id` + admins |
| `documents` | `client_id`, `agent_id` + admins |
| `payments` | `client_id` + admins |
| `user_favorites` | `user_id` uniquement |
| `notifications` | `user_id` uniquement |

---

## Index existants en production

```sql
-- Users
idx_users_email, idx_users_role, idx_users_is_active

-- NextAuth
idx_accounts_user_id, idx_sessions_user_id, idx_sessions_session_token

-- Properties
idx_properties_city, idx_properties_status, idx_properties_price
idx_properties_is_for_sale, idx_properties_is_for_rent
idx_properties_agent_id, idx_properties_property_type_id, idx_properties_is_featured
idx_properties_lat (WHERE latitude IS NOT NULL)
idx_properties_lng (WHERE longitude IS NOT NULL)

-- Autres
idx_visits_property_id, idx_visits_client_id, idx_visits_scheduled_at
idx_leads_status, idx_leads_assigned_agent_id
idx_communications_sender_id, idx_communications_receiver_id
idx_payments_client_id, idx_payments_status
idx_notifications_user_id_unread (user_id, is_read)
```
