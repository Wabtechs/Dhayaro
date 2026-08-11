# Roadmap — Bugs & Améliorations Dhayaro (Post-Déploiement)

> Généré après campagne de test complète sur Vercel (109 endpoints API + 33 pages frontend + cascades métier)

---

## 🔴 Critiques (Sécurité / Données)

| # | Bug | Impact | Fichier(s) | Status |
|---|-----|--------|------------|--------|
| 1 | **Facility isolation cassé sur mutations** — doctor/pharmacist/lab reçoivent 422 quand ils créent dans une facility ≠ la leur | Empêche le travail multi-facility légitime | `src/app/api/v1/treatments/route.ts`, `lab/exams/route.ts`, `diagnostics/route.ts`, `pharmacy/dispense/route.ts` — utiliser `addFacilityFilter` / `enforceFacilityAccess` | ⬜ À faire |
| 2 | **DELETE /consultations/[id] → 308** (redirect HTML) au lieu de 200/4xx | Casse l'API, empêche l'annulation en cascade | `src/app/api/v1/consultations/[id]/route.ts` + middleware | ⬜ À faire |
| 3 | **Cascade M-09 inopérante** — annulation consultation ne propage pas vers diagnostics/traitements/labExams | Orphelins de données, incohérence clinique | `src/app/api/v1/consultations/[id]/route.ts` (DELETE + PUT CANCELLED) | ⬜ À faire |
| 4 | **RBAC /users déjà corrigé** — addFacilityFilter ajouté | ✅ **FIXÉ** (commit 82a4be0) | `src/app/api/v1/users/route.ts` | ✅ Fait |
| 5 | **UUID validation 500→422 corrigé** — 4 routes sanitizeUuid ajouté | ✅ **FIXÉ** (commit 82a4be0) | `supplies/items/[id]`, `supplies/orders/[id]`, `supplies/movements/[id]`, `equipment/items/[id]` | ✅ Fait |

---

## 🟠 Majeurs (Fonctionnel)

| # | Bug | Impact | Fichier(s) |
|---|-----|--------|------------|
| 6 | **Pharmacy dispense 422** même avec token admin | Dispensation bloquée | `src/app/api/v1/pharmacy/dispense/route.ts` — vérifier `treatment.status ∈ ['PRESCRIBED','IN_PROGRESS']` et facility alignment |
| 7 | **Bed assign 422** — assignation lit échoue | Hospitalisation bloquée | `src/app/api/v1/hospitalization/beds/[id]/assign/route.ts` — vérifier patient libre, episodeId valide, facility alignée |
| 8 | **/api/v1/triage → 404** — route inexistante mais middleware l'autorise | Incohérence config, frontend n'utilise pas (utilise /queue + /consultations) | `src/middleware.ts:47` (entrée vestigiale) — supprimer ou implémenter |
| 9 | **/api/v1/dashboard → 404** — seule `/dashboard/stats` existe | Middleware autorise `/dashboard` mais pas de route | `src/middleware.ts:50` + créer `dashboard/route.ts` ou retirer du middleware |

---

## 🟡 Mineurs (Données / UX)

| # | Anomalie | Type | Détail |
|---|----------|------|--------|
| 10 | **care-coverages** : `remainingAmount > coverageCeiling` + `validUntil` passé, `status=ACTIVE` | Données | Nettoyage manuel ou script de correction |
| 11 | **/equipment/reports** renvoie rapport inventaire fournitures au lieu d'équipement | API | `src/app/api/v1/equipment/reports/route.ts` — vérifier logique |
| 12 | **Labels FR/EN mélangés** equipment/dashboard | I18n | Uniformiser libellés |
| 13 | **/pharmacy** renvoie queue `WITH_PHARMACY` (pas dispensations) | API | Confirmer comportement voulu ou changer pour dispensations |
| 14 | **Modules vides en prod** (total=0) : invoices, payments, supplies/items, therapeutic-protocols, treatments, consultations, diagnostics, prescriptions, clinical-cases | Données | Prévoir seed réaliste ou scripts de peuplement |

---

