<div align="center">

# MedInsight

### Plateforme de Gestion de Cas Cliniques Médicaux

**Offline-First | Multi-Tenant | RBAC | PWA**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)](https://typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-24-2496ED?logo=docker)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## Table des Matières

1. [Aperçu du Projet](#aperçu-du-projet)
2. [Architecture](#architecture)
3. [Stack Technique](#stack-technique)
4. [Prérequis](#prérequis)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [Utilisation](#utilisation)
8. [API Endpoints](#api-endpoints)
9. [Rôles et Permissions](#rôles-et-permissions)
10. [Mode Offline-First](#mode-offline-first)
11. [Structure du Projet](#structure-du-projet)
12. [Tests](#tests)
13. [Déploiement](#déploiement)
14. [Contribuer](#contribuer)

---

## Aperçu du Projet

**MedInsight** est une plateforme SaaS médicale conçue pour les hôpitaux, centres de santé et chercheurs. Elle permet de :

- **Documenter des cas cliniques** : symptômes, diagnostics, traitements et résultats
- **Identifier les traitements efficaces** et analyser les échecs thérapeutiques
- **Constituer une base de connaissances médicale collective**
- **Fonctionner en mode Offline-First** même sans connexion internet
- **Synchroniser automatiquement** les données dès que le réseau est rétabli

### Fonctionnalités MVP (Sprints 1 & 2)

| Sprint | Fonctionnalités |
|--------|----------------|
| **Sprint 1** | Authentification JWT, RBAC, PostgreSQL, API REST sécurisées, gestion des utilisateurs, établissements, audit logs |
| **Sprint 2** | PWA, IndexedDB/RxDB, cas cliniques, moteur de synchronisation Offline/Online, gestion des conflits, sync bidirectionnelle |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │   Pages   │  │Components│  │ Services │  │  Store  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │  Hooks   │  │ Routes   │  │  Sync Engine (IDB)   │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ REST API + JWT
┌────────────────────────┴────────────────────────────────┐
│                    Backend (FastAPI)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │   Auth   │  │  Routes  │  │   Repository Layer   │  │
│  │  (JWT)   │  │  (API)   │  │   (SQLAlchemy 2.0)   │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │  Domain  │  │  Config  │  │   Infrastructure     │  │
│  │  Models  │  │          │  │   (Security, DB)     │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│                    PostgreSQL 16                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ Facilities│  │  Users   │  │  Clinical Cases      │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ Patients │  │Audit Logs│  │    Sync Queue        │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Clean Architecture (Backend)

```
backend/app/
├── domain/          # Entités métier, enums, règles
├── application/     # Schémas Pydantic, exceptions
├── infrastructure/  # Sécurité, repositories, accès DB
└── presentation/    # Routes FastAPI, endpoints REST
```

---

## Stack Technique

### Frontend
| Technologie | Version | Usage |
|-------------|---------|-------|
| React | 19 | UI Library |
| TypeScript | 6 | Typage strict |
| Vite | 8 | Build tool |
| TailwindCSS | 4 | Styling |
| shadcn/ui | - | Composants UI |
| React Router | 7 | Routage SPA |
| TanStack Query | 5 | Server state |
| Zustand | 5 | Client state |
| Recharts | 2 | Graphiques |
| Lucide React | - | Icônes |
| cmdk | - | Command palette |

### Backend
| Technologie | Version | Usage |
|-------------|---------|-------|
| Python | 3.12 | Runtime |
| FastAPI | 0.115 | Framework web |
| SQLAlchemy | 2.0 | ORM async |
| Alembic | 1.14 | Migrations DB |
| Pydantic | 2.9 | Validation DTO |
| python-jose | 3.3 | JWT tokens |
| passlib[argon2] | 1.7 | Hachage mots de passe |
| slowapi | 0.1 | Rate limiting |

### Infrastructure
| Technologie | Version | Usage |
|-------------|---------|-------|
| PostgreSQL | 16 | Base de données |
| Docker | 24 | Conteneurisation |
| Docker Compose | 3.8 | Orchestration |

---

## Prérequis

- **Node.js** >= 20.x
- **Python** >= 3.12
- **Docker** >= 24.x
- **Docker Compose** >= 2.x
- **Git**

---

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/Wabtechs/medinsight.git
cd medinsight
```

### 2. Installation avec Docker (Recommandé)

```bash
# Lancer tous les services (PostgreSQL + Backend + Frontend)
docker compose up -d

# Vérifier que tout fonctionne
docker compose ps
```

Les services seront disponibles sur :
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:8000
- **API Documentation** : http://localhost:8000/docs
- **PostgreSQL** : localhost:5432

### 3. Installation Manuelle (Développement)

#### Backend

```bash
cd backend

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Installer les dépendances
pip install -r requirements.txt

# Configurer la base de données
# Assurez-vous que PostgreSQL est lancé, puis :
alembic upgrade head

# Peupler la base avec des données de démo
python seed.py

# Lancer le serveur
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
# Depuis la racine du projet
npm install

# Lancer en mode développement
npm run dev
```

---

## Configuration

### Variables d'environnement Backend (`backend/.env`)

```env
DATABASE_URL=postgresql+asyncpg://medinsight:medinsight_secret@localhost:5432/medinsight
SYNC_DATABASE_URL=postgresql+sync://medinsight:medinsight_secret@localhost:5432/medinsight
SECRET_KEY=votre-cle-secrete-en-production
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### Variables d'environnement Frontend

Créez un fichier `frontend/.env` :

```env
VITE_API_URL=http://localhost:8000/api/v1
```

---

## Utilisation

### Comptes de Démonstration

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@medinsight.cd | admin123 |
| Médecin | dr.kabongo@medinsight.cd | doctor123 |
| Chercheur | researcher@medinsight.cd | researcher123 |

### Connexion

1. Ouvrez http://localhost:5173
2. Entrez les identifiants d'un des comptes ci-dessus
3. Vous serez redirigé vers le tableau de bord

### Créer un Cas Clinique (Mode Offline)

1. Connectez-vous en tant que Médecin
2. Allez dans **Cas Cliniques** > **Nouveau Cas**
3. Remplissez le formulaire (patient, symptômes, diagnostic, traitement)
4. Si vous êtes **hors ligne**, les données seront sauvegardées localement
5. Lorsque la connexion est rétablie, la synchronisation est automatique

### Command Palette

Appuyez sur **Ctrl+K** (ou **Cmd+K** sur Mac) pour ouvrir la palette de commandes et naviguer rapidement.

---

## API Endpoints

### Authentification

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/api/v1/auth/login` | Connexion | Non |
| POST | `/api/v1/auth/refresh` | Rafraîchir le token | Refresh Token |
| GET | `/api/v1/auth/me` | Profil utilisateur | JWT |

### Utilisateurs

| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| GET | `/api/v1/users` | Liste des utilisateurs | Admin |
| POST | `/api/v1/users` | Créer un utilisateur | Admin |
| GET | `/api/v1/users/{id}` | Détail utilisateur | Admin |
| PUT | `/api/v1/users/{id}` | Modifier | Admin |
| DELETE | `/api/v1/users/{id}` | Désactiver | Admin |

### Établissements

| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| GET | `/api/v1/facilities` | Liste | Tous |
| POST | `/api/v1/facilities` | Créer | Admin |
| GET | `/api/v1/facilities/{id}` | Détail + stats | Tous |
| PUT | `/api/v1/facilities/{id}` | Modifier | Admin |
| DELETE | `/api/v1/facilities/{id}` | Désactiver | Admin |

### Patients

| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| GET | `/api/v1/patients` | Liste (scoped) | Tous |
| POST | `/api/v1/patients` | Créer | Doctor, Admin |
| GET | `/api/v1/patients/{id}` | Détail | Tous |
| PUT | `/api/v1/patients/{id}` | Modifier | Doctor, Admin |
| DELETE | `/api/v1/patients/{id}` | Désactiver | Admin |

### Cas Cliniques

| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| GET | `/api/v1/clinical-cases` | Liste (avec filtres) | Tous |
| POST | `/api/v1/clinical-cases` | Créer | Doctor |
| GET | `/api/v1/clinical-cases/{id}` | Détail complet | Tous |
| PUT | `/api/v1/clinical-cases/{id}` | Modifier | Doctor |
| DELETE | `/api/v1/clinical-cases/{id}` | Archiver | Doctor, Admin |
| GET | `/api/v1/clinical-cases/stats` | Statistiques | Tous |

### Audit Logs

| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| GET | `/api/v1/audit` | Journal d'audit | Admin |
| GET | `/api/v1/audit/stats` | Statistiques | Admin |

### Synchronisation

| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| POST | `/api/v1/sync/push` | Pousser les modifications locales | Tous |
| GET | `/api/v1/sync/pull` | Tirer les modifications serveur | Tous |
| POST | `/api/v1/sync/resolve` | Résoudre un conflit | Tous |

---

## Rôles et Permissions

| Rôle | Description | Permissions |
|------|-------------|-------------|
| **ADMIN** | Administrateur système | CRUD complet, tous les établissements, audit logs |
| **DOCTOR** | Médecin praticien | Créer/modifier patients et cas cliniques, son établissement |
| **RESEARCHER** | Chercheur médical | Lecture seule, données anonymisées uniquement |

### Isolation Multi-Tenant

Chaque utilisateur est associé à un établissement. Les données sont automatiquement filtrées par établissement sauf pour les administrateurs globaux.

---

## Mode Offline-First

### Fonctionnement

```
┌─────────────────────────────────────────────┐
│           Appareil (Frontend)                │
│                                              │
│  1. Utilisateur crée/modifie un cas          │
│  2. Données sauvegardées dans IndexedDB      │
│  3. Opération ajoutée à la file de sync      │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │        Sync Engine (Service Worker)      │ │
│  │  - Détecte la connexion réseau          │ │
│  │  - Envoie les modifications en attente   │ │
│  │  - Résout les conflits (Last Write Wins) │ │
│  │  - Nettoie la file après confirmation    │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
                    │
                    ▼ (quand en ligne)
┌─────────────────────────────────────────────┐
│           Backend (FastAPI)                  │
│  1. Reçoit les modifications                │
│  2. Valide et applique à PostgreSQL          │
│  3. Retourne la confirmation                │
│  4. Gère les conflits si nécessaire         │
└─────────────────────────────────────────────┘
```

### Stratégie de Résolution des Conflits

- **Par défaut** : Last Write Wins (basé sur `updated_at`)
- **Futur** : Moteur de résolution avancé avec merged fields

### Collections IndexedDB

| Collection | Description |
|------------|-------------|
| `patients` | Données patients locales |
| `clinical_cases` | Cas cliniques locaux |
| `sync_queue` | File d'attente de synchronisation |
| `audit_logs` | Logs d'audit locaux |

---

## Structure du Projet

```
medinsight/
├── backend/                    # API FastAPI
│   ├── app/
│   │   ├── domain/            # Modèles SQLAlchemy, enums
│   │   ├── application/       # Schémas Pydantic, exceptions
│   │   ├── infrastructure/    # Sécurité, repositories
│   │   └── presentation/      # Routes API
│   ├── alembic/               # Migrations DB
│   ├── tests/                 # Tests unitaires
│   ├── Dockerfile
│   ├── requirements.txt
│   └── seed.py                # Données de démo
│
├── src/                        # Frontend React
│   ├── app/                   # Providers, App root
│   ├── components/
│   │   ├── ui/                # Composants shadcn/ui (20)
│   │   ├── layout/            # Sidebar, Header, Layout
│   │   └── charts/            # Composants Recharts
│   ├── pages/                 # 16 pages
│   │   ├── auth/              # Login, Forgot Password
│   │   ├── dashboard/         # Tableau de bord
│   │   ├── facilities/        # Gestion établissements
│   │   ├── users/             # Gestion utilisateurs
│   │   ├── patients/          # Gestion patients
│   │   ├── clinical-cases/    # Cas cliniques
│   │   ├── analytics/         # Statistiques
│   │   ├── research/          # Dashboard chercheurs
│   │   ├── settings/          # Paramètres
│   │   ├── profile/           # Profil utilisateur
│   │   ├── audit-log/         # Journal d'audit
│   │   ├── notifications/     # Notifications
│   │   ├── sync-center/       # Centre de synchronisation
│   │   └── treatment-history/ # Historique traitements
│   ├── services/              # API client, Sync engine
│   ├── hooks/                 # Custom hooks (sync, online)
│   ├── store/                 # Zustand stores
│   ├── routes/                # Route definitions
│   └── types/                 # TypeScript types
│
├── public/
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service Worker
│
├── docker-compose.yml
├── Dockerfile.frontend
└── README.md
```

---

## Tests

### Backend

```bash
cd backend

# Installer les dépendances de test
pip install -r requirements.txt

# Lancer les tests
pytest tests/ -v

# Avec couverture
pytest tests/ --cov=app --cov-report=html
```

### Frontend

```bash
# Lint
npm run lint

# Build de production
npm run build

# Vérifier la taille du bundle
npx vite-bundle-visualizer
```

---

## Déploiement

### Production avec Docker

```bash
# Build les images
docker compose -f docker-compose.yml build

# Lancer en production
docker compose -f docker-compose.yml up -d

# Voir les logs
docker compose logs -f
```

### Variables de Production

Assurez-vous de modifier :

1. `SECRET_KEY` dans `backend/.env` (clé forte et unique)
2. `DATABASE_URL` vers votre PostgreSQL de production
3. `CORS_ORIGINS` vers votre domaine de production
4. Les mots de passe par défaut

### Nginx (Recommandé)

```nginx
server {
    listen 80;
    server_name api.medinsight.cd;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name medinsight.cd;

    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
    }
}
```

---

## Contributions

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

---

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

<div align="center">

**MedInsight** - Construit avec passion pour la médecine et la technologie

[⬆ Retour en haut](#medinsight)

</div>
