# Intégrations externes — OPTIMA GESTION

## Contexte
> Le site est **déjà en production** sur https://optima-gestion.vercel.app/
> Les pages publiques `/`, `/acheter`, `/louer`, `/location-vente`, `/a-propos` sont fonctionnelles.
> Les espaces client, agent et admin sont à construire.

## Statut des intégrations

| Service | Statut | Flag d'activation |
|---------|--------|-------------------|
| Supabase (DB + Auth + Storage) | ✅ Actif | Toujours actif |
| Pannellum (visites virtuelles) | ✅ Actif | Pas de clé requise |
| WhatsApp (liens directs) | ✅ Actif | Pas d'API requise |
| CinetPay (paiements) | ⏳ En attente clé | `CINETPAY_ENABLED=false` |
| Adobe Sign (signatures) | ⏳ En attente clé | `ADOBE_SIGN_ENABLED=false` |

---

## 1. Supabase

### Variables d'environnement requises
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Jamais exposé côté client
```

### Client navigateur (`lib/supabase/client.ts`)
```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

### Client serveur (`lib/supabase/server.ts`)
```typescript
import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export const createServerClient = async () => {
  const cookieStore = await cookies()
  return createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### Supabase Storage (images des biens)
- Bucket : `property-images` (public)
- Bucket : `property-documents` (privé, accès authentifié)
- Bucket : `virtual-tours` (public)
- Upload via composant `PropertyImageUpload.tsx`
- Taille max : 10 MB par image, formats : jpg, png, webp
- Générer des URLs de resize avec les paramètres Supabase Image Transformation

> ⚠️ Les images sont stockées dans `properties.image_paths` (TEXT[]), pas dans un champ JSONB.
> Chaque élément du tableau est le **chemin Supabase Storage** (pas l'URL complète).
> Construire l'URL publique via :
> ```typescript
> const { data } = supabase.storage.from('property-images').getPublicUrl(path)
> // data.publicUrl → URL complète affichable
> ```
> Même logique pour `video_paths[]` et `document_paths[]`.

---

## 2. Pannellum (Visites Virtuelles)

**Pas de clé API requise — implémentable immédiatement.**

### Installation
```bash
npm install pannellum
# ou via CDN dans next.config.ts
```

### Composant (`components/virtual-tour/PannellumViewer.tsx`)
```typescript
'use client'
import { useEffect, useRef } from 'react'

interface PannellumViewerProps {
  imageUrl: string       // URL de l'image équirectangulaire (360°)
  hotspots?: Hotspot[]   // Points d'intérêt cliquables
  autoLoad?: boolean
}

interface Hotspot {
  pitch: number
  yaw: number
  type: 'info' | 'scene'
  text?: string
  sceneId?: string
}

export function PannellumViewer({ imageUrl, hotspots = [], autoLoad = true }: PannellumViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return

    // Chargement dynamique de Pannellum
    import('pannellum').then((pannellum) => {
      viewerRef.current = pannellum.viewer(containerRef.current!, {
        type: 'equirectangular',
        panorama: imageUrl,
        autoLoad,
        hotSpots: hotspots,
        showZoomCtrl: true,
        showFullscreenCtrl: true,
      })
    })

    return () => {
      viewerRef.current?.destroy()
    }
  }, [imageUrl])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '500px' }}
      className="rounded-lg overflow-hidden"
    />
  )
}
```

### Structure de données (`virtual_tours`)
> Champs réels : `title` (obligatoire), `default_scene`, `scenes` (JSONB), `hotspots` (JSONB), `auto_rotate`, `auto_rotate_speed`

```typescript
// Type TypeScript correspondant au schéma réel
interface VirtualTour {
  id: string
  property_id: string
  title: string
  default_scene: string | null   // ID de la scène affichée par défaut
  scenes: PannellumScene[]       // JSONB
  hotspots: PannellumHotspot[] | null  // JSONB global
  auto_rotate: boolean
  auto_rotate_speed: number
  is_active: boolean
}

interface PannellumScene {
  id: string          // ex: "scene_salon"
  title: string       // ex: "Salon"
  image_url: string   // URL image équirectangulaire dans Supabase Storage
  hotspots?: Array<{
    pitch: number
    yaw: number
    type: 'info' | 'scene'
    text?: string
    sceneId?: string  // Pour navigation entre scènes
  }>
}
```

---

## 3. WhatsApp (Communication)

**Pas d'API — liens directs uniquement.**

### Composant (`components/communication/WhatsAppButton.tsx`)
```typescript
interface WhatsAppButtonProps {
  phone: string      // Format international : +2250701234567
  message?: string   // Message pré-rempli
  propertyTitle?: string
}