## 🔧 Technique / Dette

| # | Item | Fichier(s) |
|---|------|------------|
| 15 | **payments/route.ts** — fix `paidAt` en `Date` (pas string) non commité | `src/app/api/v1/payments/route.ts` (git diff montre changement local) |
| 16 | **Vestigial middleware** : `/triage`, `/dashboard` sans routes correspondantes | `src/middleware.ts` lignes 46-47, 50 |
| 17 | **Seed FK-safe** — ordre de suppression `patient_history`, `dispensations`, `payments`, `invoiceItems`, `invoices` avant parents | `src/lib/seed.ts` (déjà OK, documenter) |
| 18 | **Migrations Neon** — ne pas utiliser `drizzle-kit migrate` (hangs), utiliser `db:push` ou SQL manuel | `AGENTS.md` déjà documenté |

---

## 📋 Plan d'action suggéré

### Sprint 1 — Stabilité critique (1-2 jours)
- [ ] **#1** Facility filter sur toutes mutations POST/PUT/DELETE (treatments, lab, diagnostics, pharmacy, hospitalization)
- [ ] **#2** Corriger DELETE /consultations/[id] → 308 (check middleware OPTIONS / route handler)
- [ ] **#3** Corriger cascade M-09 (DELETE + PUT CANCELLED propagent bien vers enfants)
- [ ] **#15** Commit le fix `paidAt` Date sur payments

### Sprint 2 — Fonctionnel complet (2-3 jours)
- [ ] **#6** Pharmacy dispense : diagnostiquer 422 (logs + test unitaire)
- [ ] **#7** Bed assign : diagnostiquer 422
- [ ] **#8** Nettoyer middleware vestigial `/triage` (supprimer ou implémenter)
- [ ] **#9** Décider pour `/dashboard` : créer route ou retirer du middleware

### Sprint 3 — Qualité données & UX (1 semaine)
- [ ] **#10** Script correction care-coverages
- [ ] **#11** Corriger /equipment/reports
- [ ] **#12** Uniformiser labels equipment/dashboard
- [ ] **#13** Clarifier /pharmacy : queue vs dispensations
- [ ] **#14** Scripts de seed réalistes pour modules vides

### Sprint 4 — Automatisation & CI (continu)
- [ ] Intégrer script cascade (`dhayaro-cascades.ps1`) en CI/CD
- [ ] Tests d'intégration automatisés (Vitest + MSW ou Playwright)
- [ ] Nettoyage auto données de test (soft-delete patient cascade)

---

## 📁 Fichiers clés à surveiller

```
src/
├── app/api/v1/
│   ├── consultations/[id]/route.ts        # DELETE 308, cascade M-09
│   ├── treatments/route.ts                # facility filter POST
│   ├── lab/exams/route.ts                 # facility filter POST
│   ├── diagnostics/route.ts               # facility filter POST
│   ├── pharmacy/dispense/route.ts         # dispense 422
│   ├── hospitalization/beds/[id]/assign/route.ts  # assign 422
│   ├── users/route.ts                     # ✅ RBAC corrigé
│   ├── supplies/items/[id]/route.ts       # ✅ UUID corrigé
│   ├── supplies/orders/[id]/route.ts      # ✅ UUID corrigé
│   ├── supplies/movements/[id]/route.ts   # ✅ UUID corrigé
│   ├── equipment/items/[id]/route.ts      # ✅ UUID corrigé
│   ├── payments/route.ts                  # paidAt Date (non commité)
├── middleware.ts                          # /triage, /dashboard vestigiaux
├── lib/
│   ├── api-errors.ts                      # addFacilityFilter, enforceFacilityAccess
│   ├── seed.ts                            # FK-safe cleanup order
```

---

## ✅ Déjà livré (ce déploiement)
- RBAC `/users` : isolation facility opérationnelle
- UUID validation : 4 routes → 422 au lieu de 500
- Build + deploy Vercel : **Ready** sur `https://dhayaro.vercel.app`
- 73/73 endpoints API passent (hors cascades métiers)
- 33/33 pages frontend : 200 public, 307 protégé