# ROADMAP DHAYARO — Améliorations Priorisées

**Dernière mise à jour :** 11 août 2026  
**Baseline :** Audit complet parcours patient + impact rôles

---

## 📊 Vue d'ensemble

| Phase | Statut | Jours est. | Progression |
|-------|--------|------------|-------------|
| **P1 — Critique** | ✅ Terminée | 10-14 | 100% |
| **P2 — Majeur** | 🔄 En cours | 12-15 | 95% |
| **P3 — Améliorations** | ⏳ Planifié | 14-15 | 0% |

---

## 🔴 P1 — CRITIQUE (Bloquant Production)

### P1.1 — Alimenter `patientHistory` automatiquement
**Objectif :** Toute action clinique crée une entrée `patientHistory` (eventType, title, description, metadata, performedBy, episodeId)

| Tâche | Statut | Fichiers | Notes |
|-------|--------|----------|-------|
| Créer helper `src/lib/patient-history.ts` | ✅ DONE | `src/lib/patient-history.ts` (nouveau) | Fonctions `logPatientEvent()`, `logClinicalEvent()` |
| Intégrer dans `POST /consultations` | ✅ DONE | `src/app/api/v1/consultations/route.ts` | Event: CONSULTATION_CREATED |
| Intégrer dans `PUT /consultations/[id]` (status change) | ✅ DONE | `src/app/api/v1/consultations/[id]/route.ts` | Events: CONSULTATION_STARTED, COMPLETED, CANCELLED |
| Intégrer dans `POST /diagnostics` | ✅ DONE | `src/app/api/v1/diagnostics/route.ts` | Event: DIAGNOSTIC_CREATED |
| Intégrer dans `PUT /diagnostics/[id]` (validation) | ✅ DONE | `src/app/api/v1/diagnostics/[id]/route.ts` | Event: DIAGNOSTIC_VALIDATED |
| Intégrer dans `POST /treatments` | ✅ DONE | `src/app/api/v1/treatments/route.ts` | Event: TREATMENT_PRESCRIBED |
| Intégrer dans `PUT /treatments/[id]` (status) | ✅ DONE | `src/app/api/v1/treatments/[id]/route.ts` | Events: TREATMENT_STARTED, COMPLETED, CANCELLED |
| Intégrer dans `POST /lab/exams` | ✅ DONE | `src/app/api/v1/lab/exams/route.ts` | Event: LAB_EXAM_REQUESTED |
| Intégrer dans `PUT /lab/exams/[id]` (résultat/validation) | ✅ DONE | `src/app/api/v1/lab/exams/[id]/route.ts` | Events: LAB_EXAM_COMPLETED, LAB_EXAM_VALIDATED |
| Intégrer dans `POST /queue` | ✅ DONE | `src/app/api/v1/queue/route.ts` | Event: QUEUE_TICKET_CREATED |
| Intégrer dans `PUT /queue/[id]` (status) | ✅ DONE | `src/app/api/v1/queue/[id]/route.ts` | Events: QUEUE_WITH_DOCTOR, QUEUE_WITH_LAB, QUEUE_COMPLETED |
| Intégrer dans `POST /care-episodes` | ✅ DONE | `src/app/api/v1/care-episodes/route.ts` | Event: EPISODE_ADMITTED |
| Intégrer dans `PUT /care-episodes/[id]` (status/discharge) | ✅ DONE | `src/app/api/v1/care-episodes/[id]/route.ts` | Events: EPISODE_STATUS_CHANGED, EPISODE_DISCHARGED |
| Intégrer dans `POST /care-episodes/[id]/archive` | ✅ DONE | `src/app/api/v1/care-episodes/[id]/archive/route.ts` | Event: EPISODE_ARCHIVED |
| Intégrer dans `POST /documents` | ✅ DONE | `src/app/api/v1/documents/route.ts` | Event: DOCUMENT_CREATED |
| Intégrer dans `POST /archives` | ✅ DONE | `src/app/api/v1/archives/route.ts` | Event: ARCHIVE_CREATED |
| Intégrer dans `POST /prescriptions` | ✅ DONE | `src/app/api/v1/prescriptions/route.ts` | Event: PRESCRIPTION_CREATED |

**Definition of Done :** `patientHistory` alimentée pour 100% du parcours (entrée → sortie)

---

### P1.2 — Génération auto documents
**Objectif :** Documents créés automatiquement aux étapes clés

