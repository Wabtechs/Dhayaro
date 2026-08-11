# Rapport de Tests — Dhayaro

**Date :** 11 août 2026
**Version de l'application :** Next.js 15.5.20 / React 19 / TypeScript
**Base de données :** PostgreSQL (Neon) via Drizzle ORM
**Type de test :** Smoke test API + rendu des pages (environnement dev local)

---

## Résumé

| Métrique | Valeur |
|---|---|
| Endpoints API testés | 60+ |
| Pages testées | 50 |
| ✅ Succès | ~55 endpoints / 50 pages |
| ❌ Erreurs à corriger | 5 |
| ⚠️ Points de vigilance | 2 |

---

## Erreurs à corriger

### 1. CRITIQUE — Module billing : 500 sur tous les endpoints (tables manquantes)

**Endpoints concernés :**
- `GET /api/v1/billing-codes` → 500
- `GET /api/v1/invoices` → 500
- `GET /api/v1/payments` → 500

**Symptôme :** réponses `500` avec `{ success: false, message: "Une erreur inattendue s'est produite..." }` et log `Failed query: ... from "billing_codes"`.

**Cause racine (confirmée par requête `pg_tables`) :** les tables `billing_codes`, `invoices` et `payments` **n'existent pas** dans la base Neon. La migration `drizzle/0001_lean_phil_sheldon.sql` (qui crée ces tables + les types ENUM `billing_status`, `payment_method`, `payment_status`) n'a **jamais été appliquée** à la base.

**Correction :** appliquer la migration 0001 à la base Neon :
```bash
npx drizzle-kit migrate
```
ou exécuter manuellement le contenu de `drizzle/0001_lean_phil_sheldon.sql` sur la base.

---

### 2. ÉLEVÉ — Réponses d'erreur au format legacy `detail=` encore présentes

Plusieurs endpoints renvoient encore le format **legacy** `{ "detail": "..." }` au lieu du format structuré `{ success, message, code, errors, data }`. Le client (`src/services/api.ts`) gère le fallback, mais l'API est incohérente.

| Endpoint | Réponse actuelle |
|---|---|
| `DELETE /api/v1/patients/[id]` (succès) | `{ "detail": "Patient deleted" }` |
| `GET /api/v1/patients/[id]` (404) | `{ "detail": "Patient not found" }` |
| `GET /api/v1/patients/[id]` (UUID invalide) | `{ "detail": "ID invalide" }` |
| `POST /api/v1/sync/push` (payload invalide) | `{ "detail": "ids or all must be provided" }` |
| `POST /api/v1/auth/refresh` (sans refresh token) | `{ "detail": "Refresh token is required" }` |
| `POST /api/v1/notifications/read` (payload invalide) | `{ "detail": "ids array or all=true is required" }` |

**Correction :** remplacer les `apiError(400/404, ...)` et réponses `{ detail: ... }` de succès par le format structuré (`apiErrorResponse` / `handleEndpointError`), et les messages en français.

---

### 3. MOYEN — Messages de validation Zod en anglais

