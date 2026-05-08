# Standards API — OPTIMA GESTION

## Conventions générales

Toutes les API Routes Next.js (`/src/app/api/**`) respectent ces standards sans exception.

## Format de réponse uniforme

### Succès
```json
{
  "success": true,
  "data": { },
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20
  }
}
```

### Erreur
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Message lisible par l'humain",
    "details": {
      "field_name": ["Message d'erreur sur ce champ"]
    }
  }
}
```

## Codes d'erreur standardisés

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Données invalides (Zod) |
| `UNAUTHORIZED` | 401 | Non authentifié |
| `FORBIDDEN` | 403 | Authentifié mais non autorisé |
| `NOT_FOUND` | 404 | Ressource introuvable |
| `CONFLICT` | 409 | Conflit (ex: email déjà utilisé) |
| `INTERNAL_ERROR` | 500 | Erreur serveur |
| `PAYMENT_FAILED` | 402 | Échec paiement CinetPay |
| `SIGNATURE_FAILED` | 422 | Échec signature Adobe Sign |

## Structure d'une API Route

```typescript
// src/app/api/properties/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

// Schéma de validation
const CreatePropertySchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(50).max(5000).trim().optional(),
  address: z.string().min(5).max(300).trim(),
  city: z.string().min(2).max(100).trim(),
  price: z.number().positive().max(10_000_000_000),
  area_sqm: z.number().positive().optional(),         // ⚠️ area_sqm, pas area
  number_of_rooms: z.number().int().min(0).max(50).optional(),
  number_of_bathrooms: z.number().int().min(0).max(20).optional(),
  is_for_sale: z.boolean(),
  is_for_rent: z.boolean(),
  property_type_id: z.string().uuid(),
  // ...
})

// GET — Liste des biens (avec pagination)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') ?? 1)
    const perPage = Math.min(Number(searchParams.get('per_page') ?? 20), 100)

    const supabase = await createServerClient()
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    const { data, error, count } = await supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .range(from, to)

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      meta: { total: count ?? 0, page, per_page: perPage }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Erreur serveur' } },
      { status: 500 }
    )
  }
}