| Tâche | Statut | Fichiers | Trigger |
|-------|--------|----------|---------|
| Consultation COMPLETED → document REPORT | ✅ DONE | `src/app/api/v1/consultations/[id]/route.ts` (PUT) | `allowedFields.status === 'COMPLETED'` |
| Diagnostic FINAL → document REPORT | ✅ DONE | `src/app/api/v1/diagnostics/[id]/route.ts` (PUT validation) | `body.isValidated === true` |
| LabExam COMPLETED → document LAB_RESULT | ✅ DONE | `src/app/api/v1/lab/exams/[id]/route.ts` (PUT) | `body.status === 'COMPLETED'` |
| Treatment PRESCRIBED → document PRESCRIPTION + ORDONNANCE | ✅ DONE | `src/app/api/v1/treatments/route.ts` (POST) | `row.status === 'PRESCRIBED'` |
| Helper génération documents | ✅ DONE | `src/lib/documents.ts` (nouveau) | `createClinicalDocument()`, `documentExistsForEntity()` |

---

### P1.3 — API Pharmacie complète
**Objectif :** Délivrance tracée, stock décrémenté, validation pharmacien

| Tâche | Statut | Fichiers | Notes |
|-------|--------|----------|-------|
| Ajouter table `dispensations` dans schéma | ✅ DONE | `src/lib/schema.ts` | id, treatmentId, patientId, pharmacistId, quantity, lotNumber, expiryDate, dispensedAt, notes, signature |
| Créer `POST /api/v1/pharmacy/dispense` | ✅ DONE | `src/app/api/v1/pharmacy/dispense/route.ts` (nouveau) | Valide pharmacien, crée dispensation, COMPLETED treatment, avance file, log PHARMACY_DISPENSED, ORDONNANCE doc, notif docteur |
| Créer `GET /api/v1/pharmacy` (liste à délivrer) | ✅ DONE | `src/app/api/v1/pharmacy/route.ts` (nouveau) | Filtre queue status=WITH_PHARMACY + facility |
| Mettre à jour UI `/pharmacy` pour utiliser nouvelles API | ✅ DONE | `src/hooks/use-data.ts` (`useDispenseTreatment`) | Pointe sur POST /pharmacy/dispense (log + doc + notif centralisés) |
| Notification patient/docteur à la délivrance | ✅ DONE | Dans route dispense | sendNotification au docteur prescripteur |

---

### P1.4 — Soft-delete partout (données médicales)
**Objectif :** Aucune suppression physique sur entités cliniques

| Tâche | Statut | Fichiers | Action |
|-------|--------|----------|--------|
| Diagnostics DELETE → `isActive=false` | ✅ DONE | `src/app/api/v1/diagnostics/[id]/route.ts` | Soft-delete via isActive=false |
| LabExams DELETE → `isActive=false` | ✅ DONE | `src/app/api/v1/lab/exams/[id]/route.ts` | Soft-delete via isActive=false |
| Treatments DELETE → `status='CANCELLED'` | ✅ DONE | `src/app/api/v1/treatments/[id]/route.ts` | Soft-delete via status=CANCELLED |
| Documents DELETE → `isActive=false` | ✅ DONE | `src/app/api/v1/documents/[id]/route.ts` | Soft-delete via isActive=false |
| CareEpisodes DELETE → `isArchived=true` | ✅ DONE | `src/app/api/v1/care-episodes/[id]/route.ts` | Soft-delete via isArchived=true |

---

## 🟠 P2 — MAJEUR (Avant Production)

### P2.1 — Module Facturation (Billing)
| Tâche | Statut | Fichiers |
|-------|--------|----------|
| Schéma : `invoices`, `invoiceItems`, `payments`, `billingCodes` | ✅ DONE | `src/lib/schema.ts` + migration `drizzle/0001_lean_phil_sheldon.sql` |
| API facturation (CRUD factures, paiements, codes) | ✅ DONE | `src/app/api/v1/invoices/`, `payments/`, `billing-codes/` (GET/POST + [id]) |
| Permissions `billing:*` pour ACCOUNTANT | ✅ DONE | `src/lib/permissions.ts`, `src/middleware.ts` (invoices/payments/billing-codes) |
| Liaison `careCoverages` → factures auto | ✅ DONE | `src/lib/billing.ts` (computeCoverageSplit, getActiveCareCoverage, createAutoInvoice) + `POST /care-episodes` (billingCodeId → facture admission auto) + `POST /invoices` (split couverture appliqué + remainingAmount décrémenté) |
| UI Facturation pour ACCOUNTANT | ✅ DONE | `src/views/billing/index.tsx` + `src/app/(app)/billing/page.tsx` |