export function WhatsAppButton({ phone, message, propertyTitle }: WhatsAppButtonProps) {
  const defaultMessage = propertyTitle
    ? `Bonjour, je suis intéressé(e) par le bien : ${propertyTitle}`
    : 'Bonjour, j\'ai une question concernant un de vos biens.'

  const encodedMessage = encodeURIComponent(message ?? defaultMessage)
  const whatsappUrl = `https://wa.me/${phone.replace('+', '')}?text=${encodedMessage}`

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
    >
      {/* Icône WhatsApp SVG */}
      Contacter via WhatsApp
    </a>
  )
}
```

---

## 4. CinetPay (Paiements)

**En attente de clé API. Interface prête, activation par flag.**

### Variables d'environnement
```env
CINETPAY_ENABLED=false
CINETPAY_API_KEY=          # À renseigner quand disponible
CINETPAY_SITE_ID=          # À renseigner quand disponible
CINETPAY_SECRET_KEY=       # À renseigner quand disponible (webhook)
CINETPAY_MODE=TEST          # TEST ou PROD
```

### Config (`lib/cinetpay/config.ts`)
```typescript
export const cinetpayConfig = {
  enabled: process.env.CINETPAY_ENABLED === 'true',
  apiKey: process.env.CINETPAY_API_KEY!,
  siteId: process.env.CINETPAY_SITE_ID!,
  secretKey: process.env.CINETPAY_SECRET_KEY!,
  mode: (process.env.CINETPAY_MODE ?? 'TEST') as 'TEST' | 'PROD',
  baseUrl: process.env.CINETPAY_MODE === 'PROD'
    ? 'https://api-checkout.cinetpay.com/v2'
    : 'https://api-checkout.cinetpay.com/v2',
  returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/paiement/retour`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/paiement/annule`,
  notifyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
}
```

### Méthodes de paiement supportées
> ⚠️ Noms exacts stockés dans la base (`payment_method`) :
- `WAVE` — Wave Côte d'Ivoire
- `ORANGE_MONEY` — Orange Money CI
- `MTN_MONEY` — MTN Mobile Money CI
- `MOOV_MONEY` — Moov Money CI
- `CARD` — Carte bancaire

### Endpoint initiation paiement client (`/api/payments/initiate/route.ts`)
Quand `CINETPAY_ENABLED=false`, retourner :
```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_UNAVAILABLE",
    "message": "Le paiement en ligne n'est pas encore disponible."
  }
}
```

### Endpoint recharge wallet agent (`/api/wallet/deposit/initiate/route.ts`)
Logique spécifique au modèle économique : les agents rechargent leur portefeuille.
```typescript
// Tables impliquées :
// 1. Créer un enregistrement dans funds_deposit (status: 'pending')
// 2. Initier la transaction CinetPay
// 3. Le webhook /api/wallet/deposit/webhook :
//    - Met à jour funds_deposit.status → 'completed'
//    - Incrémente agent_wallets.balance du montant
// Tables : funds_deposit, agent_wallets

// Champs CinetPay réels dans funds_deposit :
// cinetpay_transaction_id (UNIQUE), cinetpay_payment_token, payment_method, webhook_data
```

### Endpoint activation annonce (`/api/ads/activate/route.ts`)
```typescript
// Avant d'activer, vérifier le solde :
const wallet = await supabase
  .from('agent_wallets')
  .select('balance')
  .eq('agent_id', user.id)
  .single()

if (wallet.data.balance < ACTIVATION_COST) {
  return { error: 'INSUFFICIENT_BALANCE' }
}

// Insérer dans ads_activating (le trigger calcule expires_at automatiquement)
// Déduire de agent_wallets.balance
// Tables : ads_activating, agent_wallets
```

---

## 5. Adobe Sign (Signatures Électroniques)

**En attente de clé API. Interface prête, activation par flag.**

### Variables d'environnement
```env
ADOBE_SIGN_ENABLED=false
ADOBE_SIGN_API_KEY=        # À renseigner quand disponible
ADOBE_SIGN_BASE_URL=https://api.eu2.adobesign.com/api/rest/v6
```

### Config (`lib/adobe-sign/config.ts`)
```typescript
export const adobeSignConfig = {
  enabled: process.env.ADOBE_SIGN_ENABLED === 'true',
  apiKey: process.env.ADOBE_SIGN_API_KEY!,
  baseUrl: process.env.ADOBE_SIGN_BASE_URL!,
}
```

### Mode simulation (quand désactivé)
Quand `ADOBE_SIGN_ENABLED=false` :
- Afficher un bouton "Signer le document" désactivé avec tooltip :
  *"La signature électronique sera disponible prochainement"*
- Les documents restent dans le statut `pending_signature` en base

### Flux cible (quand activé)
1. Admin/Agent crée un document depuis un template
2. API Adobe Sign : upload du document + création de l'accord
3. Email envoyé au signataire avec lien Adobe Sign
4. Webhook Adobe Sign notifie `/api/documents/webhook`
5. Document passe au statut `signed`, URL du signé sauvegardée

---

## Variables d'environnement — fichier `.env.example`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Production : NEXT_PUBLIC_APP_URL=https://optima-gestion.vercel.app

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
# Production : NEXTAUTH_URL=https://optima-gestion.vercel.app
NEXTAUTH_SECRET=          # Générer avec : openssl rand -base64 32

# CinetPay
CINETPAY_ENABLED=false
CINETPAY_API_KEY=
CINETPAY_SITE_ID=
CINETPAY_SECRET_KEY=
CINETPAY_MODE=TEST

# Adobe Sign
ADOBE_SIGN_ENABLED=false
ADOBE_SIGN_API_KEY=
ADOBE_SIGN_BASE_URL=https://api.eu2.adobesign.com/api/rest/v6
```

> ⚠️ Sur Vercel, ces variables sont à configurer dans :
> Settings → Environment Variables → Production / Preview / Development
