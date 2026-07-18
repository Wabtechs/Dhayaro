# Dhayaro - Project Conventions

## Overview
Medical PWA for clinical case management in Algerian hospitals. Offline-first, French UI.

## Tech Stack
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui (Radix) + Zustand + TanStack Query
- **Backend:** FastAPI + SQLAlchemy 2 (async) + Alembic + Pydantic v2
- **Database:** PostgreSQL Neon (prod) / SQLite (dev local)
- **Deploy:** 100% Vercel (frontend static + backend serverless via `api/index.py`)
- **Language:** UI in French, code/comments in English

## Architecture
```
backend/
  app/
    domain/        → models.py (SQLAlchemy), enums.py
    application/   → schemas.py (Pydantic), exceptions.py
    infrastructure/→ security.py, repositories.py
    presentation/  → router_*.py (FastAPI endpoints)
    deps.py        → dependency injection
    database.py    → engine/session (SQLite + PostgreSQL)
    config.py      → pydantic Settings
    main.py        → FastAPI app + seed data
  alembic/         → migrations
  api/index.py     → Vercel serverless entry

src/
  components/ui/   → shadcn/ui primitives (badge, button, card, etc.)
  components/layout/ → sidebar, header, layout, command-palette
  components/charts/ → recharts-chart
  pages/           → route pages (dashboard, patients, clinical-cases, etc.)
  hooks/           → use-data.ts (React Query + mock fallback), use-toast, use-sync
  store/           → Zustand (index.ts global, auth-store.ts auth)
  services/        → api.ts (fetch wrapper), api-hooks.ts, sync-engine.ts
  lib/             → utils.ts, mock-data.ts
  types/           → index.ts (shared TypeScript interfaces)
```

## Code Conventions
- **No comments** unless explicitly asked
- **TypeScript strict** — always type API responses (avoid `unknown`)
- **Lazy loading** — all route pages use `React.lazy()`
- **Mock fallback** — all data hooks try backend first, fallback to mock data on error
- **Token key:** `dhayaro_token` (localStorage)
- **API base:** `/api/v1` (prod), `http://localhost:8000/api/v1` (dev auto-detected via `import.meta.env.DEV`)
- **Dark mode:** controlled by Zustand `useAppStore().darkMode`, synced with `.dark` class on `<html>`
- **Backend models:** UUID primary keys, `created_at`/`updated_at` with timezone, `is_active` soft-delete pattern
- **Seed data:** auto-seeded on startup if DB is empty (in `main.py lifespan`)
- **Vercel:** frontend in `dist/`, backend as Python serverless function at `api/index.py`
- **Naming:** files `kebab-case`, components `PascalCase`, backend routes `snake_case`
