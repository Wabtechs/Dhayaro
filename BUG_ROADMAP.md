# Roadmap — Bugs & Améliorations Dhayaro (Post-Déploiement)

> Généré après campagne de test complète sur Vercel (109 endpoints API + 33 pages frontend + cascades métier)
> **Mise à jour : 13 août 2026** — re-audit code : la majorité des items sont déjà corrigés (cf. commits de stabilisation).

---

## 🔴 Critiques (Sécurité / Données)

| # | Bug | Impact | Fichier(s) | Status |
|---|-----|--------|------------|--------|
| 1 | **Facility isolation cassé sur mutations** — doctor/pharmacist/lab reçoivent 422 quand ils créent dans une facility ≠ la leur | Empêche le travail multi-facility légitime | `treatments/route.ts`, `lab/exams/route.ts`, `diagnostics/route.ts`, `pharmacy/dispense/route.ts` — utilisent désormais `enforceFacilityAccess` (facility = celle du user pour les rôles non-SUPER_ADMIN) | ✅ **FIXÉ** |
| 2 | **DELETE /consultations/[id] → 308** (redirect HTML) | Casse l'API, empêche l'annulation en cascade | `src/app/api/v1/consultations/[id]/route.ts` — handler DELETE présent (soft-delete `status=CANCELLED` + cascade enfants + notif) | ✅ **FIXÉ** |
| 3 | **Cascade M-09 inopérante** — annulation consultation ne propage pas vers diagnostics/traitements/labExams | Orphelins de données, incohérence clinique | `consultations/[id]/route.ts` — PUT `CANCELLED` ET DELETE propagent : `diagnostics.isValidated=false`, `treatments.status=CANCELLED`, `labExams.status=CANCELLED` | ✅ **FIXÉ** |
| 4 | **RBAC /users corrigé** — addFacilityFilter ajouté | ✅ | `src/app/api/v1/users/route.ts` | ✅ Fait |
| 5 | **UUID validation 500→422 corrigé** — 4 routes sanitizeUuid | ✅ | `supplies/items/[id]`, `supplies/orders/[id]`, `supplies/movements/[id]`, `equipment/items/[id]` | ✅ Fait |

---

## 🟠 Majeurs (Fonctionnel)

| # | Bug | Impact | Fichier(s) | Status |
|---|-----|--------|------------|--------|
| 6 | **Pharmacy dispense 422** | Dispensation bloquée | `pharmacy/dispense/route.ts` — valide `treatment.status ∈ ['PRESCRIBED','IN_PROGRESS']` + facility alignée + queueId cohérent avec le patient | ✅ **FIXÉ** |
| 7 | **Bed assign 422** | Hospitalisation bloquée | `hospitalization/beds/[id]/assign/route.ts` — valide lit actif/non occupé/hors service, patient sans lit actif, facility alignée | ✅ **FIXÉ** |
| 8 | **/api/v1/triage → 404** — route inexistante mais middleware l'autorise | Incohérence config | `src/middleware.ts` — entrée vestigiale **supprimée** | ✅ **FIXÉ** |
| 9 | **/api/v1/dashboard → 404** — seule `/dashboard/stats` existe | — | L'entrée middleware `/api/v1/dashboard` est **nécessaire** pour autoriser `/api/v1/dashboard/stats` (match par préfixe). Un appel direct à `/api/v1/dashboard` 404 est attendu (pas de route.ts) | ℹ️ Comportement voulu |

---

## 🟡 Mineurs (Données / UX)

| # | Anomalie | Type | Statut |
|---|----------|------|--------|
| 10 | **care-coverages** : `remainingAmount > coverageCeiling` + `validUntil` passé, `status=ACTIVE` | Données | ⬜ Nettoyage manuel ou script de correction |
| 11 | **/equipment/reports** renvoyait un inventaire fournitures au lieu d'équipement | API | ✅ **FIXÉ** — `type=inventory` → équipements (catégorie/statut/état + valeur) ; fournitures sous `type=supplies` |
| 12 | **Labels FR/EN mélangés** equipment/dashboard | I18n | ⬜ Uniformiser libellés |
| 13 | **/pharmacy** renvoie la queue `WITH_PHARMACY` (pas les dispensations) | API | ℹ️ Comportement voulu — worklist de délivrance alimentant l'UI pharmacie |
| 14 | **Modules vides en prod** (total=0) : certains modules cliniques/fournitures | Données | ⬜ Prévoir seed réaliste ou scripts de peuplement |

