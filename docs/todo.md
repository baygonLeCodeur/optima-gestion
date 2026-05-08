# Plan de développement — OPTIMA GESTION
> Cocher chaque tâche une fois complétée. Claude Code peut cocher les cases automatiquement.

---

## Phase 0 — Fondations du projet
- [ ] Initialiser Next.js 14 avec TypeScript strict (`create-next-app --typescript`)
- [ ] Configurer Tailwind CSS avec le thème OPTIMA (couleurs, polices)
- [ ] Configurer le client Supabase (`lib/supabase/client.ts` et `lib/supabase/server.ts`)
- [ ] Générer les types TypeScript depuis le schéma Supabase (`types/supabase.ts`)
- [ ] Configurer le middleware d'authentification Next.js (`middleware.ts`)
- [ ] Mettre en place `.env.local` avec toutes les variables nécessaires
- [ ] Configurer les headers de sécurité dans `next.config.ts`
- [ ] Créer la structure de dossiers complète (`src/app`, `components`, `lib`, `hooks`, `types`, `stores`, `constants`)
- [ ] Mettre en place ESLint + Prettier avec config stricte

---

## Phase 1 — Design System & Composants UI de base
- [ ] Définir le thème Tailwind complet (couleurs primaires, typographie, espacements)
- [ ] Créer les composants UI atomiques :
  - [ ] `Button` (variants : primary, secondary, ghost, danger)
  - [ ] `Input`, `Select`, `Textarea`, `Checkbox`
  - [ ] `Badge`, `Tag`
  - [ ] `Card`
  - [ ] `Modal` / `Dialog`
  - [ ] `Dropdown`
  - [ ] `Pagination`
  - [ ] `Skeleton` (loading states)
  - [ ] `Toast` / notifications
- [ ] Créer les composants de layout :
  - [ ] `Header` (public)
  - [ ] `Footer`
  - [ ] `Sidebar` (agent + admin)
  - [ ] `DashboardLayout`
  - [ ] `AuthLayout`

---

## Phase 2 — Authentification & Autorisation
- [ ] Page de connexion (`/auth/login`)
- [ ] Page d'inscription (`/auth/register`)
- [ ] Page de réinitialisation de mot de passe
- [ ] Middleware de protection des routes par rôle (client, agent, admin)
- [ ] Hook `useAuth` pour accéder à l'utilisateur courant
- [ ] Gestion des sessions Supabase (refresh automatique)
- [ ] Redirection post-login selon le rôle

---

## Phase 3 — Espace Public
### 3.1 Page d'Accueil (`/`)
- [ ] Hero section avec présentation OPTIMA GESTION
- [ ] Moteur de recherche avancé (type, localisation, prix, superficie)
- [ ] Galerie des biens mis en avant (`is_featured = true`)
- [ ] Section témoignages clients
- [ ] Informations de contact + liens réseaux sociaux
- [ ] Formulaire de contact / génération de lead
- [ ] Footer complet

### 3.2 Page de Détail d'un Bien (`/bien/[id]`)
- [ ] Galerie images haute résolution
- [ ] Intégration Pannellum pour visite virtuelle
- [ ] Informations détaillées du bien
- [ ] Carte interactive (localisation)
- [ ] Formulaire de demande de visite
- [ ] Formulaire de contact agent
- [ ] Boutons de partage réseaux sociaux
- [ ] Section "Biens similaires"

---

## Phase 4 — Espace Client
### 4.1 Tableau de Bord Client (`/client/dashboard`)
- [ ] Vue d'ensemble des activités récentes
- [ ] Widget : Recherches sauvegardées
- [ ] Widget : Biens favoris
- [ ] Widget : Prochaines visites
- [ ] Widget : Messages et notifications