### P2.2 — Gestion Lits Hospitalisation
| Tâche | Statut | Fichiers |
|-------|--------|----------|
| Schéma : `beds`, `bedAssignments` | ✅ DONE | `src/lib/schema.ts` (beds, bedAssignments) + migration `drizzle/0002_easy_ares.sql` |
| API `/api/v1/hospitalization/beds/*` | ✅ DONE | `src/app/api/v1/hospitalization/beds/` (GET list, GET/PUT/DELETE [id], POST assign, POST release) |
| UI plan de lits (`/hospitalization/beds`) | ✅ DONE | `src/views/hospitalization/beds/index.tsx` + `src/app/(app)/hospitalization/beds/page.tsx` |

### P2.3 — Portail Patient Complet
| Tâche | Statut | Fichiers |
|-------|--------|----------|
| Onglet Diagnostics dans `/patient/medical-record` | ✅ DONE | `src/views/patient-medical-record/index.tsx` + `src/app/api/v1/patient/diagnostics/route.ts` |
| Téléchargement documents (PDF) | ✅ DONE | `src/app/api/v1/patient/documents/[id]/download/route.ts` + `src/app/api/v1/patient/documents/route.ts` |
| Génération PDF ordonnance | ✅ DONE | `src/lib/pdf.ts` (nouveau, jsPDF) |
| Ordonnances visibles/imprimables | ✅ DONE | `src/views/patient-medical-record/index.tsx` + `src/app/api/v1/patient/treatments/[id]/ordonnance/route.ts` + `src/app/patient/ordonnance/[treatmentId]` |

### P2.4 — Middleware : couvrir toutes API
| Tâche | Statut | Fichiers |
|-------|--------|----------|
| Ajouter routes manquantes dans `ROLE_ROUTES` | ✅ DONE | `src/middleware.ts` |
| Routes couvertes : consultations, patients, treatments, prescriptions, care-episodes, diagnostics, lab, documents, pharmacy, billing/invoices/payments/billing-codes, hospitalization, equipment, supplies, patient-history, etc. | ✅ DONE | `src/middleware.ts` |

---

## 🟡 P3 — AMÉLIORATIONS (Post-MVP)

| # | Tâche | Statut | Estimation |
|---|-------|--------|------------|
| 3.1 | Uniformiser soft-delete (status vs isActive) | ⬜ TODO | 1 j |
| 3.2 | Recalculer positions queue à annulation | ⬜ TODO | 0.5 j |
| 3.3 | Pagination serveur frontend (toutes vues) | ⬜ TODO | 2 j |
| 3.4 | Vérifier audit trail auto sur toutes mutations | ⬜ TODO | 1 j |
| 3.5 | Triage : table dédiée + score Manchester/NEWS | ⬜ TODO | 3 j |
| 3.6 | Messagerie interne soignants | ⬜ TODO | 3 j |
| 3.7 | CIM-10 autocomplete diagnostic | ⬜ TODO | 2 j |
| 3.8 | Ordonnance PDF + QR code validation | ⬜ TODO | 2 j |

---

## 📝 Journal d'exécution

### 2026-08-08 — Démarrage
- [x] Audit complet effectué
- [x] Roadmap créée (ce fichier)
- [x] P1.1 — helper `patient-history.ts` + intégration dans 17 endpoints (consultations, diagnostics, treatments, lab/exams, queue, care-episodes, documents, archives, prescriptions)
- [x] P1.2 — helper `documents.ts` + génération auto REPORT(s)/LAB_RESULT/PRESCRIPTION/ORDONNANCE
- [x] P1.3 — table `dispensations`, `POST /pharmacy/dispense` (atomique + log + doc + notif), `GET /pharmacy` worklist, hook `useDispenseTreatment` pointé sur la nouvelle route
- [x] P1.4 — soft-delete validé (diagnostics/labExams/documents → isActive=false, treatments → status=CANCELLED, careEpisodes → isArchived=true)
- [x] Build TypeScript `tsc --noEmit` : 0 erreurs (corrigé firstname/lastname JWT + `unknown` index errors)
- [ ] **Prochaine action : P2.1 - Module Facturation (Billing) — schéma invoices/payments**

