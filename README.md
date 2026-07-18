<div align="center">

# Dhayaro

### Plateforme Hospitalière Intégrée

**Offline-First | Multi-Tenant | RBAC | PWA**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)](https://typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://postgresql.org)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-009688)](https://orm.drizzle.team)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## Table des Matières

1. [Aperçu du Projet](#aperçu-du-projet)
2. [Architecture](#architecture)
3. [Stack Technique](#stack-technique)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Modules](#modules)
7. [Rôles et Permissions](#rôles-et-permissions)
8. [Sécurité](#sécurité)
9. [Structure du Projet](#structure-du-projet)
10. [Déploiement](#déploiement)

---

## Aperçu du Projet

**Dhayaro** est une plateforme hospitalière moderne conçue pour les hôpitaux et cliniques d'Algérie. Elle permet de :

- **Gérer les patients** : dossier médical complet, contacts, assurance, antécédents
- **Suivre les consultations** : motif, symptômes, signes vitaux, diagnostics
- **Administrer les traitements** : prescriptions, posologie, suivi
- **Gérer le laboratoire** : demandes d'examens, résultats, validation
- **Organiser la file d'attente** : workflow complet en temps réel
- **Générer des documents** : ordonnances, certificats, rapports médicaux (PDF)
- **Analyser les données** : tableaux de bord, graphiques, rapports

### Modules Fonctionnels

| Module | Description |
|--------|-------------|
| **Patients** | Inscription, modification, recherche, dossier médical complet |
| **Consultations** | Motif, symptômes, signes vitaux, notes, diagnostic provisoire |
| **Diagnostics** | Diagnostic principal/secondaires, validation, historique |
| **Maladies** | CRUD, classification CIM-10, symptômes, complications |
| **Traitements** | Prescription, médicaments, posologie, suivi, évolution |
| **Laboratoire** | Demandes d'examens, catégories, résultats, validation |
| **File d'attente** | Workflow : Réception → Médecin → Labo → Traitement → Fin |
| **Documents** | Ordonnances, certificats, rapports, export PDF |
| **Archives** | Archivage automatique de tous les éléments |
| **Tableau de bord** | Widgets, graphiques, statistiques en temps réel |
| **Notifications** | Système de notifications temps réel |
| **Rapports** | PDF et Excel avec filtres avancés |
| **Auth/RBAC** | 10 rôles avec permissions granulaires |

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
├── services/              # API client
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
| TanStack Query | 5 | Server state |
| Recharts | 2 | Graphiques |
| jose | 6 | JWT tokens |
| bcryptjs | 3 | Hachage mots de passe |

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

### 5. Traitements
Prescription, médicaments, posologie, durée, historique, suivi, évolution.

### 6. Laboratoire
Demande d'examen, catégories, résultats, validation, historique, impression.

### 7. File d'attente
Workflow : Réception → Salle d'attente → Médecin → Laboratoire → Retour médecin → Traitement → Fin. Statut en temps réel.

### 8. Documents médicaux
Génération PDF, impression, export : consultations, diagnostics, ordonnances, prescriptions, résultats, certificats, rapports médicaux.

### 9. Tableau de bord
Widgets : patients, consultations, laboratoire, diagnostics, maladies, activité, utilisateurs, file d'attente. Graphiques interactifs.

### 10. Notifications
Temps réel : nouveau patient, diagnostic, résultats, ordonnance, consultation terminée.

### 11. Rapports
PDF et Excel : patients, médecins, consultations, maladies, laboratoire, activités, utilisateurs, traitements. Filtres : date, médecin, patient, maladie.

### 12. Archives
Archivage automatique de toutes les entités. Recherche rapide.

### 13. Authentification et RBAC
10 rôles avec permissions granulaires, routes protégées, API protégées.

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
| **Archiviste** | Gestion des archives |

---

## Sécurité

- JWT sécurisé avec refresh token
- Validation Zod (frontend + backend)
- Protection CSRF
- Rate Limiting
- Audit Log complet
- Protection XSS et SQL Injection
- Permissions granulaires par rôle

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
│   │       ├── treatments/
│   │       ├── laboratory/
│   │       ├── queue/
│   │       ├── documents/
│   │       ├── archives/
│   │       ├── notifications/
│   │       ├── users/
│   │       ├── facilities/
│   │       ├── audit/
│   │       └── reports/
│   ├── components/
│   ├── views/
│   ├── hooks/
│   ├── store/
│   ├── services/
│   ├── lib/
│   └── types/
├── public/
├── drizzle/
└── package.json
```

---

## Déploiement

### Vercel

```bash
# Le projet est prêt pour Vercel
# Frontend : Next.js static
# Backend : Next.js API Routes (serverless)
vercel deploy
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

**Dhayaro** - Plateforme hospitalière moderne pour l'Algérie

</div>
