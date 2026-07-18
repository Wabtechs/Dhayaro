<div align="center">

# Dhayaro

### Écosystème Numérique Résilient pour la Gestion Hospitalière

**Offline-First | Edge Computing | Résilient | PWA**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)](https://typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://postgresql.org)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-009688)](https://orm.drizzle.team)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## Table des Matières

1. [Contexte Académique](#contexte-académique)
2. [Aperçu du Projet](#aperçu-du-projet)
3. [Résilience et Edge Computing](#résilience-et-edge-computing)
4. [Architecture](#architecture)
5. [Stack Technique](#stack-technique)
6. [Installation](#installation)
7. [Configuration](#configuration)
8. [Modules](#modules)
9. [Rôles et Permissions](#rôles-et-permissions)
10. [Sécurité](#sécurité)
11. [Structure du Projet](#structure-du-projet)
12. [Déploiement](#déploiement)

---

## Contexte Académique

Ce projet est réalisé dans le cadre du mémoire de fin d'études :

> **« Modélisation et implémentation d'un écosystème numérique résilient pour la gestion hospitalière et l'archivage pérenne des protocoles de soins en zones décentralisées. Cas de la Zone de Santé d'Alimbongo/Nord-Kivu »**

**Université** : Université de Bukavu — Faculté des Sciences Appliquées, Département d'Informatique

**Problématique** : Comment concevoir et implémenter un écosystème numérique qui soit à la fois performant pour la gestion hospitalière et assez résilient pour survivre aux contraintes techniques d'une zone décentralisée comme Alimbongo ?

**Hypothèse** : Un écosystème numérique hybride (Offline-first), fonctionnant sur des infrastructures à basse consommation énergétique et intégrant des protocoles de soins interactifs, permettrait de garantir la continuité du service et la pérennité des archives médicales, indépendamment des aléas de connexion et d'énergie.

---

## Aperçu du Projet

**Dhayaro** est une plateforme hospitalière résiliente conçue pour les zones de santé décentralisées de la RDC, notamment la Zone de Santé d'Alimbongo dans la province du Nord-Kivu. Elle permet de :

- **Gérer les patients** : dossier médical complet, contacts, assurance, antécédents
- **Suivre les consultations** : motif, symptômes, signes vitaux, diagnostics
- **Administrer les traitements** : prescriptions, posologie, suivi
- **Gérer le laboratoire** : demandes d'examens, résultats, validation
- **Digitaliser les protocoles de soins** : arbres décisionnels interactifs, aide à la décision clinique
- **Organiser la file d'attente** : workflow complet en temps réel
- **Générer des documents** : ordonnances, certificats, rapports médicaux (PDF)
- **Générer les rapports SNIS** : automatisation des rapports mensuels pour le Bureau Central de la Zone
- **Archiver pérennement** : formats PDF/A, sauvegardes redondantes, réplication

### Modules Fonctionnels

| Module | Description |
|--------|-------------|
| **Patients** | Inscription, modification, recherche, dossier médical complet |
| **Consultations** | Motif, symptômes, signes vitaux, notes, diagnostic provisoire |
| **Diagnostics** | Diagnostic principal/secondaires, validation, historique |
| **Maladies** | CRUD, classification CIM-10, symptômes, complications |
| **Protocoles de Soins** | Arbres décisionnels interactifs, aide à la décision, alertes |
| **Traitements** | Prescription, médicaments, posologie, suivi, évolution |
| **Laboratoire** | Demandes d'examens, catégories, résultats, validation |
| **File d'attente** | Workflow : Réception → Médecin → Labo → Traitement → Fin |
| **Documents** | Ordonnances, certificats, rapports, export PDF |
| **Archives** | Archivage pérenne (PDF/A), réplication redondante |
| **Tableau de bord** | Widgets, graphiques, statistiques SNIS en temps réel |
| **Notifications** | Système de notifications temps réel |
| **Rapports** | PDF, Excel, rapports SNIS avec filtres avancés |
| **Auth/RBAC** | 10 rôles avec permissions granulaires |
| **Synchronisation** | Sync intermittente Edge → Cloud, file d'attente locale |

---

## Résilience et Edge Computing

### Architecture Offline-First

Le système est conçu pour fonctionner **sans connexion internet**. Les données sont stockées localement sur un serveur Edge et synchronisées avec le cloud provincial/national dès qu'une connexion est disponible.

### Niveaux de résilience

```
┌─────────────────────────────────────────────────────────┐
│  Cloud Provincial (Goma/Kinshasa)                       │
│  → Backup de sécurité, consolidation SNIS (DHIS2)      │
├─────────────────────────────────────────────────────────┤
│  Gateway (Routeur 4G/LTE ou VSAT)                      │
│  → Synchronisation intermittente, tunnel VPN sécurisé   │
├─────────────────────────────────────────────────────────┤
│  Nœud Local — Edge Computing (Alimbongo)                │
│  → Raspberry Pi 5 / Intel NUC                           │
│  → Docker : OpenMRS + Nextcloud + CouchDB               │
│  → Alimentation solaire + batterie (48h autonomie)      │
├─────────────────────────────────────────────────────────┤
│  Points de Soin (Tablettes / Smartphones)               │
│  → Client léger (navigateur) + Wi-Fi local sécurisé    │
│  → Saisie hors-ligne, consultation protocoles           │
└─────────────────────────────────────────────────────────┘
```

### Flux en mode dégradé (sans internet)

1. L'infirmier saisit les données sur sa tablette
2. La donnée est enregistrée dans le serveur local (instantané)
3. Le serveur tente de joindre le serveur central
4. Si échec → la donnée est mise en file d'attente (Queue)
5. Dès retour du réseau → synchronisation automatique via VPN

### Résilience énergétique

- Serveurs à basse consommation (Raspberry Pi 5, Intel NUC)
- Alimentation hybride solaire + batterie (autonomie 48h minimum)
- Optimisation Green IT pour réduire la consommation

### Archivage pérenne

- Formats standards ouverts (PDF/A, XML) pour une lisibilité à long terme
- Réplication redondante sur deux supports physiques différents
- Stockage immuable pour garantir l'intégrité des données

---

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── (app)/             # Pages authentifiées
│   ├── (auth)/            # Pages d'authentification
│   └── api/v1/            # API Routes
├── components/
│   ├── ui/                # Composants shadcn/ui
│   ├── layout/            # Sidebar, Header, Layout
│   └── charts/            # Composants Recharts
├── views/                 # Composants pages
├── hooks/                 # Custom hooks React
├── store/                 # Zustand stores
├── services/              # API client + sync engine
├── lib/                   # Utils, schema DB, auth, seed
└── types/                 # TypeScript types
```

---

## Stack Technique

| Technologie | Version | Usage |
|-------------|---------|-------|
| React | 19 | UI Library |
| Next.js | 15 | Framework full-stack |
| TypeScript | 6 | Typage strict |
| TailwindCSS | 4 | Styling |
| shadcn/ui | - | Composants UI (Radix) |
| Drizzle ORM | 0.44 | ORM PostgreSQL |
| Neon | - | PostgreSQL serverless |
| Zustand | 5 | Client state |
| TanStack Query | 5 | Server state + sync |
| Recharts | 2 | Graphiques |
| jose | 6 | JWT tokens |
| bcryptjs | 3 | Hachage mots de passe |
| CouchDB | - | Base locale Edge (sync) |
| Docker | - | Conteneurisation Edge |
| Nextcloud | - | Archivage protocoles PDF/A |

---

## Installation

```bash
# Cloner
git clone https://github.com/Wabtechs/Dhayaro.git
cd Dhayaro

# Installer
npm install

# Configurer
cp .env.example .env  # ou éditer .env directement

# Seed la base
npm run db:push
npm run db:seed

# Lancer en développement
npm run dev
```

---

## Configuration

### Variables d'environnement (`.env`)

```env
DATABASE_URL=postgresql://...
JWT_SECRET=votre-cle-secrete
NEXT_PUBLIC_API_URL=
```

### Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@dhayaro.cd | admin123 |
| Médecin | dr.kabongo@dhayaro.cd | doctor123 |
| Chercheur | researcher@dhayaro.cd | researcher123 |

---

## Modules

### 1. Gestion des Patients
Enregistrement, modification, suppression logique, recherche, photo, adresse, contacts, personne à prévenir, assurance, groupe sanguin, allergies, antécédents, historique médical complet, archivage.

### 2. Consultations
Consultation complète : motif, symptômes, signes vitaux, notes, diagnostic provisoire, historique.

### 3. Diagnostics
Diagnostic principal, diagnostics secondaires, historique, validation, médecin responsable.

### 4. Maladies
CRUD complet, classification CIM-10, symptômes, complications, historique.

### 5. Protocoles de Soins
Arbres décisionnels interactifs, intégration des guides OMS/Ministère, alertes si non-conformité, aide à la décision en temps réel pour le personnel soignant.

### 6. Traitements
Prescription, médicaments, posologie, durée, historique, suivi, évolution.

### 7. Laboratoire
Demande d'examen, catégories, résultats, validation, historique, impression.

### 8. File d'attente
Workflow : Réception → Salle d'attente → Médecin → Laboratoire → Retour médecin → Traitement → Fin. Statut en temps réel.

### 9. Documents médicaux
Génération PDF, impression, export : consultations, diagnostics, ordonnances, prescriptions, résultats, certificats, rapports médicaux.

### 10. Tableau de bord
Widgets : patients, consultations, laboratoire, diagnostics, maladies, activité, utilisateurs, file d'attente. Graphiques interactifs. Rapports SNIS automatisés.

### 11. Notifications
Temps réel : nouveau patient, diagnostic, résultats, ordonnance, consultation terminée.

### 12. Rapports
PDF et Excel : patients, médecins, consultations, maladies, laboratoire, activités, utilisateurs, traitements. Rapports SNIS mensuels. Filtres : date, médecin, patient, maladie.

### 13. Archives
Archivage pérenne de toutes les entités en format PDF/A. Réplication redondante. Recherche rapide.

### 14. Authentification et RBAC
10 rôles avec permissions granulaires, routes protégées, API protégées.

### 15. Synchronisation
Sync intermittente entre serveur Edge local et cloud. Gestion des conflits. File d'attente locale en mode dégradé.

---

## Rôles et Permissions

| Rôle | Description |
|------|-------------|
| **Super Admin** | Contrôle total du système |
| **Admin** | Administration de l'établissement |
| **Réceptionniste** | Accueil, enregistrement patients |
| **Médecin Généraliste** | Consultations, diagnostics, traitements |
| **Médecin Spécialiste** | Consultations spécialisées |
| **Laborantin** | Examens de laboratoire |
| **Pharmacien** | Gestion des médicaments |
| **Infirmier** | Soins, suivi patients |
| **Comptable** | Facturation, rapports financiers |
| **Archiviste** | Gestion des archives pérennes |

---

## Sécurité

- JWT sécurisé avec refresh token
- Validation Zod (frontend + backend)
- Protection CSRF
- Rate Limiting
- Audit Log complet
- Protection XSS et SQL Injection
- Permissions granulaires par rôle
- Chiffrement des données médicales (secret médical)
- Sauvegardes redondantes (miroir)

---

## Structure du Projet

```
Dhayaro/
├── src/
│   ├── app/
│   │   ├── (app)/              # Pages authentifiées
│   │   │   ├── dashboard/
│   │   │   ├── patients/
│   │   │   ├── consultations/
│   │   │   ├── diagnostics/
│   │   │   ├── diseases/
│   │   │   ├── protocols/      # Protocoles de soins
│   │   │   ├── treatments/
│   │   │   ├── laboratory/
│   │   │   ├── queue/
│   │   │   ├── documents/
│   │   │   ├── archives/
│   │   │   ├── notifications/
│   │   │   ├── reports/
│   │   │   ├── users/
│   │   │   ├── facilities/
│   │   │   ├── settings/
│   │   │   ├── audit/
│   │   │   └── profile/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── forgot-password/
│   │   └── api/v1/             # API Routes
│   │       ├── auth/
│   │       ├── patients/
│   │       ├── consultations/
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
│   │       ├── sync/           # Endpoint de synchronisation
│   │       └── reports/
│   ├── components/
│   ├── views/
│   ├── hooks/
│   ├── store/
│   ├── services/
│   │   └── sync-engine.ts      # Moteur de synchronisation
│   ├── lib/
│   └── types/
├── public/
├── drizzle/
└── package.json
```

---

## Déploiement

### Mode Cloud (Vercel)

```bash
# Le projet est prêt pour Vercel
# Frontend : Next.js static
# Backend : Next.js API Routes (serverless)
vercel deploy
```

### Mode Edge (Alimbongo)

```bash
# Déploiement sur serveur local (Raspberry Pi 5 / Intel NUC)
docker compose up -d

# Alimentation : système solaire + batterie (48h autonomie)
# Connexion : Wi-Fi local + synchronisation intermittente 4G/VSAT
```

### Variables de production

1. `DATABASE_URL` → PostgreSQL Neon de production
2. `JWT_SECRET` → Clé forte et unique
3. `NEXT_PUBLIC_API_URL` → URL de production

---

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

<div align="center">

**Dhayaro** — Écosystème numérique résilient pour la Zone de Santé d'Alimbongo/Nord-Kivu, RDC

*Mémoire de fin d'études — Université de Bukavu, FSA, 2026*

</div>