### 2026-08-11 — P2.2 Gestion Lits Hospitalisation
- [x] Schéma `beds` + `bedAssignments` (status/type/position, capacité facility, assignments avec admission/admissionDate)
- [x] Migration `drizzle/0002_easy_ares.sql` générée + appliquée en base (drizzle-kit migrate)
- [x] API : `GET /hospitalization/beds` (filtres status/type/search + pagination + facility), `GET/PUT/DELETE /[id]`, `POST /[id]/assign`, `POST /[id]/release`
- [x] Règles métier : lit unique par patient, pas de ré-assign si lit occupé, release unitaire, audits + notifications assign/release
- [x] Permissions `hospitalization:beds` (ADMIN, SUPER_ADMIN, NURSE, DOCTOR, RECEPTIONIST) + accès limité au patient
- [x] UI plan de lits : statuts colorés, stats, CRUD lit, dialog assign patient (search + détails), release, permission-gating
- [x] Seed : 30 lits (6 services × 5) + assignments, hook `useBeds`/`useBedAssign`/`useBedRelease`/`useUpdateBed`/`useDeleteBed`
- [x] Qualité : `tsc --noEmit` 0 erreurs, ESLint 0 erreurs, `next build` OK (routes + page incluses)
- [x] **Déployé sur Vercel (prod `dhayaro.vercel.app`, Build Ready)** et validé en base Neon :
  - Migration 0002 (beds) appliquée manuellement (drizzle-kit migrate ne fonctionne pas : pas de table `__drizzle_migrations`) + seed complet (~7173 enregistrements)
  - `getDb()` basculé sur driver `neon-serverless` (WebSocket Pool → `db.transaction()` supporté ; `neon-http` ne les supporte pas)
  - Fix runtime : `payments` passait un string dans `paidAt` (timestamp → `value.toISOString is not a function`) → `new Date(body.paidAt)`
  - Fix `treatments` : `.toISOString()` sur colonne `date()` (string)
  - Seed : ordre de nettoyage rendu FK-safe (`patient_history`, `dispensations`, `payments`, `invoiceItems`, `invoices`)
  - Smoke tests prod : login, beds GET (22 lits), assign/release (OCCUPIED→CLEANING), facture + paiement (FACT-… → PAID), page `/hospitalization/beds` (200)