// POST — Créer un bien
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // 1. Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Non authentifié' } },
        { status: 401 }
      )
    }

    // 2. Vérifier le rôle
    if (user.user_metadata?.role !== 'agent' && user.user_metadata?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Accès refusé' } },
        { status: 403 }
      )
    }

    // 3. Valider le body
    const body = await request.json()
    const validation = CreatePropertySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Données invalides',
            details: validation.error.flatten().fieldErrors
          }
        },
        { status: 400 }
      )
    }

    // 4. Insérer en base
    const { data, error } = await supabase
      .from('properties')
      .insert({ ...validation.data, agent_id: user.id })
      // ⚠️ Le statut par défaut en base est 'available' (anglais)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 201 })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Erreur serveur' } },
      { status: 500 }
    )
  }
}
```

## Endpoints prévus

### Biens (`/api/properties`)
| Méthode | Route | Auth | Rôle | Description |
|---------|-------|------|------|-------------|
| GET | `/api/properties` | Non | Public | Tous les biens disponibles |
| GET | `/api/properties/[id]` | Non | Public | Détail d'un bien |
| POST | `/api/properties` | Oui | agent/admin | Créer un bien |
| PUT | `/api/properties/[id]` | Oui | agent/admin | Modifier un bien |
| DELETE | `/api/properties/[id]` | Oui | admin | Supprimer un bien |
| GET | `/api/properties/featured` | Non | Public | Biens mis en avant (page d'accueil) |
| GET | `/api/properties/acheter` | Non | Public | Vente pure (is_for_sale=true, is_for_rent=false) |
| GET | `/api/properties/louer` | Non | Public | Location pure (is_for_rent=true, is_for_sale=false) |
| GET | `/api/properties/location-vente` | Non | Public | Location-vente (is_for_sale=true AND is_for_rent=true) |
| GET | `/api/properties/search` | Non | Public | Recherche avec filtres en cascade |
| GET | `/api/properties/secteurs` | Non | Public | Secteurs (zip_code) disponibles pour ville+type |

### Utilisateurs (`/api/users`)
| Méthode | Route | Auth | Rôle | Description |
|---------|-------|------|------|-------------|
| GET | `/api/users/me` | Oui | Tous | Profil courant |
| PUT | `/api/users/me` | Oui | Tous | Modifier son profil |
| GET | `/api/users` | Oui | admin | Liste des utilisateurs |
| POST | `/api/users` | Oui | admin | Créer un utilisateur |
| PUT | `/api/users/[id]` | Oui | admin | Modifier un utilisateur |

### Leads (`/api/leads`)
| Méthode | Route | Auth | Rôle | Description |
|---------|-------|------|------|-------------|
| POST | `/api/leads` | Non | Public | Soumettre un lead (formulaire contact) |
| GET | `/api/leads` | Oui | agent/admin | Liste des leads |
| GET | `/api/leads/[id]` | Oui | agent/admin | Détail d'un lead |
| PUT | `/api/leads/[id]` | Oui | agent/admin | Mettre à jour un lead |

### Visites (`/api/visits`)
| Méthode | Route | Auth | Rôle | Description |
|---------|-------|------|------|-------------|
| POST | `/api/visits/request` | Oui | client | Demander une visite |
| GET | `/api/visits` | Oui | agent/admin | Liste des visites |
| PUT | `/api/visits/[id]` | Oui | agent | Accepter/reporter/annuler |

### Paiements (`/api/payments`)
| Méthode | Route | Auth | Rôle | Description |
|---------|-------|------|------|-------------|
| POST | `/api/payments/initiate` | Oui | client | Initier un paiement CinetPay |
| POST | `/api/payments/webhook` | Non | Système | Webhook CinetPay |

### Wallet agent (`/api/wallet`)
| Méthode | Route | Auth | Rôle | Description |
|---------|-------|------|------|-------------|
| GET | `/api/wallet` | Oui | agent | Solde du wallet courant |
| POST | `/api/wallet/deposit/initiate` | Oui | agent | Initier un dépôt CinetPay |
| POST | `/api/wallet/deposit/webhook` | Non | Système | Webhook confirmation dépôt |
| GET | `/api/wallet/deposits` | Oui | agent | Historique des dépôts |

### Activation d'annonces (`/api/ads`)
| Méthode | Route | Auth | Rôle | Description |
|---------|-------|------|------|-------------|
| POST | `/api/ads/activate` | Oui | agent | Activer une annonce (déduit du wallet) |
| GET | `/api/ads/active` | Oui | agent | Annonces actives et leurs expirations |

### Estimations (`/api/estimations`)
| Méthode | Route | Auth | Rôle | Description |
|---------|-------|------|------|-------------|
| POST | `/api/estimations` | Oui | agent | Créer une estimation |
| GET | `/api/estimations/[id]` | Oui | agent/client | Voir une estimation |

### Favoris (`/api/favorites`)
| Méthode | Route | Auth | Rôle | Description |
|---------|-------|------|------|-------------|
| GET | `/api/favorites` | Oui | client | Mes favoris |
| POST | `/api/favorites` | Oui | client | Ajouter un favori |
| DELETE | `/api/favorites/[id]` | Oui | client | Supprimer un favori |

## Pagination
- Toujours utiliser `page` et `per_page` comme query params
- `per_page` max : 100
- `per_page` défaut : 20
- Toujours retourner `meta.total` pour le calcul des pages côté client

## Filtres de recherche biens
Query params pour `/api/properties/search` :
```
# Filtre de transaction (exclusifs ou combinés)
?is_for_sale=true            → /acheter
?is_for_rent=true            → /louer
?is_for_sale=true&is_for_rent=true  → /location-vente

# Filtres en cascade (ordre UI : type → ville → secteur → prix)
&property_type_id=uuid
&city=Cocody
&zip_code=Angré              (secteur — ⚠️ zip_code dans la table)
&price_min=100000
&price_max=500000

# Filtres additionnels
&area_sqm_min=50             (⚠️ area_sqm)
&area_sqm_max=200
&number_of_rooms=3           (⚠️ number_of_rooms)
&featured=true
&status=available            (⚠️ anglais)
&page=1
&per_page=20
&sort=price_asc|price_desc|created_at_desc
```