`POST /api/v1/patients` avec des champs invalides renvoie :
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "errors": {
    "firstname": "Invalid input",
    "lastname": "Invalid input",
    "sex": "Invalid input",
    "dateOfBirth": "Invalid input"
  }
}
```
Les messages `"Invalid input"` viennent des messages par défaut de Zod (`src/lib/api-schemas.ts`, `formatZodIssuesAsErrors`). Incohérent avec l'UI en français.

**Correction :** passer des messages français aux schémas Zod (`z.string().min(1, 'Le prénom est requis')`, etc.) ou mapper les messages par défaut en français dans `formatZodIssuesAsErrors`.

**Note :** le frontend envoie bien du snake_case via `toPatientPayload()` — le 422 rencontré pendant les tests en camelCase était un artefact du test, pas un bug applicatif. Le schéma `patientCreateSchema` attend bien `firstname`, `lastname`, `sex`, `dateOfBirth`.

---

### 4. MOYEN — `POST /consultations` : valeur de `status` rejetée

Avec `status: "PENDING"` → 422 `VALIDATION_ERROR` (`errors: { "status": "Invalid input" }`).
Les valeurs acceptées sont : `WAITING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` (`CONSULTATION_STATUSES`, `src/lib/schemas.ts:65`).

**À vérifier côté frontend :** le formulaire de consultation envoie-t-il un statut parmi cette liste ? Si le frontend utilise une valeur hors-liste (ex. `PENDING`), la création de consultation échouera systématiquement.

---

### 5. FAIBLE — Serveur de dev instable (restarts mémoire)

Après ~16 compilations de routes, le serveur dev redémarre : `Server is approaching the used memory threshold, restarting...`. Plusieurs pages testées ont échoué par `fetch failed` à cause de ces restarts, pas d'un bug de page. Limité au mode dev (compilation à la demande) ; non bloquant en production (`npm run build` OK).

**Vigilance :** les tests de pages doivent être rejoués en plusieurs lots pour éviter les faux négatifs.

---

## Résultats détaillés

### Authentification
| Test | Résultat |
|---|---|
| `POST /api/v1/auth/login` (admin, bons identifiants) | ✅ 200 |
| `POST /api/v1/auth/login` (mauvais mot de passe) | ✅ 401 structuré FR |
| `POST /api/v1/auth/patient-login` | ✅ 200 |
| `POST /api/v1/auth/refresh` (sans refresh token) | ❌ format legacy `detail` |
| `POST /api/v1/auth/login` (JSON malformé) | ✅ 400 structuré |
| `GET /api/v1/auth/me` | ✅ 200 |
| RBAC : token patient sur `/patients` | ✅ 403 `ACCESS_DENIED` |
| RBAC : admin sur `/help-images` | ✅ 403 (réservé SUPER_ADMIN) |

### Patients (CRUD complet, snake_case)
| Test | Résultat |
|---|---|
| `POST /patients` (valide) | ✅ 201 + id |
| `PUT /patients/[id]` | ✅ 200 |
| `GET /patients/[id]` | ✅ 200 |
| `DELETE /patients/[id]` | ⚠️ 200 mais réponse legacy `{detail}` |
| `GET /patients/[id]` (404) | ⚠️ format legacy `detail` |
| `GET /patients/[id]` (UUID invalide) | ⚠️ format legacy `detail` |
| `GET /patients` (sans token) | ✅ 401 structuré |

### Ressources GET (token admin)
✅ 200 : dashboard/stats, patients, users, facilities, consultations, care-episodes, clinical-cases, diagnostics, treatments, prescriptions, queue, notifications, documents, audit, pharmacy, settings, patient-history, diseases, disease-statistics, therapeutic-protocols, clinical-knowledge-base, care-coverages, partner-companies, partner-patients, supplies/batches, supplies/orders, supplies/movements, equipment/* (items, categories, locations, maintenance, assignments, audits, bookings, incidents, documents, spare-parts, suppliers, warranties, reports, dashboard), lab/exams, lab/categories, treatments, prescriptions, users, notifications, notification-preferences, settings.

❌ 500 : billing-codes, invoices, payments (**voir erreur n°1**).

### Autres POST
| Test | Résultat |
|---|---|
| `POST /clinical-cases` | ✅ 201 |
| `POST /queue` | ✅ 201 |
| `POST /consultations` (`status: PENDING`) | ❌ 422 — voir erreur n°4 |
| `POST /documents` | ✅ 201 |
| `POST /sync/push` (payload vide) | ⚠️ format legacy `detail` |
| `GET /sync/pull` | ✅ 200 |

### Patient Portal (token patient)
| Test | Résultat |
|---|---|
| `GET /patient/me` | ✅ 200 |
| `GET /patient/dashboard` | ✅ 200 |
| `GET /patient/consultations` | ✅ 200 |
| `GET /patient/lab-exams` | ✅ 200 |
| `GET /patient/treatments` | ✅ 200 |

### Rendu des pages (avec cookie de session admin)
✅ 200 (50 pages) : `/`, `/login`, `/forgot-password`, `/test-accounts`, `/docs`, `/audit-fonc`, `/patient/login`, `/dashboard`, `/patients`, `/users`, `/facilities`, `/billing`, `/pharmacy`, `/prescriptions`, `/queue`, `/consultations`, `/clinical-cases`, `/diagnostics`, `/treatments`, `/laboratory`, `/documents`, `/audit`, `/settings`, `/profile`, `/notifications`, `/sync`, `/reports`, `/research`, `/knowledge-base`, `/protocols`, `/hospitalization`, `/care-episodes`, `/archives`, `/clinical-decision`, `/equipment` (+ items, maintenance, categories, locations, assignments, warranties, documents), `/treatment-history`, `/diseases`, `/doctors`.

Sans session, les pages protégées redirigent correctement (307) vers `/login?redirect=...`.

---

## Corrections recommandées (par ordre de priorité)

1. Appliquer la migration `drizzle/0001_lean_phil_sheldon.sql` à la base Neon → débloque tout le module billing.
2. Convertir les réponses legacy `{ detail }` restantes au format structuré français (erreur n°2).
3. Localiser les messages de validation Zod en français (erreur n°3).
4. Vérifier le statut envoyé par le formulaire de consultation (erreur n°4).
5. (Facultatif) surveiller la consommation mémoire du serveur dev.

---

## Fichiers concernés

- `drizzle/0001_lean_phil_sheldon.sql` — migration billing jamais appliquée (erreur n°1)
- `src/lib/db.ts` — connexion Neon (`getDb`/`getSql`)
- `src/app/api/v1/patients/[id]/route.ts` — réponses legacy `detail` (erreur n°2)
- `src/app/api/v1/sync/push/route.ts` — `apiError(400, ...)` legacy (erreur n°2)
- `src/app/api/v1/auth/refresh/route.ts`, `src/app/api/v1/notifications/read/route.ts` — legacy (erreur n°2)
- `src/lib/api-schemas.ts` — messages Zod en anglais (erreur n°3)
- `src/lib/schemas.ts` (`CONSULTATION_STATUSES`, ligne 65) — statuts consultation (erreur n°4)
