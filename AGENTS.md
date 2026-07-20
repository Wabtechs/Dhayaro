# Dhayaro - Project Conventions

## Overview
Medical PWA for clinical case management in DR Congo hospitals. Offline-first, French UI.

## Tech Stack
- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui (Radix primitives)
- **State:** Zustand (global + auth) + TanStack Query v5 (server state)
- **Database:** PostgreSQL Neon (prod) via Drizzle ORM
- **Deploy:** Vercel (frontend static + API routes as serverless functions)
- **Language:** UI in French, code/comments in English

## Architecture
```
src/
  app/
    (app)/          → authenticated route groups (dashboard/, patients/, etc.)
    (auth)/         → public routes (login/, forgot-password/)
    api/v1/         → Next.js API routes (33 endpoints)
    providers.tsx   → QueryClient + TooltipProvider + Toaster
  views/            → page-level components (one per route)
  components/
    ui/             → shadcn/ui primitives (badge, button, card, dialog, etc.)
    layout/         → app-shell, sidebar, header, command-palette
  hooks/
    use-data.ts     → all TanStack Query hooks + transformKeys
    use-toast.ts    → toast notifications
    use-permissions.ts → RBAC permission checks
  store/
    index.ts        → Zustand app store (sidebar, darkMode, notifications)
    auth-store.ts   → Zustand auth store (user, token, login/logout)
  services/
    api.ts          → ApiClient class (auto token refresh on 401)
  lib/
    auth.ts         → JWT create/verify, password hash, requireAuth/requireRole
    db.ts           → Neon connection singleton (getDb, getSql)
    schema.ts       → Drizzle table definitions (17 tables)
    seed.ts         → seed data (auto-seeded if DB empty)
    validation.ts   → sanitizeUuid, sanitizeSearch
    api-errors.ts   → apiError, logError, parsePagination
    rate-limit.ts   → in-memory IP rate limiter
    utils.ts        → cn(), formatDate(), formatDateTime()
  types/
    index.ts        → shared TypeScript interfaces
```

## Code Conventions
- **No comments** unless explicitly asked
- **TypeScript strict** — `ignoreBuildErrors` removed from next.config.ts
- **API snake_case → frontend camelCase** — `transformKeys()` in `use-data.ts` handles conversion
- **Token key:** `dhayaro_token` (localStorage + cookie)
- **Refresh token:** `dhayaro_refresh_token` (localStorage)
- **API base:** `/api/v1` (prod + dev via Next.js API routes)
- **Dark mode:** Zustand `useAppStore` + `.dark` class on `<html>`
- **Auth flow:** login → JWT access_token + refresh_token → auto-refresh on 401
- **Role casing:** API stores UPPERCASE (`ADMIN`, `DOCTOR`), frontend uses lowercase (`admin`, `doctor`) — ROLE_MAP in use-data.ts
- **DB schema:** UUID PKs, `created_at`/`updated_at`, `is_active` soft-delete
- **Seed data:** auto-seeded on first request if DB empty (in `seed.ts`)
- **Naming:** files `kebab-case`, components `PascalCase`, API routes `snake_case`
- **Zustand selectors:** always use `useStore((s) => s.field)`, never destructure entire store

## Key Patterns
- **Mock fallback removed** — all hooks fetch from real API only
- **No dynamic imports** — Next.js App Router handles per-route code splitting
- **Notifications:** fetched from API with 30s staleTime + 60s refetch interval
- **Rate limiting:** in-memory per-IP (works in dev, not in Vercel serverless)
- **Password hashing:** bcrypt with 12 rounds

## Testing Accounts
| Role | Email | Password |
|---|---|---|
| Admin | admin@dhayaro.cd | admin123 |
| Super Admin | superadmin@dhayaro.cd | admin123 |
| Doctor | dr.kabongo@dhayaro.cd | doctor123 |
| Nurse | nurse.mohamed@dhayaro.cd | nurse123 |
| Other roles | see login page | dhayaro123 |