### 4.2 Recherche Avancée Client (`/client/recherche`)
- [ ] Filtres multiples (prix, localisation, type, caractéristiques)
- [ ] Carte interactive avec résultats géolocalisés
- [ ] Sauvegarde de recherche
- [ ] Alertes email pour nouvelles annonces
- [ ] Vues : liste, grille, carte
- [ ] Comparaison de biens (jusqu'à 3)

### 4.3 Espace Personnel Client (`/client/profil`)
- [ ] Onglet : Modification du profil
- [ ] Onglet : Favoris et recherches sauvegardées
- [ ] Onglet : Historique des visites
- [ ] Onglet : Documents (signés et en cours)
- [ ] Onglet : Historique des paiements
- [ ] Onglet : Paramètres notifications

---

## Phase 5 — Espace Agent
### 5.1 Tableau de Bord Agent (`/agent/dashboard`)
- [ ] KPIs : ventes, locations, commissions du mois
- [ ] Widget : Leads en cours et nouveaux
- [ ] Widget : Visites du jour et de la semaine
- [ ] Widget : Tâches et rappels
- [ ] Widget : Statistiques annonces (vues, contacts)
- [ ] Graphiques de performance (Chart.js ou Recharts)

### 5.2 Gestion des Annonces (`/agent/annonces`)
- [ ] Liste des annonces avec filtres et statuts
- [ ] Formulaire de création d'annonce (multi-étapes)
- [ ] Upload images/vidéos (Supabase Storage)
- [ ] Intégration éditeur Pannellum (visite virtuelle)
- [ ] Gestion des statuts (disponible, loué, vendu, archivé)
- [ ] Duplication d'annonce
- [ ] Prévisualisation avant publication
- [ ] Statistiques par annonce

### 5.3 Leads & Communications (`/agent/leads`)
- [ ] Liste des leads avec filtres (source, statut, date)
- [ ] Fiche lead avec timeline des interactions
- [ ] Planification de rappels et tâches
- [ ] Interface de communication : Email, WhatsApp (liens directs)
- [ ] Conversion lead → client
- [ ] Statistiques de conversion

### 5.4 Calendrier & Visites (`/agent/calendrier`)
- [ ] Calendrier interactif (vue jour/semaine/mois)
- [ ] Gestion des créneaux de disponibilité
- [ ] Gestion des demandes de visite (accepter, reporter, annuler)
- [ ] Rappels automatiques (notifications Supabase)
- [ ] Feedback post-visite
- [ ] Statistiques des visites

---

## Phase 6 — Espace Administrateur
### 6.1 Tableau de Bord Admin (`/admin/dashboard`)
- [ ] Métriques globales (utilisateurs, biens, transactions)
- [ ] Graphiques de performance (ventes, locations, revenus)
- [ ] Activité récente sur la plateforme
- [ ] Alertes système

### 6.2 Gestion Utilisateurs (`/admin/utilisateurs`)
- [ ] Liste utilisateurs avec filtres (rôle, statut)
- [ ] Création/modification de comptes agents
- [ ] Gestion des rôles et permissions
- [ ] Activation/désactivation de comptes
- [ ] Stats par agent (performance, commissions)
- [ ] Logs d'activité

### 6.3 Configuration & Rapports (`/admin/configuration`)
- [ ] Onglet : Gestion des types de biens (`property_types`)
- [ ] Onglet : Configuration CinetPay (paramètres paiement)
- [ ] Onglet : Modèles de documents (baux, contrats)
- [ ] Onglet : Génération de rapports personnalisés (export PDF/Excel)
- [ ] Onglet : Logs système et audit

---

## Phase 7 — Modèle économique agent (Wallet)
> Ces fonctionnalités reposent sur les tables `agent_wallets`, `funds_deposit`, `ads_activating`

### 7.1 Wallet agent
- [ ] Créer automatiquement un `agent_wallets` à la création d'un compte agent
- [ ] Page `/agent/wallet` : affichage du solde courant
- [ ] Historique des dépôts (`funds_deposit`)
- [ ] Historique des déductions (`ads_activating`)

### 7.2 Recharge du wallet via CinetPay (flag `CINETPAY_ENABLED`)
- [ ] Endpoint `/api/wallet/deposit/initiate` : créer `funds_deposit` + appel CinetPay
- [ ] Webhook `/api/wallet/deposit/webhook` : valider + créditer `agent_wallets.balance`
- [ ] UI de sélection du montant et de la méthode de paiement (WAVE, ORANGE_MONEY, MTN_MONEY, MOOV_MONEY, CARD)

### 7.3 Activation des annonces
- [ ] Définir le coût d'activation dans les constantes (`constants/pricing.ts`)
- [ ] Endpoint `/api/ads/activate` : vérifier solde + insérer `ads_activating` + déduire `balance`
- [ ] Affichage de la date d'expiration sur les annonces actives
- [ ] Notification à J-3 avant expiration

## Phase 8 — Intégrations avancées
- [ ] **CinetPay** : Activer quand clé API disponible (flag `CINETPAY_ENABLED`)
  - [ ] Endpoint paiement client (`/api/payments/initiate`)
  - [ ] Webhook confirmation (`/api/payments/webhook`)
  - [ ] UI de paiement avec sélection de méthode
- [ ] **Adobe Sign** : Activer quand clé API disponible (flag `ADOBE_SIGN_ENABLED`)
  - [ ] Envoi de documents à signer
  - [ ] Webhook de confirmation de signature
  - [ ] Téléchargement des documents signés
- [ ] **Pannellum** : Finaliser l'éditeur de tours virtuels côté agent
  - [ ] Champs `default_scene`, `auto_rotate`, `auto_rotate_speed` dans le formulaire

---

## Phase 9 — Production & Déploiement
- [ ] Optimisation des images et performances (Lighthouse > 90)
- [ ] Tests E2E sur les parcours critiques (auth, recherche, paiement)
- [ ] Configuration Vercel (variables d'env, domaine)
- [ ] Mise en place des logs d'erreurs (Sentry ou équivalent)
- [ ] Documentation finale (`README.md`)