### 2026-08-11 — P2.3 Portail Patient Complet
- [x] API `GET /patient/diagnostics` (diagnostics du patient, join diseases + users) + onglet Diagnostics dans `/patient/medical-record`
- [x] API `GET /patient/documents` (liste paginée) + `GET /patient/documents/[id]/download` (PDF serveur)
- [x] `src/lib/pdf.ts` : génération PDF serveur (jsPDF + jspdf-autotable, build Node) à partir du `content` JSONB des documents
- [x] API `GET /patient/treatments/[id]/ordonnance` (vérifie l'appartenance au patient) + page imprimable `/patient/ordonnance/[treatmentId]` (PDF + Imprimer)
- [x] Onglet Documents avec bouton téléchargement PDF + bouton "Ordonnance" sur chaque traitement
- [x] Qualité : `tsc --noEmit` 0 erreurs, ESLint 0 erreurs, `next build` OK (routes + page incluses)
- [ ] **Prochaine action : P2.4 - Middleware : couvrir toutes API (ROLE_ROUTES)**

### 2026-08-13 — P2.4 + nettoyage bugs roadmaps
- [x] P2.4 — middleware `ROLE_ROUTES` complet : toutes les routes API couvertes (billing/invoices/payments/billing-codes, hospitalization, equipment, supplies, patient-history, pharmacy, lab, etc.)
- [x] P2.1 Facturation — re-audit : schéma, API (invoices/payments/billing-codes), permissions `billing:*` et UI comptable opérationnels (validé prod : FACT-… → PAID). Reste : liaison `careCoverages` → factures auto
- [x] Retiré l'entrée vestigiale `/api/v1/triage` du middleware (BUG #8/#16)
- [x] `formatZodIssueMessage` (`src/lib/api-schemas.ts`) : messages de validation Zod v4 traduits en français (champ requis, valeur invalide, email/uuid/url, enum, too small/big) ; les messages personnalisés FR sont préservés
- [x] `/equipment/reports?type=inventory` corrigé : inventaire **équipements** (par catégorie/statut/état + valeur) au lieu des fournitures ; inventaire fournitures déplacé sous `type=supplies` (BUG #11)
- [x] Vérifié en code (aucun correctif nécessaire) : facility isolation sur mutations (#1), cascade annulation consultation (#2/#3), dispense 422 (#6), bed assign 422 (#7), `/pharmacy` worklist = comportement voulu (#13), format legacy `{detail}` déjà supprimé, statut consultation frontend `WAITING` (le 422 `PENDING` était un artefact de test)
- [x] Qualité : `tsc --noEmit` 0 erreurs, ESLint 0 erreurs (warnings préexistants)
- [x] **P2.1 clôturé** — liaison `careCoverages` → factures auto :
  - `src/lib/billing.ts` : `computeCoverageSplit` (rate × total, borné par plafond + remainingAmount), `getActiveCareCoverage` (ACTIVE + périodes valides), `createAutoInvoice` (transaction : facture + item + décrément remainingAmount)
  - `POST /care-episodes` : champ optionnel `billingCodeId` → facture d'admission auto (montant = tarif du code, couverture patient appliquée), réponse inclut la facture
  - `POST /invoices` : si `careCoverageId` fourni → split couverture appliqué (coverageRate/insuranceShare/patientShare renseignés) + remainingAmount décrémenté (avant : tout en patientShare)
- [ ] **Prochaine action : P3 - Améliorations (soft-delete uniformisé, pagination serveur, triage, etc.) ou Phase 4 cascades (tests CI)**

### 2026-08-13 (soir) — Pages inaccessibles + rapports + formulaires hospitalisation
- [x] **Routes pages manquantes créées (BUG : 404 sidebar)** : `src/app/(app)/patient-history/page.tsx` et `src/app/(app)/care-coverages/page.tsx` — les vues étaient complètes mais les routes n'existaient pas, donc les liens sidebar `/patient-history` (Historique patients) et `/care-coverages` (Prises en charge) renvoyaient 404
- [x] **API `patient-history/[id]`** (`src/app/api/v1/patient-history/[id]/route.ts`) : GET / PUT / DELETE (facility-filtered, rôles) — la vue appelait ces routes qui n'existaient pas (suppression/édition mortes)
- [x] **Vue patient-history corrigée** : « Modifier » ouvrait une route inexistante → dialog d'édition inline (PUT) ; invalidation du cache après create/update/delete ; `patientHistoryUpdateSchema` ajouté à `src/lib/schemas.ts`
- [x] **`/reports` fonctionnel** : hook `useDashboardStats()` (`src/hooks/use-data.ts`, consomme `/api/v1/dashboard/stats`) ; vue `src/views/reports/index.tsx` réécrite avec 4 cartes stats (consultations, patients, hospitalisés, examens labo) + cartes de rapports navigables
- [x] **Pages `/reports/[type]`** (`patients`, `consultations`, `laboratory`, `treatments`) : `src/app/(app)/reports/[type]/page.tsx` + vue `src/views/report-detail/index.tsx` — tables alimentées par les API existantes, **export CSV** (UTF-8 BOM, séparateur `;`) et **impression** (en-tête imprimable)
- [x] **Formulaire d'admission hospitalisation clarifié** : description « Sélectionnez le patient à hospitaliser et indiquez le motif de l'admission », libellé « Patient * »
- [x] **Formulaire de sortie robustifié** : reset du formulaire à l'ouverture (fini les valeurs périmées d'un patient précédent), n° d'épisode affiché, libellé/placeholder « Résumé clinique » explicites
- [x] Qualité : `tsc --noEmit` 0 erreurs
- [ ] **Déploiement : `vercel --prod`**


---

## 🔄 Comment utiliser cette roadmap

1. **Chaque matin** : Mettre à jour le statut des tâches du jour
2. **À chaque commit** : Referencer la tâche (ex: `feat(P1.1): add patientHistory logging to consultations`)
3. **Fin de journée** : Noter ce qui est fait / bloqué dans "Journal d'exécution"
4. **Revue hebdo** : Ajuster priorités, estimer reste

---

## 🏷️ Convention commits

```
feat(P1.1): description          # Nouvelle fonctionnalité P1.1
fix(P1.3): description           # Correction bug P1.3
refactor(P2.1): description      # Refactor
chore(P1.4): description         # Maintenance
docs: update roadmap             # Mise à jour ce fichier
```