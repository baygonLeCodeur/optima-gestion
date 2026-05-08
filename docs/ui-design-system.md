# Design System — OPTIMA GESTION

## Identité visuelle

**Marque** : OPTIMA GESTION  
**Secteur** : Immobilier haut de gamme, Côte d'Ivoire  
**Tonalité** : Professionnel, moderne, sobre, premium  
**Couleurs** : Blanc, Noir, Vert

---

## Palette de couleurs

### Configuration Tailwind (`tailwind.config.ts`)
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Vert OPTIMA — couleur principale
        primary: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',   // Vert principal
          600: '#16a34a',   // Vert foncé (hover)
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Neutres — noir et blanc haut de gamme
        neutral: {
          50:  '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        // Couleurs sémantiques
        success: '#22c55e',
        warning: '#f59e0b',
        error:   '#ef4444',
        info:    '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'], // Titres premium
      },
      boxShadow: {
        'card':    '0 2px 8px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.12)',
        'premium': '0 20px 60px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
      }
    },
  },
}

export default config
```

---

## Typographie

| Usage | Police | Taille | Poids | Classe Tailwind |
|-------|--------|--------|-------|-----------------|
| Titre héro | Playfair Display | 56-72px | 700 | `font-display text-6xl font-bold` |
| Titre section | Playfair Display | 36-48px | 600 | `font-display text-4xl font-semibold` |
| Titre carte | Inter | 20-24px | 600 | `text-xl font-semibold` |
| Corps | Inter | 16px | 400 | `text-base` |
| Corps petit | Inter | 14px | 400 | `text-sm` |
| Label | Inter | 12px | 500 | `text-xs font-medium uppercase tracking-wide` |
| Prix | Inter | 24-32px | 700 | `text-2xl font-bold text-primary-600` |

---

## Composants UI — Spécifications

### Button
```typescript
// Variants
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

// Classes par variant
const variants = {
  primary:   'bg-primary-600 text-white hover:bg-primary-700 shadow-sm',
  secondary: 'bg-neutral-900 text-white hover:bg-neutral-800',
  outline:   'border border-neutral-300 text-neutral-700 hover:bg-neutral-50',
  ghost:     'text-neutral-600 hover:bg-neutral-100',
  danger:    'bg-error text-white hover:bg-red-600',
}
```

### PropertyCard
Structure visuelle :
```
┌──────────────────────────────┐
│  Image (aspect 4/3)          │
│  [Badge: Location | Vente]   │
├──────────────────────────────┤
│  Titre du bien               │
│  Localisation (icône + texte)│
│  Prix en FCFA                │
│  ─────────────────────────── │
│  🛏 3 ch  🚿 2 SDB  📐 120m² │
└──────────────────────────────┘
```

### Badge de type de transaction
> ⚠️ Pas de champ `transaction_type` — déduire le label des deux booléens.

```typescript
// Déduire le label depuis is_for_sale et is_for_rent
function getTransactionLabel(isForSale: boolean, isForRent: boolean): string {
  if (isForSale && isForRent) return 'Location-Vente'
  if (isForSale) return 'Vente'
  if (isForRent) return 'Location'
  return ''
}

// Couleurs des badges
const transactionColors = {
  'Vente':          'bg-primary-100 text-primary-700',
  'Location':       'bg-blue-100 text-blue-700',
  'Location-Vente': 'bg-purple-100 text-purple-700',
}

// Couleurs des statuts
const statusColors = {
  disponible: 'bg-green-100 text-green-700',
  loue:       'bg-orange-100 text-orange-700',
  vendu:      'bg-red-100 text-red-700',
  reserve:    'bg-yellow-100 text-yellow-700',
}
```

---

## Layouts

### Header public
> Refléter la navigation réelle du site en production.
```
┌────────────────────────────────────────────────────────────────────┐
│  [Logo OPTIMA]  Accueil  Acheter  Louer  Location-Vente  Qui sommes-nous ?  │
└────────────────────────────────────────────────────────────────────┘
```
Routes correspondantes :
- `Accueil` → `/`
- `Acheter` → `/acheter`
- `Louer` → `/louer`
- `Location-Vente` → `/location-vente`
- `Qui sommes-nous ?` → `/a-propos`

Footer : liens `Acheter`, `Louer`, `Vendre` (`/vendre`), `Contact` (`/#contact`)
Contact : `contact@optimagestion.net` — `+225 07 07 81 16 09`
Adresse : Angré, Boulevard Latrille, non loin du 22è arrondissement, Abidjan

- Sticky sur scroll avec `backdrop-blur-md bg-white/90`
- Mobile : hamburger menu

### Dashboard Sidebar (Agent + Admin)
```
┌─────────────────┐
│  [Logo OPTIMA]  │
├─────────────────┤
│  📊 Dashboard   │
│  🏠 Annonces   │
│  👥 Leads      │
│  📅 Calendrier │
│  ─────────────  │
│  ⚙️ Paramètres │
│  🚪 Déconnexion │
└─────────────────┘
```
- Largeur : 240px (bureau), collapsible sur tablette
- Couleur fond : `neutral-950` ou `neutral-900`
- Texte actif : `primary-500`

---

## Formatage des données

### Prix (FCFA)
```typescript
// lib/utils/format-price.ts
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-CI', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
  // Résultat : "125 000 F CFA"
}

// Affichage caution + avance sur les biens en location
// security_deposit et advance_rent sont stockés en nombre de mois
export function formatDeposit(months: number | null, pricePerMonth: number): string | null {
  if (!months) return null
  return `${months} mois (${formatPrice(months * pricePerMonth)})`
}
// Exemple affiché sur la PropertyCard location :
// "Caution : 2 mois (250 000 F CFA) — Avance : 3 mois (375 000 F CFA)"
```

### Surface
```typescript
export function formatArea(sqm: number): string {
  return `${sqm.toLocaleString('fr-FR')} m²`
}
```

### Dates (locale française)
```typescript
// lib/utils/format-date.ts
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(date))
  // Résultat : "15 janvier 2025"
}
```

---

## Responsive Design

| Breakpoint | Largeur | Usage |
|------------|---------|-------|
| `sm` | 640px | Mobile paysage |
| `md` | 768px | Tablette |
| `lg` | 1024px | Bureau compact |
| `xl` | 1280px | Bureau standard |
| `2xl` | 1536px | Grand écran |

### Grille de biens
- Mobile : 1 colonne
- Tablette : 2 colonnes
- Bureau : 3 colonnes
- Grand écran : 4 colonnes

```typescript
// Classe Tailwind
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
```

---

## Icônes

Utiliser **Lucide React** (inclus avec shadcn/ui) :
```typescript
import { Home, MapPin, BedDouble, Bath, Maximize2, Heart, Share2, Eye } from 'lucide-react'
```

Taille standard : `16px` (sm), `20px` (md), `24px` (lg)

---

## États de chargement

- Toujours afficher des **Skeletons** pendant le chargement, pas de spinner seul
- Composant `<PropertyCardSkeleton />` pour les grilles
- Composant `<TableRowSkeleton />` pour les tableaux de gestion
- Utiliser `animate-pulse` de Tailwind

## Messages vides (Empty States)

Quand une liste est vide, afficher :
- Une illustration (SVG simple, couleur `neutral-200`)
- Un titre explicatif
- Un appel à l'action si pertinent

Exemple : *"Aucun bien trouvé. Modifiez vos critères de recherche."*