---

## 🔧 Technique / Dette

| # | Item | Statut |
|---|------|--------|
| 15 | **payments/route.ts** — `paidAt` passé en `Date` (WS driver exige `Date`) | ✅ Commit 49e7138 + a950348 (select paidAt, numéro facture) |
| 16 | **Vestigial middleware** : `/triage` sans route | ✅ **FIXÉ** — entrée supprimée (commit à venir) |
| 17 | **Seed FK-safe** — ordre de suppression enfants avant parents | ✅ OK + documenté (`AGENTS.md`) |
| 18 | **Migrations Neon** — ne pas utiliser `drizzle-kit migrate` (hangs) | ✅ Documenté (`AGENTS.md`), migrations appliquées manuellement |

---

## 📋 Plan d'action suggéré

### Sprint 1 — Stabilité critique ✅ (soldé)
- [x] **#1** Facility filter sur toutes mutations POST/PUT/DELETE (treatments, lab, diagnostics, pharmacy, hospitalization)
- [x] **#2** DELETE /consultations/[id] → 200 structuré (soft-delete + cascade)
- [x] **#3** Cascade M-09 (DELETE + PUT CANCELLED propagent vers enfants)
- [x] **#15** Fix `paidAt` Date sur payments

### Sprint 2 — Fonctionnel complet ✅ (soldé)
- [x] **#6** Pharmacy dispense : validation status + facility
- [x] **#7** Bed assign : validation lit/patient/facility
- [x] **#8** Nettoyage middleware vestigial `/triage`
- [x] **#9** `/dashboard` : entrée conservée (nécessaire pour `/dashboard/stats`)

### Sprint 3 — Qualité données & UX (à faire)
- [ ] **#10** Script correction care-coverages
- [x] **#11** /equipment/reports corrigé
- [ ] **#12** Uniformiser labels equipment/dashboard
- [x] **#13** `/pharmacy` : comportement confirmé (worklist)
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
│   ├── consultations/[id]/route.ts        # ✅ DELETE soft + cascade M-09
│   ├── treatments/route.ts                # ✅ facility filter POST
│   ├── lab/exams/route.ts                 # ✅ facility filter POST
│   ├── diagnostics/route.ts               # ✅ facility filter POST
│   ├── pharmacy/dispense/route.ts         # ✅ validation status + facility
│   ├── hospitalization/beds/[id]/assign/route.ts  # ✅ validation lit/patient
│   ├── equipment/reports/route.ts         # ✅ inventory → équipements
│   ├── users/route.ts                     # ✅ RBAC corrigé
│   ├── payments/route.ts                  # ✅ paidAt Date
│   ├── supplies/items/[id]/route.ts       # ✅ UUID corrigé
│   ├── supplies/orders/[id]/route.ts      # ✅ UUID corrigé
│   ├── supplies/movements/[id]/route.ts   # ✅ UUID corrigé
│   └── equipment/items/[id]/route.ts      # ✅ UUID corrigé
├── middleware.ts                          # ✅ /triage retiré
└── lib/
    ├── api-errors.ts                      # addFacilityFilter, enforceFacilityAccess
    ├── api-schemas.ts                     # ✅ formatZodIssueMessage (FR)
    └── seed.ts                            # FK-safe cleanup order
```

---

## ✅ Déjà livré (ce déploiement)
- RBAC `/users` : isolation facility opérationnelle
- UUID validation : 4 routes → 422 au lieu de 500
- Messages de validation Zod en français (au lieu de `Invalid input`)
- `/equipment/reports` : inventaire équipements correct
- Build + deploy Vercel : **Ready** sur `https://dhayaro.vercel.app`
- 73/73 endpoints API passent (hors cascades métiers)
- 33/33 pages frontend : 200 public, 307 protégé
