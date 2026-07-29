<div align="center">

# Dhayaro

### Écosystème Numérique Résilient pour la Gestion Hospitalière et l'Archivage Pérenne des Protocoles de Soins

**Offline-First | Edge Computing | Résilient | PWA | RDC**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)](https://typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://postgresql.org)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-009688)](https://orm.drizzle.team)
[![Docker](https://img.shields.io/badge/Docker-24-2496ED?logo=docker)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## Table des Matières

1. [Contexte Académique](#contexte-académique)
2. [Le Système de Santé en RDC](#le-système-de-santé-en-rdc)
3. [Problématique et Constat](#problématique-et-constat)
4. [Aperçu du Projet](#aperçu-du-projet)
5. [Objectifs du Système](#objectifs-du-système)
6. [Résilience et Edge Computing](#résilience-et-edge-computing)
7. [Cycle de Vie de la Donnée Médicale](#cycle-de-vie-de-la-donnée-médicale)
8. [Architecture Technique](#architecture-technique)
9. [Stack Technique](#stack-technique)
10. [Installation](#installation)
11. [Configuration](#configuration)
12. [Modules Fonctionnels](#modules-fonctionnels)
13. [Flux Complet du Parcours Patient](#flux-complet-du-parcours-patient-a-à-z)
14. [Cycle de Vie de la Maladie et Cas Clinique](#cycle-de-vie-de-la-maladie-et-cas-clinique-a-à-z)
15. [Rôles et Permissions](#rôles-et-permissions)
16. [Sécurité et Confidentialité](#sécurité-et-confidentialité)
17. [Interopérabilité et Standards](#interopérabilité-et-standards)
18. [Structure du Projet](#structure-du-projet)
19. [Déploiement](#déploiement)
20. [Cadre Légal et Éthique](#cadre-légal-et-éthique)
21. [Licence](#licence)

---

## Contexte Académique

Ce projet est réalisé dans le cadre du mémoire de fin d'études :

> **« Modélisation et implémentation d'un écosystème numérique résilient pour la gestion hospitalière et l'archivage pérenne des protocoles de soins en zones décentralisées. Cas de la Zone de Santé d'Alimbongo/Nord-Kivu »**

| | |
|---|---|
| **Institution** | ISTA/Kinshasa |
| **Nom complet** | Institut Supérieur des Techniques Appliquées |
| **Département** | Informatique |
| **Ville** | Kinshasa, République Démocratique du Congo |
| **Zone d'étude** | Zone de Santé d'Alimbongo |
| **Année** | 2025-2026 |

### Problématique

> Comment concevoir et implémenter un écosystème numérique qui soit à la fois **performant pour la gestion hospitalière** et assez **résilient pour survivre aux contraintes techniques** d'une zone décentralisée comme Alimbongo ?

### Hypothèse Générale

> La mise en place d'un **écosystème numérique hybride (Offline-first)**, reposant sur des **infrastructures à basse consommation énergétique** et des **protocoles de soins interactifs**, permettrait de garantir la continuité du service hospitalier et l'intégrité à long terme des archives médicales à Alimbongo, tout en s'affranchissant des contraintes d'instabilité du réseau internet et de l'électricité propres aux zones décentralisées.

### Hypothèses Spécifiques

| # | Hypothèse | Domaine |
|---|-----------|---------|
| H1 | Une architecture **Offline-First** permet de maintenir la gestion hospitalière opérationnelle à 100% même pendant les coupures internet | Technique |
| H2 | Des serveurs à **basse consommation** (Raspberry Pi) couplés à un **micro-système photovoltaïque** garantissent une disponibilité 24h/24 | Énergétique |
| H3 | Une **réplication redondante** des données assure la survie des archives même en cas de destruction physique d'un site | Sécurité |
| H4 | L'intégration de **protocoles de soins numérisés** réduit les erreurs médicales de 30 à 50% chez le personnel moins expérimenté | Médical |
| H5 | Une interface **simplifiée et multilingue** (Français/Swahili) favorise une adoption rapide par le personnel soignant | Accessibilité |
| H6 | L'utilisation de **standards ouverts** (HL7, FHIR) permet la transmission de rapports au niveau national (DHIS2) | Interopérabilité |

---

## Le Système de Santé en RDC

Le système de santé de la RDC est structuré de manière **pyramidale à trois niveaux** :

```
                    ┌─────────────────────┐
                    │   NIVEAU CENTRAL    │
                    │  Ministère de la    │
                    │  Santé Publique     │
                    │  (Kinshasa)         │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  NIVEAU INTERMÉDIAIRE  │
                    │  Divisions          │
                    │  Provinciales de    │
                    │  la Santé (DPS)     │
                    └──────────┬──────────┘
                               │
              ┌────────────────▼────────────────┐
              │      NIVEAU PÉRIPHÉRIQUE        │
              │  516+ Zones de Santé (ZS)       │
              │  ┌─────────────────────────┐    │
              │  │ Bureau Central de la     │    │
              │  │ Zone (BCZS)              │    │
              │  ├─────────────────────────┤    │
              │  │ Hôpital Général de       │    │
              │  │ Référence (HGR)          │    │
              │  ├─────────────────────────┤    │
              │  │ Centres de Santé (CS)    │    │
              │  └─────────────────────────┘    │
              └─────────────────────────────────┘
```

### Défis du Système de Santé

| Défi | Description |
|------|-------------|
| **Financement** | Faible (4% du PIB), 38% d'aide extérieure, 70% de paiement direct par les usagers |
| **Ressources Humaines** | Déséquilibre de répartition, faible motivation, formation à renforcer |
| **Accès aux soins** | Difficile dans de nombreuses régions, forte prévalence du paludisme |
| **Infrastructure** | Instabilité électrique, rareté d'internet, zones enclavées |
| **Archives** | Gestion manuelle sur papier, pertes fréquentes, détérioration |

### Pourquoi Dhayaro est crucial pour Alimbongo

Dans ce contexte, le **Système d'Information Hospitalier (SIH)** remplit quatre fonctions vitales :

1. **L'Unification** — Éviter la fragmentation des dossiers (un carnet au labo, un autre à la pharmacie, un troisième en consultation). Tout est regroupé sous un identifiant unique.

2. **La Sécurisation** — Remplacer les registres papiers qui se déchirent ou se perdent par des archives numériques avec sauvegarde redondante.

3. **L'Aide à la décision** — Intégrer les protocoles de soins. Si un infirmier prescrit un médicament contre-indiqué, le système l'alerte immédiatement.

4. **Le Pilotage Sanitaire** — Générer automatiquement les rapports SNIS pour le Bureau Central de la Zone, permettant de surveiller les épidémies en temps réel.

---

## Problématique et Constat

### Le constat à Alimbongo

Actuellement, la gestion à Alimbongo est **essentiellement manuelle** (système papier). Voici les points critiques identifiés :

| Problème | Risque | Impact |
|----------|--------|--------|
| **Dossiers sur papier** | Détérioration physique (humidité, insectes), pertes lors des déplacements | Perte d'historique patient |
| **Protocoles sur affiches** | Personnel débordé s'écarte des normes OMS par oubli | Erreurs médicales évitables |
| **Patient porte son dossier** | Fraude possible sur résultats/prix, lenteur administrative | Risque pour la sécurité |
| **Rapportage SNIS manuel** | Journées entières de compilation, erreurs de calcul | Retards de transmission |
| **Absence d'archivage pérenne** | Données non lisibles à long terme | Perte de données historiques |

### La solution Dhayaro

**Dhayaro** est une plateforme hospitalière résiliente qui résout ces problèmes en combinant :

- Une **application web moderne** pour la gestion complète du parcours patient
- Un **serveur Edge local** pour fonctionner sans internet
- Une **alimentation solaire** pour fonctionner sans électricité stable
- Un **système de synchronisation** pour envoyer les données quand la connexion revient
- Des **protocoles de soins interactifs** pour guider le personnel médical
- Un **archivage pérenne** en format PDF/A avec réplication redondante

---

## Aperçu du Projet

**Dhayaro** est conçu pour les zones de santé décentralisées de la RDC, notamment la Zone de Santé d'Alimbongo dans la province du Nord-Kivu. Il permet de :

| Fonctionnalité | Description |
|----------------|-------------|
| **Gérer les patients** | Dossier médical complet, contacts, assurance, antécédents, allergies |
| **Suivre les consultations** | Motif, symptômes, signes vitaux, diagnostics, notes |
| **Administrer les traitements** | Prescriptions, posologie, suivi, évolution |
| **Gérer le laboratoire** | Demandes d'examens, résultats, validation |
| **Digitaliser les protocoles** | Arbres décisionnels interactifs, aide à la décision clinique |
| **Organiser la file d'attente** | Workflow complet en temps réel |
| **Générer des documents** | Ordonnances, certificats, rapports médicaux (PDF) |
| **Générer les rapports SNIS** | Automatisation des rapports mensuels pour le BCZS |
| **Archiver pérennement** | Formats PDF/A, sauvegardes redondantes, réplication |
| **Fonctionner hors-ligne** | Saisie et consultation sans internet |
| **Synchroniser les données** | Sync intermittente Edge → Cloud |

---

## Objectifs du Système

### Objectif Général

Concevoir et mettre en œuvre un **système d'information hospitalier robuste et autonome**, capable d'assurer la gestion fluide des soins et la conservation sécurisée des dossiers médicaux dans un environnement aux ressources numériques instables.

### Objectifs Spécifiques

| Plan | Objectif | Détail |
|------|----------|--------|
| **Technique** | Architecture Offline-First | Saisie et consultation sans internet, sync automatique |
| **Médical** | Protocoles de soins interactifs | Guides cliniques numériquement intégrés, aide à la décision |
| **Administratif** | Automatisation du parcours patient | Réception → Consultation → Labo → Pharmacie → Facturation |
| **Pérennité** | Archivage redondant | Sauvegarde sur supports multiples, formats PDF/A |
| **Énergétique** | Basse consommation | Fonctionnement sur kits solaires, autonomie 48h |
| **Évaluation** | Tableau de bord SNIS | Rapports automatiques, surveillance épidémiologique |

---

## Résilience et Edge Computing

### Architecture Offline-First

Le système est conçu pour fonctionner **sans connexion internet**. Les données sont stockées localement sur un serveur Edge et synchronisées avec le cloud provincial/national dès qu'une connexion est disponible.

### Architecture en 4 niveaux

```
┌─────────────────────────────────────────────────────────────────┐
│  NIVEAU 4 — Cloud Provincial/National                          │
│  Localisation : Goma ou Kinshasa                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Backup de sécurité (sauvegarde distante)               │  │
│  │ • Consolidation des statistiques nationales (DHIS2)      │  │
│  │ • Archivage à long terme (PDF/A)                         │  │
│  │ • Serveur central PostgreSQL                             │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  NIVEAU 3 — Gateway (Relais de Communication)                  │
│  Équipement : Routeur 4G/LTE ou Antenne VSAT (Starlink)       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Reste en veille, ne s'active que si connexion détectée │  │
│  │ • Synchronisation intermittente via tunnel VPN sécurisé  │  │
│  │ • Gestion des files d'attente de données (Queue)         │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  NIVEAU 2 — Nœud Local — Edge Computing (Alimbongo)            │
│  Serveur : Raspberry Pi 5 ou Intel NUC (basse consommation)    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Conteneur Docker 1 : OpenMRS/Bahmni (Dossiers patients) │  │
│  │ Conteneur Docker 2 : Nextcloud (Protocoles PDF/A)        │  │
│  │ Conteneur Docker 3 : CouchDB (Stockage + réplication)    │  │
│  │ Alimentation : Système hybride Solaire + Batterie        │  │
│  │ Autonomie : 48h minimum sans soleil                       │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  NIVEAU 1 — Points de Soin (Utilisateurs)                      │
│  Appareils : Tablettes durcies / Smartphones Android           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Client léger (navigateur web)                          │  │
│  │ • Wi-Fi local sécurisé (WPA3) relié au serveur           │  │
│  │ • Saisie hors-ligne des signes vitaux et symptômes       │  │
│  │ • Consultation des protocoles de soins archivés          │  │
│  │ • Facturation et impression                              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Flux en mode dégradé (sans internet)

```
Tablette (Infirmier)          Serveur Local (Edge)           Serveur Central (Goma)
      │                              │                              │
      │  1. Saisie données           │                              │
      │─────────────────────────────>│                              │
      │                              │  2. Stockage local           │
      │                              │     (instantané)             │
      │                              │                              │
      │                              │  3. Tentative ping           │
      │                              │─────────────────────────────>│
      │                              │                              │
      │                              │  4a. Si OK → Sync            │
      │                              │      via VPN sécurisé        │
      │                              │<─────────────────────────────│
      │                              │                              │
      │                              │  4b. Si ÉCHEC →              │
      │                              │      Donnée en Queue         │
      │                              │      (file d'attente)        │
      │                              │                              │
      │                              │  5. Dès retour réseau →      │
      │                              │      Sync automatique        │
      │                              │─────────────────────────────>│
```

### Résilience énergétique

| Composant | Spécification |
|-----------|---------------|
| **Serveur** | Raspberry Pi 5 (5W) ou Intel NUC (15W) |
| **Panneaux solaires** | 100W minimum |
| **Batterie** | Lithium LiFePO4, autonomie 48h |
| **Onduleur** | Pure sinewave, protection surtension |
| **Tablettes** | Batterie 10h, charge solaire directe |

### Archivage pérenne

| Aspect | Solution |
|--------|----------|
| **Format** | PDF/A (Portable Document Format for Archiving) |
| **Standard** | ISO 19005, lisibilité garantie 20+ ans |
| **Réplication** | 2 supports physiques différents (miroir) |
| **Intégrité** | Hash SHA-256 pour détecter les modifications |
| **Stockage** | NAS local + sauvegarde externe |

---

## Cycle de Vie de la Donnée Médicale

Dans l'écosystème Dhayaro, chaque donnée médicale passe par 5 étapes :

### 1. Collecte (Saisie)
- L'infirmier saisit les signes vitaux (température, tension, poids) sur tablette
- La collecte se fait **hors-ligne** si le réseau est coupé
- Interface simplifiée pour éviter les erreurs de saisie

### 2. Traitement (Exploitation)
- Le système compare les données aux **protocoles de soins**
- Exemple : température > 38.5°C → suggère « Goutte Épaisse » pour paludisme
- **Aide à la décision** en temps réel pour le personnel soignant

### 3. Stockage et Conservation
- **Local** : Stockage immédiat sur le serveur Edge (Alimbongo)
- **Distant** : Synchronisation vers le cloud (Goma/Kinshasa) dès connexion disponible
- Chiffrement des données au repos

### 4. Diffusion (Partage)
- Le médecin prescrit → le laboratoire voit la demande → la pharmacie prépare
- Circulation **instantanée** entre services via le Wi-Fi local
- **Secret médical** : seuls les agents autorisés accèdent aux données

### 5. Archivage Pérenne
- Données actives → serveur local (accès rapide)
- Données inactives → stockage longue durée (PDF/A)
- Formats standards ouverts, lisibles même si la technologie change

---

## Architecture Technique

### Architecture applicative

```
src/
├── app/                         # Next.js App Router
│   ├── (app)/                  # Pages authentifiées
│   │   ├── dashboard/          # Tableau de bord
│   │   ├── patients/           # Gestion des patients
│   │   ├── consultations/      # Consultations médicales
│   │   ├── diagnostics/        # Diagnostics
│   │   ├── diseases/           # Maladies (CIM-10)
│   │   ├── protocols/          # Protocoles de soins
│   │   ├── treatments/         # Traitements + Ordonnances
│   │   ├── laboratory/         # Laboratoire
│   │   ├── queue/              # File d'attente
│   │   ├── documents/          # Documents médicaux
│   │   ├── archives/           # Archives pérennes
│   │   ├── notifications/      # Notifications
│   │   ├── reports/            # Rapports (SNIS)
│   │   ├── users/              # Gestion utilisateurs
│   │   ├── facilities/         # Établissements
│   │   ├── settings/           # Paramètres
│   │   ├── audit/              # Journal d'audit
│   │   ├── profile/            # Profil utilisateur
│   │   ├── care-episodes/      # Épisodes de soins
│   │   ├── clinical-cases/     # Cas cliniques
│   │   ├── clinical-decision/  # Aide à la décision
│   │   ├── knowledge-base/     # Base de connaissances
│   │   ├── doctors/            # Listing médecins
│   │   ├── research/           # Recherche clinique
│   │   ├── sync-center/        # Centre de synchronisation
│   │   ├── analytics/          # Analyses avancées
│   │   └── patient/            # Portail patient (dashboard, rdv, etc.)
│   ├── (auth)/                 # Pages d'authentification
│   │   ├── login/
│   │   ├── patient-login/
│   │   └── forgot-password/
│   └── api/v1/                 # API Routes REST (50+ endpoints)
│       ├── auth/               # Authentification JWT
│       ├── patients/           # CRUD patients
│       ├── consultations/      # CRUD consultations + fiches PDF
│       ├── diagnostics/        # CRUD diagnostics + fiches PDF
│       ├── diseases/           # CRUD maladies CIM-10
│       ├── protocols/          # CRUD protocoles thérapeutiques
│       ├── treatments/         # CRUD traitements + ordonnances PDF
│       ├── prescriptions/      # CRUD prescriptions
│       ├── laboratory/         # Examens + catégories + fiches PDF
│       ├── queue/              # File d'attente
│       ├── documents/          # Génération PDF
│       ├── archives/           # Gestion archives
│       ├── notifications/      # Notifications
│       ├── users/              # Gestion utilisateurs
│       ├── facilities/         # Établissements
│       ├── audit/              # Journal d'audit
│       ├── sync/               # Synchronisation Edge (push/pull)
│       ├── reports/            # Rapports SNIS
│       ├── settings/           # Préférences utilisateur
│       ├── dashboard/          # Statistiques dashboard
│       ├── patient/            # Portail patient
│       ├── care-episodes/      # Épisodes de soins + archive/restore/fiche
│       ├── clinical-cases/     # Cas cliniques + stats + fiches PDF
│       ├── clinical-knowledge-base/  # Base de connaissances
│       ├── disease-statistics/ # Statistiques maladies
│       └── therapeutic-protocols/    # Protocoles thérapeutiques
├── components/
│   ├── ui/                     # Composants shadcn/ui
│   ├── layout/                 # Sidebar, Header, Layout
│   └── charts/                 # Composants Recharts
├── views/                      # Composants pages
├── hooks/                      # Custom hooks React
│   ├── use-data.ts             # Tous les hooks TanStack Query
│   ├── use-toast.ts            # Notifications toast
│   ├── use-permissions.ts      # Vérification RBAC
│   └── use-sync.ts             # Synchronisation
├── store/                      # Zustand stores
│   ├── index.ts                # Store global (sidebar, darkMode, notifs)
│   └── auth-store.ts           # Store authentification
├── services/
│   ├── api.ts                  # Client API avec auto-refresh token
│   ├── sync-engine.ts          # Moteur de synchronisation
│   └── offline-storage.ts      # Stockage local (IndexedDB)
├── lib/
│   ├── utils.ts                # Utilitaires (cn, formatDate, etc.)
│   ├── db.ts                   # Connexion Neon Drizzle ORM
│   ├── schema.ts               # 20+ tables Drizzle ORM
│   ├── auth.ts                 # JWT create/verify, password hash
│   ├── seed.ts                 # Données de démonstration (1000+ patients)
│   ├── permissions.ts          # RBAC permissions (11 rôles, 50+ permissions)
│   ├── validation.ts           # Sanitization UUID, recherche
│   ├── api-errors.ts           # Gestion erreurs API
│   └── rate-limit.ts           # Rate limiter IP
└── types/                      # TypeScript types
```

---

## Stack Technique

### Frontend

| Technologie | Version | Usage |
|-------------|---------|-------|
| React | 19 | UI Library |
| Next.js | 15 | Framework full-stack (App Router) |
| TypeScript | 6 | Typage strict |
| TailwindCSS | 4 | Styling utility-first |
| shadcn/ui | - | Composants UI (Radix UI) |
| Zustand | 5 | Client state management |
| TanStack Query | 5 | Server state + synchronisation |
| Recharts | 2 | Graphiques et visualisations |
| jsPDF | - | Génération PDF côté client |
| html2canvas | - | Capture d'écran pour PDF |

### Backend

| Technologie | Version | Usage |
|-------------|---------|-------|
| Next.js API Routes | 15 | 50+ endpoints REST |
| Drizzle ORM | 0.44 | ORM PostgreSQL |
| PostgreSQL (Neon) | 16 | Base de données serverless |
| jose | 6 | JWT tokens (RFC 7519) |
| bcryptjs | 3 | Hachage mots de passe |
| Zod | 3 | Validation des schémas |

### Base de données — 20 tables

| Table | Description |
|-------|-------------|
| `facilities` | Établissements de santé (10) |
| `users` | Utilisateurs (23 comptes) |
| `patients` | Patients (1003) |
| `consultations` | Consultations médicales (3000) |
| `diagnostics` | Diagnostics liés aux maladies CIM-10 |
| `diseases` | Référentiel CIM-10 (12 maladies) |
| `medications` | Médicaments (18) |
| `treatments` | Traitements prescrits (500) |
| `prescriptions` | Prescriptions détaillées (500) |
| `lab_categories` | Catégories d'examens (5) |
| `lab_exams` | Examens de laboratoire (800) |
| `queue` | File d'attente (100 entrées) |
| `documents` | Documents médicaux PDF (200) |
| `notifications` | Notifications (150) |
| `audit_logs` | Journal d'audit (200) |
| `archives` | Archives pérennes (100) |
| `care_episodes` | Épisodes de soins (20) |
| `clinical_cases` | Cas cliniques (100) |
| `clinical_knowledge_base` | Base de connaissances (30) |
| `therapeutic_protocols` | Protocoles thérapeutiques (10) |
| `disease_statistics` | Statistiques maladies |
| `sync_queue` | File de synchronisation Edge↔Cloud |

### Edge Computing (Déploiement Alimbongo)

| Technologie | Usage |
|-------------|-------|
| Docker / Docker Compose | Conteneurisation des services |
| CouchDB | Base locale avec réplication |
| OpenMRS / Bahmni | Dossiers patients (optionnel) |
| Nextcloud | Archivage protocoles PDF/A |
| Nginx | Reverse proxy + HTTPS local |

### Infrastructure

| Composant | Spécification |
|-----------|---------------|
| **Serveur Edge** | Raspberry Pi 5 (8GB) ou Intel NUC |
| **Stockage** | SSD 512GB + NAS externe |
| **Réseau** | Wi-Fi local (WPA3) + Routeur 4G/LTE |
| **Énergie** | Panneaux solaires 100W + batterie LiFePO4 |
| **Tablettes** | Android 10+, écran 10" minimum |

---

## Installation

### Prérequis

- Node.js 20+ (recommandé : nvm)
- npm ou pnpm
- PostgreSQL 16+ (ou compte Neon gratuit)

### Étapes

```bash
# 1. Cloner le dépôt
git clone https://github.com/Wabtechs/Dhayaro.git
cd Dhayaro

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# 4. Initialiser la base de données
npm run db:push

# 5. Charger les données de démonstration
npm run db:seed

# 6. Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:3000`.

### Installation pour déploiement Edge

```bash
# Sur le Raspberry Pi 5 ou Intel NUC
# Installer Docker
curl -fsSL https://get.docker.com | sh

# Cloner le projet
git clone https://github.com/Wabtechs/Dhayaro.git
cd Dhayaro

# Lancer avec Docker Compose
docker compose -f docker-compose.edge.yml up -d

# Vérifier le statut
docker compose ps
docker compose logs -f
```

---

## Configuration

### Variables d'environnement (`.env`)

```env
# Base de données
DATABASE_URL=postgresql://user:password@host:5432/dhayaro

# Authentification
JWT_SECRET=votre-cle-secrete-ultra-securisee
JWT_EXPIRES_IN=7d

# API
NEXT_PUBLIC_API_URL=http://localhost:3000

# Mode Edge (optionnel)
EDGE_MODE=false
SYNC_INTERVAL=30000
OFFLINE_STORAGE_PATH=./data/offline
```

### Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Super Admin | superadmin@dhayaro.cd | admin123 |
| Admin | admin@dhayaro.cd | admin123 |
| Médecin (Kabongo) | dr.kabongo@dhayaro.cd | doctor123 |
| Médecin (Clovis) | dr.clovis@dhayaro.cd | doctor123 |
| Médecin (Sylvain) | dr.sylvain@dhayaro.cd | doctor123 |
| Médecin (Pierre) | dr.pierre@dhayaro.cd | doctor123 |
| Médecin (Françoise) | dr.francoise@dhayaro.cd | doctor123 |
| Médecin (André) | dr.andre@dhayaro.cd | doctor123 |
| Médecin (David) | dr.david@dhayaro.cd | doctor123 |
| Spécialiste (Espérance) | dr.esperance@dhayaro.cd | doctor123 |
| Spécialiste (Grâce) | dr.grace@dhayaro.cd | doctor123 |
| Spécialiste (Marie) | dr.marie@dhayaro.cd | doctor123 |
| Infirmier (Mohamed) | nurse.mohamed@dhayaro.cd | nurse123 |
| Infirmier (Cécile) | nurse.cecile@dhayaro.cd | nurse123 |
| Laborantin | lab.joseph@dhayaro.cd | dhayaro123 |
| Pharmacien | pharm.beatrice@dhayaro.cd | dhayaro123 |
| Réceptionniste | reception@dhayaro.cd | dhayaro123 |
| Comptable | compta.augustin@dhayaro.cd | dhayaro123 |
| Archiviste | archive.monique@dhayaro.cd | dhayaro123 |
| Patient (Marcel) | patient.marcel@dhayaro.cd | patient123 |
| Patient (Solange) | patient.solange@dhayaro.cd | patient123 |
| Patient (Prosper) | patient.prosper@dhayaro.cd | patient123 |

---

## Modules Fonctionnels

### 1. Gestion des Patients
**Parcours complet du patient** : enregistrement → modification → recherche → dossier médical.

- Identifiant unique (code patient)
- Informations personnelles (nom, prénom, date de naissance, sexe)
- Contacts et personne à prévenir
- Assurance et groupe sanguin
- Allergies et antécédents médicaux
- Historique médical complet
- Photo du patient
- Suppression logique (archivage)

### 2. Consultations
**Suivi médical détaillé** : de l'admission au diagnostic.

- Motif de la consultation
- Symptômes déclarés
- Signes vitaux (température, tension, poids, fréquence cardiaque)
- Notes du médecin
- Diagnostic provisoire
- Orientation (labo, pharmacie, hospitalisation)

### 3. Diagnostics
**Classification et suivi** : diagnostic principal et secondaires.

- Classification CIM-10 (Classification Internationale des Maladies)
- Diagnostic principal et diagnostics secondaires
- Validation par le médecin responsable
- Historique des diagnostics par patient

### 4. Maladies (Référentiel CIM-10)
**Base de données des maladies** : classification, symptômes, complications.

- CRUD complet des maladies
- Classification CIM-10 intégrée
- Symptômes associés
- Complications possibles
- Protocoles de soins liés

### 5. Protocoles de Soins
**Aide à la décision clinique** : arbres décisionnels interactifs.

- Protocoles standards (paludisme, accouchement, malnutrition, etc.)
- Arbres décisionnels interactifs
- Alertes si non-conformité aux normes OMS
- Guides de pratique clinique numérisés
- Personnalisables par établissement

### 6. Traitements
**Prescription et suivi** : médicaments, posologie, évolution.

- Prescription médicale
- Liste des médicaments avec posologie
- Durée du traitement
- Instructions particulières
- Historique des traitements
- Suivi de l'évolution

### 7. Laboratoire
**Examens et résultats** : demandes, catégories, validation.

- Demande d'examen par le médecin
- Catégories d'examens (biochimie, hématologie, parasitologie, etc.)
- Saisie des résultats par le laborantin
- Validation des résultats
- Historique et impression

### 8. File d'attente
**Workflow en temps réel** : de la réception à la sortie.

```
Réception → Salle d'attente → Médecin → Laboratoire → Retour médecin → Pharmacie → Fin
    │              │              │            │               │              │          │
    ▼              ▼              ▼            ▼               ▼              ▼          ▼
 Enregistrement  Attente     Consultation  Examens       Prescription   Délivrance   Sortie
```

- Statut en temps réel pour chaque patient
- Notifications automatiques
- Estimation du temps d'attente

### 9. Documents Médicaux
**Génération automatique** : tous les documents au format PDF.

- Consultations
- Diagnostics
- Ordonnances médicales
- Prescriptions
- Résultats de laboratoire
- Certificats médicaux
- Rapports médicaux

### 10. Tableau de Bord
**Vue d'ensemble** : widgets, graphiques, statistiques.

- Nombre de patients (total, aujourd'hui, en cours)
- Consultations en cours et terminées
- Résultats de laboratoire en attente
- Diagnostics par catégorie
- Activité quotidienne/hebdomadaire
- Graphiques interactifs (Recharts)
- Rapports SNIS automatisés

### 11. Notifications
**Alertes temps réel** : notifications pour tout le personnel.

- Nouveau patient enregistré
- Diagnostic posé
- Résultats de laboratoire disponibles
- Ordonnance générée
- Consultation terminée

### 12. Rapports
**Export et analyse** : PDF, Excel, rapports SNIS.

- Rapports SNIS mensuels (pour le BCZS)
- Statistiques par période, médecin, maladie
- Export PDF et Excel
- Filtres avancés
- Données épidémiologiques

### 13. Archives
**Archivage pérenne** : conservation longue durée.

- Archivage automatique de toutes les entités
- Format PDF/A pour lisibilité à long terme
- Réplication redondante
- Recherche rapide dans les archives
- Restauration possible

### 14. Authentification et RBAC
**Sécurité** : 10 rôles avec permissions granulaires.

- Authentification JWT sécurisée
- Refresh token
- 10 rôles distincts
- Permissions par module et par action
- Routes et API protégées

### 15. Synchronisation
**Sync intermittente** : Edge ↔ Cloud.

- Détection automatique de la connexion
- File d'attente locale en mode dégradé
- Synchronisation automatique au retour du réseau
- Gestion des conflits (résolution de conflits)
- Chiffrement pendant la transmission (VPN)

### 16. Épisodes de Soins (Care Episodes)
**Parcours patient global** : de l'admission à la sortie.

- Cycle de vie complet : ADMITTED → TRIAGE → CONSULTATION → TREATMENT → HOSPITALIZED → DISCHARGED → TRANSFERRED → ARCHIVED
- Numéro d'épisode unique (ex: `EP-2026-000001`)
- Regroupement de toutes les entités d'un séjour (consultations, diagnostics, traitements, labos, documents)
- Issues possibles : GUERISON, AMELIORATION, DECES, TRANSFERT, FUITE
- Archivage et restauration des épisodes

### 17. Cas Cliniques (Clinical Cases)
**Suivi de cas médical** : de la création à la résolution.

- Statuts : draft → active → in_review → resolved → archived
- Priorités : low, medium, high, critical
- Symptômes, diagnostic provisoire, traitement, durée
- Tags pour catégorisation (ex: Cardiologie, Urgence, Pédiatrie)
- Fiche PDF exportable

### 18. Base de Connaissances Cliniques
**Apprentissage continu** : capitalisation des cas anonymisés.

- Cas cliniques anonymisés avec symptômes, diagnostics, traitements, évolution
- Recherche de cas similaires par symptômes ou maladie
- Statistiques des maladies (taux de guérison, mortalité, médicaments courants)
- Aide à la décision clinique

### 19. Protocoles Thérapeutiques
**Arbres décisionnels** : guides cliniques par maladie.

- Étapes structurées avec médicaments, dosages, durées
- Liés aux maladies CIM-10
- Population cible et contre-indications
- Taux d'efficacité documenté

---

## Flux Complet du Parcours Patient (A à Z)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        PARCOURS PATIENT — DHAYARO                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  1. ACCUEIL (Réceptionniste)                                                        │
│     ┌────────────────────────────────────────────────┐                              │
│     │ • Enregistrement du patient                    │                              │
│     │ • Création du dossier (identité, contact,      │                              │
│     │   assurance, allergies, antécédents)           │                              │
│     │ • Génération d'un UUID patient unique          │                              │
│     │ • Création du ticket de file d'attente         │                              │
│     │ • Ouverture d'un épisode de soins (ADMITTED)   │                              │
│     └────────────────────────────────────────────────┘                              │
│                              │                                                      │
│                              ▼                                                      │
│  2. TRIAGE (Infirmier)                                                              │
│     ┌──────────────────────────────────────────────┐                                │
│     │ • Prise des signes vitaux                    │                                │
│     │   (température, tension, pouls, poids)       │                                │
│     │ • Évaluation initiale des symptômes          │                                │
│     │ • Mise à jour statut épisode → TRIAGE        │                                │
│     │ • Création optionnelle d'un cas clinique     │                                │
│     └──────────────────────────────────────────────┘                                │
│                              │                                                      │
│                              ▼                                                      │
│  3. CONSULTATION (Médecin Généraliste / Spécialiste)                                │
│     ┌──────────────────────────────────────────────┐                                │
│     │ • Saisie du motif de consultation            │                                │
│     │ • Examen clinique et symptômes détaillés     │                                │
│     │ • Diagnostic provisoire                      │                                │
│     │ • Statut épisode → CONSULTATION              │                                │
│     └──────────────┬───────────────────────────────┘                                │
│                    │                                                                │
│         ┌──────────┼──────────┐                                                     │
│         ▼          ▼          ▼                                                     │
│  4a. Labo    4b. Imagerie  4c. Orientation                                          │
│  (Labo.)     (Labo.)        directe                                                 │
│  ┌────────┐  ┌────────┐     │                                                       │
│  │Demande │  │Radio/  │     │                                                       │
│  │examen  │  │Scanner │     │                                                       │
│  │Résultat│  │ECG     │     │                                                       │
│  │Valid.  │  │        │     │                                                       │
│  └───┬────┘  └───┬────┘     │                                                       │
│      └─────┬─────┘          │                                                       │
│            ▼                │                                                       │
│  5. DIAGNOSTIC (Médecin)    │                                                       │
│     ┌──────────────────────────────┐                                                │
│     │ • Diagnostic final (CIM-10)  │                                                │
│     │ • Type : PROVISIONAL / FINAL │                                                │
│     │ • Validation par spécialiste │                                                │
│     └──────────────┬───────────────┘                                                │
│                    │                                                                │
│                    ▼                                                                │
│  6. TRAITEMENT (Médecin → Pharmacien)                                               │
│     ┌──────────────────────────────────────────────┐                                │
│     │ • Prescription du traitement                 │                                │
│     │ • Médicaments avec dosage, fréquence, durée  │                                │
│     │ • Génération ordonnance PDF                  │                                │
│     │ • Délivrance par le pharmacien               │                                │
│     │ • Statut épisode → TREATMENT                 │                                │
│     └──────────────────────────────────────────────┘                                │
│                              │                                                      │
│                              ▼                                                      │
│  7. HOSPITALISATION / SUIVI (si nécessaire)                                         │
│     ┌──────────────────────────────────────────────┐                                │
│     │ • Surveillance continue                      │                                │
│     │ • Consultations de suivi (isFollowUp=true)   │                                │
│     │ • Évolution du traitement                    │                                │
│     │ • Statut épisode → HOSPITALIZED              │                                │
│     └──────────────────────────────────────────────┘                                │
│                              │                                                      │
│                              ▼                                                      │
│  8. SORTIE (DISCHARGED)                                                             │
│     ┌──────────────────────────────────────────────┐                                │
│     │ • Issue : GUERISON / AMELIORATION / DECES /  │                                │
│     │          TRANSFERT / FUITE                   │                                │
│     │ • Résumé de sortie avec compteurs            │                                │
│     │ • Documents finaux (certificat, rapport)     │                                │
│     │ • Statut épisode → DISCHARGED                │                                │
│     └──────────────────────────────────────────────┘                                │
│                              │                                                      │
│                              ▼                                                      │
│  9. ARCHIVAGE (Archiviste)                                                          │
│     ┌──────────────────────────────────────────────┐                                │
│     │ • Archivage de l'épisode de soins            │                                │
│     │ • Archivage des entités (consultations,      │                                │
│     │   diagnostics, traitements, examens)         │                                │
│     │ • Snapshot JSON immuable                     │                                │
│     │ • Restauration possible                      │                                │
│     │ • Synchronisation Edge → Cloud               │                                │
│     │ • Format PDF/A pour pérennité                │                                │
│     └──────────────────────────────────────────────┘                                │
│                                                                                     │
│  TRANSVERSAL :                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │ • Notifications à chaque étape (nouveau patient, résultat dispo, etc.)      │    │
│  │ • Documents PDF générés automatiquement                                     │    │
│  │ • Audit trail de toutes les actions                                         │    │
│  │ • Synchronisation Offline-First vers le cloud                               │    │
│  │ • Aide à la décision via protocoles et base de connaissances                │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Cycle de Vie de la Maladie et Cas Clinique (A à Z)

### A. Référentiel Maladies (CIM-10)

```
diseases (Référentiel CIM-10)
  │
  ├── code: "B54"                    # Code CIM-10
  ├── name: "Paludisme non précisé"  # Nom de la maladie
  ├── category: "Maladies infectieuses"
  ├── symptoms: ["Fièvre","Frissons","Sueurs"]
  ├── complications: ["Paludisme cérébral","Anémie sévère"]
  ├── treatments: ["Arthéméther-Luméfantrine","Artésunate IV"]
  ├── isContagious: false
  └── severity: "MODERATE"
```

**12 maladies pré-chargées** : Paludisme, Gastro-entérite, Diabète type 2, HTA, Pneumonie, MPOC, Gastrite, Gonarthrose, Infection urinaire, Dépression, VIH/SIDA, Tuberculose.

### B. Diagnostic

```
Consultation (consultations)
  │
  ├── motif: "Fièvre palustre avec frissons"
  ├── symptoms: ["Fièvre 40°C","Frissons intensifs","Céphalées"]
  ├── vitalSigns: { temperature: 40, heartRate: 95, bloodPressure: "110/70" }
  ├── provisionalDiagnosis: "Paludisme sévère"
  └── status: WAITING → IN_PROGRESS → COMPLETED
        │
        ▼
Diagnostic (diagnostics) ← lié à une maladie CIM-10 (diseaseId)
  │
  ├── diagnosticType: PROVISIONAL | FINAL | DIFFERENTIAL
  ├── description: "Paludisme sévère à Plasmodium falciparum"
  ├── isValidated: false → true       # Validation par spécialiste
  ├── validatedBy: UUID du spécialiste
  └── validatedAt: timestamp
        │
        ▼
Mise à jour des statistiques de la maladie (disease_statistics)
  │
  ├── totalCases +1
  ├── recoveryRate / mortalityRate recalculés
  ├── commonTreatments enrichis
  └── commonMedications enrichis
```

### C. Traitement et Prescription

```
Diagnostic validé
        │
        ▼
Traitement (treatments)
  │
  ├── description: "Artésunate IV 2.4mg/kg J0 puis J24 + Arteméther PO J12"
  ├── status: PRESCRIBED → IN_PROGRESS → COMPLETED | CANCELLED | SUSPENDED
  ├── startDate: "2026-07-20"
  ├── endDate: "2026-08-03"
  ├── notes: "Surveillance parasitémie J3"
  └── outcome: "Guérison complète"
        │
        ├──→ Prescriptions (prescriptions)
        │     │
        │     ├── medicationId → medications (nom, dosage, forme)
        │     ├── dosage: "1 comprimé 2x/j"
        │     ├── frequency: "Matin et soir"
        │     ├── duration: "7 jours"
        │     ├── instructions: "Prendre avec de la nourriture"
        │     └── quantity: 14
        │
        └──→ Document PDF (documents)
              │
              ├── documentType: ORDONNANCE | PRESCRIPTION
              └── title: "Ordonnance médicale"
```

**18 médicaments pré-chargés** : Artésunate, Amoxicilline, Paracétamol, Metformine, Amlodipine, Ibuprofène, Omeprazole, Salbutamol, Sertraline, Furosémide, Ciprofloxacine, Cotrimoxazole, Ceftriaxone, Artéméther-Luméfantrine, TDF/3TC/DTG, Cétirizine, Métoclopramide, Kétorolac.

### D. Historique Patient

```
PATIENT (patients)
  │
  ├── medicalHistoryJson: {}          # Données médicales historiques
  ├── allergies: ["Pénicilline"]       # Allergies documentées
  ├── antecedents: [{type, description, date}]  # Antécédents médicaux
  └── isArchived: false
        │
        ▼
  Épisode de soins (care_episodes)  ← Regroupe tout le séjour
  │
  ├── episodeNumber: "EP-2026-000001"
  ├── status: ADMITTED → TRIAGE → CONSULTATION → TREATMENT
  │          → HOSPITALIZED → DISCHARGED → TRANSFERRED → ARCHIVED
  ├── admitDate, dischargeDate, admitReason
  ├── dischargeSummary: {
  │     consultationsCount, diagnosticsCount, treatmentsCount,
  │     labExamsCount, documentsCount,
  │     diagnostics: [{type, description}],
  │     treatments: [{description, status}]
  │   }
  └── dischargeOutcome: GUERISON | AMELIORATION | DECES | TRANSFERT | FUITE
        │
        ▼
  Entités liées (episode_entities)  — Table polymorphique
  │
  ├── entityType: CONSULTATION | DIAGNOSIS | TREATMENT | LAB_EXAM | DOCUMENT
  └── entityId: UUID vers la table source
        │
        ▼
  Consultation possible via:
  ├── /patients/[id]              → Dossier complet du patient
  ├── /patient-medical-record     → Dossier médical (portail patient)
  ├── /treatment-history          → Historique des traitements
  ├── /patient-consultations      → Toutes les consultations
  └── /patient-lab-exams          → Tous les examens de laboratoire
```

### E. Flux d'Archivage (Détaillé)

```
DÉCLENCHEUR: Action "Archiver" sur un épisode de soins (care-episodes)
                   (Bouton dans l'interface ou API)
                              │
                              ▼
    POST /api/v1/care-episodes/[id]/archive
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
  1. Vérification      2. Entités liées      3. Données complètes
  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐
  │ • Épisode    │    │ Récupération │    │ SELECT dans:         │
  │   existe     │    │ de toutes    │    │ • consultations      │
  │ • Pas déjà   │    │ les entités  │    │ • diagnostics        │
  │   archivé    │    │ liées via    │    │ • treatments         │
  └──────────────┘    │ episode_     │    │ • lab_exams          │
                      │ entities     │    │ • documents          │
                      └──────────────┘    └──────────────────────┘
                              │                    │
                              └────────┬───────────┘
                                       ▼
         ┌───────────────────────────────────────────────┐
         │  4. Résumé de sortie (dischargeSummary)       │
         │  { episodeNumber, admitDate, dischargeDate,   │
         │    admitReason, consultationsCount,           │
         │    diagnosticsCount, treatmentsCount,         │
         │    labExamsCount, documentsCount,             │
         │    diagnostics: [...], treatments: [...] }    │
         └────────────────────────────┬──────────────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         ▼                            ▼                            ▼
  5. Base de connaissances     6. Statistiques maladie     7. Archive immuable
  ┌─────────────────────┐     ┌─────────────────────┐    ┌─────────────────────┐
  │ INSERT INTO         │     │ UPDATE disease_     │    │ INSERT INTO         │
  │ clinical_knowledge_ │     │ statistics          │    │ archives            │
  │ base                │     │ SET totalCases +1,  │    │                     │
  │                     │     │ recoveryRate = ..., │    │ entityType:         │
  │ Données ANONYMISÉES │     │ lastCalculated = now│    │   'PATIENT_FILE'    │
  │ (pas de nom         │     └─────────────────────┘    │ data: snapshot JSON │
  │  patient)           │                                │ title: "Épisode     │
  │                     │                                │   EP-2026-000001    │
  │ • ageRange          │                                │   - Archivé"        │
  │ • symptoms[]        │                                │ archivedBy: user.id │
  │ • diagnostics[]     │                                └─────────────────────┘
  │ • treatments[]      │                                         │
  │ • evolution         │                                         ▼
  │ • durationDays      │                              8. Mise à jour épisode
  │ • outcome           │                              ┌─────────────────────┐
  └─────────────────────┘                              │ careEpisodes SET    │
                                                       │ status = 'ARCHIVED' │
                                                       │ isArchived = true   │
                                                       │ dischargeDate = now │
                                                       │ dischargeSummary =  │
                                                       │   {...}             │
                                                       └─────────────────────┘
                                                                  │
                                                                  ▼
                                                      9. Notification
                                                      ┌─────────────────────┐
                                                      │ "L'épisode EP-2026  │
                                                      │ -000001 a été       │
                                                      │ archivé avec succès"│
                                                      └─────────────────────┘
```

### F. Restauration

```
PATCH /api/v1/care-episodes/[id]/restore
  │
  ├── Vérification: épisode existe et est archivé
  └── careEpisodes.isArchived = false  ← Les données sont préservées
```

### G. Cas Clinique (Clinical Case) — Cycle de vie complet

```
CRÉATION
  │
  ├── Titre, description, symptômes, diagnostic provisoire
  ├── Patient, médecin assigné, établissement
  ├── Priorité: low | medium | high | critical
  └── Statut: draft (via OUTCOME_MAP: PENDING → 'active')
        │
        ▼
WORKFLOW D'ÉTAT (transitions possibles)
  │
  ┌──────────┐
  │  draft   │ ──→ "Passer en Actif"
  └────┬─────┘
       ▼
  ┌──────────┐
  │  active  │ ──→ "Passer en Revu"
  └────┬─────┘
       │
       ▼
  ┌────────────┐
  │ in_review  │ ──→ "Marquer Résolu"  ou  "Réactiver"
  └────┬───────┘
       │
       ▼
  ┌──────────┐
  │ resolved │ ──→ "Archiver"  ou  "Réactiver"
  └────┬─────┘
       │
       ▼
  ┌──────────┐
  │ archived │
  └──────────┘
        │
        ▼
MAPPING VERS LE BACKEND (outcomeStatus)
  │
  ├── draft     → outcomeStatus: 'PENDING'
  ├── active    → outcomeStatus: 'IN_PROGRESS'
  ├── in_review → outcomeStatus: 'IN_PROGRESS'
  ├── resolved  → outcomeStatus: 'SUCCESS'
  └── archived  → outcomeStatus: 'FAILURE'
        │
        ▼
FONCTIONNALITÉS ASSOCIÉES
  │
  ├── Notes textes (auteur, contenu, date)
  ├── Tags de catégorisation (ex: Cardiologie, Urgence)
  ├── Fiche PDF (via /clinical-cases/[id]/fiche)
  └── Suppression (soft-delete via API)
```

### H. Exemple Concret : Paludisme sévère chez Marcel Tshibola

| Étape | Acteur | Action | Entité créée |
|-------|--------|--------|-------------|
| 1 | Réceptionniste | Enregistrement | Patient + Queue |
| 2 | Infirmier Mohamed | Signes vitaux (T° 40°C) | Épisode ADMITTED → TRIAGE |
| 3 | Médecin Kabongo | Consultation + diagnostic provisoire | Consultation |
| 4 | Laborantin Joseph | Goutte épaisse positive | Lab exam → COMPLETED |
| 5 | Médecin Kabongo | Diagnostic final + validation | Diagnostic lié à B54 |
| 6 | Médecin Kabongo | Prescription Artésunate IV | Traitement + Prescriptions + Ordonnance PDF |
| 7 | Pharmacien Béatrice | Délivrance des médicaments | Statut traitement IN_PROGRESS |
| 8 | — | Guérison | Épisode DISCHARGED (GUERISON) |
| 9 | Archiviste Monique | Archivage | Archives + Knowledge Base + Statistiques |

---

### Hiérarchie des rôles

| Niveau | Rôle | Description |
|--------|------|-------------|
| 100 | **Super Admin** | Contrôle total du système (tous les modules) |
| 80 | **Admin** | Administration complète de l'établissement |
| 70 | **Spécialiste** | Consultations spécialisées + validation diagnostics |
| 60 | **Médecin** | Consultations, diagnostics, prescriptions |
| 50 | **Pharmacien** | Gestion des médicaments et délivrance |
| 50 | **Laborantin** | Examens de laboratoire et résultats |
| 40 | **Infirmier** | Soins, triage, signes vitaux |
| 35 | **Comptable** | Facturation et rapports financiers |
| 30 | **Archiviste** | Gestion des archives pérennes |
| 25 | **Réceptionniste** | Accueil, enregistrement, file d'attente |
| 10 | **Patient** | Accès à son propre dossier médical |

### Permissions par module

| Module | Actions | Super Admin | Admin | Méd. | Spéc. | Inf. | Labo. | Pharm. | Récep. | Arch. | Comp. |
|--------|---------|:-----------:|:-----:|:----:|:-----:|:----:|:-----:|:------:|:------:|:-----:|:-----:|
| **Patients** | list/create/edit/delete/archive | ✓ | ✓ | ✓ | ✓ | ✓ | R | R | ✓ | R | R |
| **Consultations** | list/create/edit | ✓ | ✓ | ✓ | ✓ | ✓ | R | - | ✓ | R | R |
| **Diagnostics** | list/create/edit/validate | ✓ | ✓ | ✓ | ✓ | - | - | - | - | R | - |
| **Maladies** | list/create/edit/delete | ✓ | ✓ | - | - | - | - | R | - | - | - |
| **Traitements** | list/create/edit/delete | ✓ | ✓ | ✓ | ✓ | R | - | R | - | R | - |
| **Prescriptions** | list/create/edit | ✓ | ✓ | ✓ | ✓ | - | - | ✓ | - | - | - |
| **Laboratoire** | list/create/edit/validate | ✓ | ✓ | ✓ | ✓ | R | ✓ | R | - | R | R |
| **File d'attente** | list/manage/assign | ✓ | ✓ | ✓ | ✓ | ✓ | R | R | ✓ | - | - |
| **Cas cliniques** | list/create/edit/delete | ✓ | ✓ | ✓ | ✓ | R | - | - | R | R | - |
| **Épisodes** | list/create/edit/archive | ✓ | ✓ | ✓ | ✓ | ✓ | - | - | ✓ | ✓ | - |
| **Documents** | list/create/edit/print/export | ✓ | ✓ | ✓ | ✓ | R | ✓ | R | ✓ | ✓ | - |
| **Archives** | list/manage | ✓ | ✓ | R | R | - | - | - | - | ✓ | - |
| **Protocoles** | list/create/edit/delete | ✓ | ✓ | ✓ | ✓ | - | - | - | - | - | - |
| **Connaissances** | list/search | ✓ | ✓ | ✓ | ✓ | - | - | - | - | - | - |
| **Décision clinique** | read | ✓ | ✓ | ✓ | ✓ | - | - | - | - | - | - |
| **Notifications** | list/manage | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Rapports** | read/export | ✓ | ✓ | - | - | - | - | - | - | - | ✓ |
| **Utilisateurs** | list/create/edit/delete | ✓ | ✓ | - | - | - | - | - | - | - | - |
| **Établissements** | list/create/edit/delete | ✓ | ✓ | - | - | - | - | - | - | - | - |
| **Paramètres** | read/edit | ✓ | ✓ | R | R | R | R | R | R | R | R |
| **Audit** | read | ✓ | - | - | - | - | - | - | - | - | - |

_Légende : ✓ = Accès complet, R = Lecture seule, - = Aucun accès_

---

## Sécurité et Confidentialité

### Authentification et Autorisation

| Mécanisme | Description |
|-----------|-------------|
| **JWT** | Token signé (jose) avec expiration configurable |
| **Refresh Token** | Renouvellement automatique sans reconnexion |
| **RBAC** | 10 rôles avec permissions granulaires par module |
| **Middleware** | Protection des routes et des API endpoints |

### Protection des Données

| Mécanisme | Description |
|-----------|-------------|
| **Chiffrement HTTPS** | TLS 1.3 pour toutes les communications |
| **Chiffrement au repos** | AES-256 pour les données sensibles |
| **Validation Zod** | Sanitization des entrées frontend + backend |
| **Rate Limiting** | Protection contre les attaques par force brute |
| **Audit Log** | Traçabilité complète de toutes les actions |
| **Protection XSS** | Échappement des sorties |
| **Protection SQL Injection** | Requêtes paramétrées (Drizzle ORM) |
| **Secret médical** | Chiffrement des données patients |

### Sauvegarde et Récupération

| Mécanisme | Description |
|-----------|-------------|
| **Sauvegarde automatique** | Quotidienne sur serveur local |
| **Réplication** | Miroir sur 2 supports physiques différents |
| **Sauvegarde distante** | Sync vers cloud (Goma/Kinshasa) |
| **Plan de reprise** | Procédure de restauration documentée |

---

## Interopérabilité et Standards

### Standards de données

| Standard | Usage | Niveau |
|----------|-------|--------|
| **HL7 FHIR** | Échange de données de santé | International |
| **HL7 v2** | Messages d'interopérabilité | International |
| **OMOP CDM** | Modèle de données observationnel | International |
| **CIM-10** | Classification des maladies | OMS |
| **PDF/A** | Archivage longue durée | ISO 19005 |

### Intégration externe

| Système | Type | Direction |
|---------|------|-----------|
| **DHIS2** | Reporting national (SNIS) | Export automatique |
| **Ministère de la Santé** | Rapports épidémiologiques | Export mensuel |
| **Hôpitaux de référence** | Contre-référence | Bidirectionnel |
| **Pharmacies centrales** | Gestion des stocks | Import/Export |

---

## Structure du Projet

```
Dhayaro/
├── src/
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── patients/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── consultations/
│   │   │   │   └── page.tsx
│   │   │   ├── diagnostics/
│   │   │   │   └── page.tsx
│   │   │   ├── diseases/
│   │   │   │   └── page.tsx
│   │   │   ├── protocols/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── treatments/
│   │   │   │   └── page.tsx
│   │   │   ├── laboratory/
│   │   │   │   ├── page.tsx
│   │   │   │   └── results/
│   │   │   │       └── page.tsx
│   │   │   ├── queue/
│   │   │   │   └── page.tsx
│   │   │   ├── documents/
│   │   │   │   └── page.tsx
│   │   │   ├── archives/
│   │   │   │   └── page.tsx
│   │   │   ├── notifications/
│   │   │   │   └── page.tsx
│   │   │   ├── reports/
│   │   │   │   ├── page.tsx
│   │   │   │   └── snis/
│   │   │   │       └── page.tsx
│   │   │   ├── users/
│   │   │   │   └── page.tsx
│   │   │   ├── facilities/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   ├── audit/
│   │   │   │   └── page.tsx
│   │   │   └── profile/
│   │   │       └── page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── forgot-password/
│   │   │       └── page.tsx
│   │   └── api/v1/
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── register/route.ts
│   │       │   └── refresh/route.ts
│   │       ├── patients/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── consultations/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── diagnostics/
│   │       ├── diseases/
│   │       ├── protocols/
│   │       ├── treatments/
│   │       ├── laboratory/
│   │       ├── queue/
│   │       ├── documents/
│   │       ├── archives/
│   │       ├── notifications/
│   │       ├── users/
│   │       ├── facilities/
│   │       ├── audit/
│   │       ├── sync/
│   │       │   └── route.ts
│   │       └── reports/
│   │           └── snis/route.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── layout.tsx
│   │   └── charts/
│   │       └── recharts-chart.tsx
│   ├── views/
│   │   ├── dashboard-view.tsx
│   │   ├── patients-view.tsx
│   │   ├── consultations-view.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── use-data.ts
│   │   ├── use-toast.ts
│   │   └── use-sync.ts
│   ├── store/
│   │   ├── index.ts
│   │   └── auth-store.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── sync-engine.ts
│   │   └── offline-storage.ts
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── db.ts
│   │   ├── auth.ts
│   │   └── seed.ts
│   └── types/
│       └── index.ts
├── public/
│   ├── favicon.ico
│   └── ...
├── drizzle/
│   ├── 0000_initial.sql
│   └── ...
├── .dockerop/
├── .opencode/
├── scripts/
│   ├── migrate-patient-portal.mjs
│   └── seed-standalone.mjs
├── docker-compose.edge.yml
├── Dockerfile
├── .env
├── .env.local
├── drizzle.config.ts
├── next.config.ts
├── package.json
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.js
├── vercel.json
├── AGENTS.md
└── README.md
```

---

## Déploiement

### Mode Cloud (Vercel) — Développement/Démonstration

```bash
# Frontend + Backend serverless
vercel deploy

# Variables de production :
# DATABASE_URL → PostgreSQL Neon
# JWT_SECRET → Clé forte
# NEXT_PUBLIC_API_URL → URL Vercel
```

### Mode Edge (Alimbongo) — Production

```bash
# 1. Préparer le Raspberry Pi 5
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. Cloner et configurer
git clone https://github.com/Wabtechs/Dhayaro.git
cd Dhayaro
cp .env.example .env
# Éditer .env avec les paramètres locaux

# 3. Lancer
docker compose -f docker-compose.edge.yml up -d

# 4. Vérifier
docker compose ps
docker compose logs -f dhayaro

# 5. Configurer le Wi-Fi local
# Le serveur crée un point d'accès Wi-Fi pour les tablettes
```

### Mode Hybride (Recommandé)

```
┌──────────────────────────────────────────────────────────┐
│                    MODE HYBRIDE                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Alimbongo (Edge)              Cloud (Vercel/Neon)       │
│  ┌────────────────┐           ┌────────────────┐         │
│  │ Serveur local  │ ◄──sync──►│ PostgreSQL     │         │
│  │ Docker         │           │ Neon           │         │
│  │ CouchDB        │           │                │         │
│  │ Nextcloud      │           │                │         │
│  └────────────────┘           └────────────────┘         │
│         │                              │                 │
│         │                              │                 │
│  ┌──────▼──────┐              ┌────────▼────────┐        │
│  │ Tablettes   │              │ Développeurs    │        │
│  │ (Wi-Fi)     │              │ (Internet)      │        │
│  └─────────────┘              └─────────────────┘        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Cadre Légal et Éthique

### Secret Médical

- Toutes les données patients sont **chiffrées** (AES-256)
- Accès **restreint** par rôle et par habilitation
- **Audit trail** complet de toutes les consultations
- Respect de la **confidentialité** selon la loi congolaise

### Protection des Données

- Conformité aux **normes internationales** (HL7, FHIR)
- **Consentement** du patient pour le traitement des données
- Droit d'**accès** et de **rectification**
- Politique de **rétention** et de **destruction** des données

### Standards Éthiques

- Respect des **protocoles OMS** pour les soins
- **Transparence** dans l'aide à la décision
- **Non-discrimination** dans l'accès aux soins
- **Traçabilité** de toutes les actions médicales

---

## Roadmap

### Phase 1 — Fondations (✓ Terminé)
- [x] Architecture Offline-First
- [x] Gestion des patients (CRUD, dossier médical, historique)
- [x] Consultations (motif, symptômes, signes vitaux)
- [x] Diagnostics avec classification CIM-10
- [x] Authentification JWT + RBAC (11 rôles)
- [x] Tableau de bord avec graphiques Recharts
- [x] File d'attente temps réel
- [x] Génération de documents PDF
- [x] Notifications temps réel
- [x] Multi-établissements

### Phase 2 — Fonctionnalités Médicales (✓ Terminé)
- [x] Protocoles de soins interactifs (arbres décisionnels)
- [x] Intégration CIM-10 complète (12 maladies de base)
- [x] Module laboratoire (examens, catégories, validation)
- [x] Gestion des traitements et prescriptions
- [x] Épisodes de soins (parcours patient global)
- [x] Cas cliniques (suivi de bout en bout)
- [x] Base de connaissances cliniques anonymisée
- [x] Recherche de cas similaires

### Phase 3 — Résilience (En cours)
- [x] Synchronisation Edge ↔ Cloud (sync queue)
- [x] Mode hors-ligne (données locales)
- [x] Archivage PDF/A
- [x] Sauvegarde redondante
- [ ] Tests de résilience en conditions réelles

### Phase 4 — Déploiement (En cours)
- [x] Docker Compose pour Edge
- [x] Configuration multi-environnements
- [ ] Configuration solaire
- [ ] Formation du personnel
- [ ] Déploiement à Alimbongo

### Phase 5 — Extension (À venir)
- [ ] Intégration DHIS2 (SNIS) complète
- [ ] Application mobile native
- [ ] Télémédecine
- [ ] Interopérabilité HL7 FHIR
- [ ] Dashboard patient avancé

---

## Contribution

Les contributions sont les bienvenues ! Veuillez consulter le fichier [CONTRIBUTING.md](CONTRIBUTING.md) pour les guidelines.

```bash
# Fork le projet
# Créer une branche
git checkout -b feature/nouvelle-fonctionnalité

# Committer
git commit -m "feat: ajout de la nouvelle fonctionnalité"

# Push
git push origin feature/nouvelle-fonctionnalité

# Créer une Pull Request
```

---

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## Contact

| | |
|---|---|
| **Auteur** | Wabtechs |
| **GitHub** | [github.com/Wabtechs/Dhayaro](https://github.com/Wabtechs/Dhayaro) |
| **Email** | wabtechs@proton.me |

---

<div align="center">

**Dhayaro** — Écosystème numérique résilient pour la Zone de Santé d'Alimbongo/Nord-Kivu, RDC

*Mémoire de fin d'études — ISTA/Kinshasa, Institut Supérieur des Techniques Appliquées, Département d'Informatique, 2026*

---

*"Prouver que l'on peut avoir un hôpital moderne et numérisé, même au fin fond d'une zone rurale enclavée."*

</div>
