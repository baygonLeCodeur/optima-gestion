# Prompts de pilotage — OPTIMA GESTION

> Guide d'utilisation de Claude Code pour ce projet.
> Copier-coller les prompts directement dans le terminal Claude Code.

---

## Contexte du projet
- **Site en production** : https://optima-gestion.vercel.app/
- **Pages publiques déjà en ligne** : `/`, `/acheter`, `/louer`, `/location-vente`, `/a-propos`
- **À construire** : `/bien/[id]`, `/vendre`, espaces client/agent/admin
- **Stack** : Next.js 14 (TypeScript strict), Tailwind CSS, Supabase (PostgreSQL), NextAuth.js

---

## Prompt de démarrage — PREMIÈRE session

```
Lis CLAUDE.md en intégralité, puis @docs/architecture.md, @docs/database-schema.md et @docs/todo.md avant de faire quoi que ce soit.

Tu prends en charge le développement de la plateforme OPTIMA GESTION, déjà partiellement en production sur https://optima-gestion.vercel.app/.

ÉTAPE 1 — ANALYSE SILENCIEUSE (ne touche pas encore au code)
1. Examine l'état actuel du dépôt : liste tous les fichiers et leur rôle
2. Identifie ce qui est fonctionnel en production vs. ce qui manque
3. Relève les problèmes : sécurité, architecture, conventions, dette technique
4. Compare l'état réel avec l'architecture cible dans @docs/architecture.md

ÉTAPE 2 — RAPPORT D'AUDIT
Produis un rapport structuré :
- Pages/fonctionnalités en production et fonctionnelles
- Ce qui existe mais doit être corrigé (criticité : critique / importante / mineure)
- Ce qui manque complètement selon @docs/todo.md
- Plan d'action recommandé, phase par phase

ÉTAPE 3 — ATTENDS MA VALIDATION
Ne commence aucune modification avant que j'aie validé ton plan.

Contraintes impératives :
- Ne jamais casser les pages publiques déjà en ligne (/acheter, /louer, /location-vente, /a-propos)
- TypeScript strict sur tout le projet
- .env.local dans .gitignore — vérifier avant chaque commit
- Travailler module par module, cocher les cases dans @docs/todo.md
```

---

## Prompts par type de tâche

### Démarrer une nouvelle phase
```
Lis @docs/todo.md. On attaque la Phase [N] : [Nom].
Commence par [première tâche spécifique].
Quand tu termines une tâche, coche sa case dans @docs/todo.md et attends ma validation avant la suivante.
Ne touche pas aux pages déjà fonctionnelles en production sauf si la tâche le demande explicitement.
```

### Travailler sur une page publique existante
```
La page [/acheter | /louer | /location-vente] est déjà en production.
Avant de modifier quoi que ce soit, explique-moi ce que tu vas changer et pourquoi.
⚠️ Rappel : la logique de transaction utilise is_for_sale et is_for_rent (booléens), jamais un champ transaction_type.
```

### Créer un composant
```
Crée le composant [NomComposant] dans components/[dossier]/.
Contraintes :
- TypeScript strict, props typées explicitement
- Tailwind uniquement (référence @docs/ui-design-system.md)
- Mobile-first responsive
- Réutilisable (pas de logique métier hard-codée)
```

### Créer une API Route
```
Crée l'API Route [/api/chemin].
Respecte exactement @docs/api-standards.md :
- Format de réponse uniforme {success, data, meta} ou {success, error}
- Validation Zod du body côté serveur
- Vérification auth (rôle depuis public.users, pas user_metadata)
- Gestion des erreurs avec codes standardisés
```

### Requête Supabase — biens immobiliers
```
Écris la requête Supabase pour [besoin].
Rappels depuis @docs/database-schema.md :
- Vente pure     : is_for_sale=true AND is_for_rent=false
- Location pure  : is_for_rent=true AND is_for_sale=false
- Location-vente : is_for_sale=true AND is_for_rent=true
- Superficie     : area_sqm (pas area)
- Chambres       : number_of_rooms (pas bedrooms)
- Status         : 'available' (pas 'disponible')
- Images         : image_paths TEXT[] → URLs via supabase.storage.getPublicUrl()
```

### Session de sécurité / audit
```
Fais un audit de sécurité du code actuel.
Utilise @docs/security.md comme checklist.
Classe les problèmes par criticité (critique / importante / mineure).
Ne corrige rien avant que j'aie validé la liste complète.
```

### Activer CinetPay (quand clé disponible)
```
La clé CinetPay est maintenant disponible.
Mets CINETPAY_ENABLED=true dans .env.local et sur Vercel.
Référence @docs/integrations.md section CinetPay pour l'implémentation.
Implémenter dans cet ordre :
1. /api/wallet/deposit/initiate (recharge wallet agent)
2. /api/wallet/deposit/webhook
3. /api/payments/initiate (paiement client)
4. /api/payments/webhook
```

### Activer Adobe Sign (quand clé disponible)
```
La clé Adobe Sign est maintenant disponible.
Mets ADOBE_SIGN_ENABLED=true dans .env.local et sur Vercel.
Référence @docs/integrations.md section Adobe Sign.
Retirer le mode simulation des composants SignatureWidget.
```

### Avant un déploiement Vercel
```
Avant de merger/déployer, vérifie la checklist de @docs/security.md section "Avant chaque déploiement".
En particulier :
1. git status → .env.local ne doit pas apparaître
2. Les pages /acheter, /louer, /location-vente fonctionnent toujours
3. NEXTAUTH_URL et NEXT_PUBLIC_APP_URL sont bien à https://optima-gestion.vercel.app sur Vercel
```

---

## Commandes Claude Code utiles

| Commande | Usage |
|----------|-------|
| `/clear` | Vider le contexte entre deux tâches distinctes |
| `@docs/todo.md` | Référencer le plan de tâches |
| `@docs/database-schema.md` | Rappeler les noms de colonnes exacts |
| `ultrathink` | Déclencher la réflexion approfondie sur un problème complexe |

---

## Contacts et URLs de référence
- **Site production** : https://optima-gestion.vercel.app/
- **Email** : contact@optimagestion.net
- **Téléphone** : +225 07 07 81 16 09
- **Adresse** : Angré, Boulevard Latrille, Abidjan, Côte d'Ivoire
