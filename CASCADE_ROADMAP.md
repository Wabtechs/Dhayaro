# Roadmap — Fix Cascades & Facility Isolation

**Mise à jour : 13 août 2026** — re-audit code : les phases 1-3 sont soldées (validations en place dans les routes).

## Problèmes identifiés par le test cascade

| # | Problème | Cause racine probable | Statut |
|---|----------|----------------------|--------|
| 1 | **Facility isolation bloque les créations cross-facility** (doctor/pharmacist/lab → 422) | Middleware + `enforceFacilityAccess` + routes n'utilisent pas `addFacilityFilter` sur mutations | ✅ Résolu — `treatments`, `lab/exams`, `diagnostics`, `pharmacy/dispense`, `beds/assign` utilisent `enforceFacilityAccess` (facility = celle du user, sauf SUPER_ADMIN) |
| 2 | **DELETE /consultations/[id] → 308 (redirect)** | Middleware ou route mal gérée pour DELETE | ✅ Résolu — handler DELETE présent, retour JSON structuré `{ success, data, message }` |
| 3 | **Cascade M-09 ne cascade pas** (diagnostics/traitements/labExams non annulés) | Les enfants créés n'ont pas le bon `consultationId` ou DELETE ne filtre pas correctement | ✅ Résolu — PUT `CANCELLED` ET DELETE propagent vers `diagnostics.isValidated=false`, `treatments.status=CANCELLED`, `labExams.status=CANCELLED` |
| 4 | **Pharmacy dispense 422** même avec admin token | Validation `treatment.status` invalide ou facility mismatch | ✅ Résolu — statut ∈ PRESCRIBED/IN_PROGRESS + facility alignée + queueId lié au même patient |
| 5 | **Bed assign 422** | Patient déjà hospitalisé, ou episodeId invalide, ou facility mismatch | ✅ Résolu — lit actif/non occupé, patient sans lit actif, facility alignée |

## Plan d'action

### Phase 1 — Isolation facility (blocante) ✅
- [x] Audit des routes POST/PUT/DELETE : `addFacilityFilter` / `enforceFacilityAccess` systématiques
- [x] Harmonisation : doctor/pharmacist/lab créent dans leur facility (via admin pour cross-facility)
- [x] Test de parcours par rôle : patient → consultation → traitement → lab → dispense (validé en prod)

### Phase 2 — Cascade M-09 (annulation consultation) ✅
- [x] `DELETE /consultations/[id]` : 200 structuré (soft-delete `status=CANCELLED`)
- [x] Cascade enfants : `diagnostics.isValidated=false`, `treatments.status=CANCELLED`, `labExams.status=CANCELLED`
- [ ] Test unitaire/intégration automatisé pour DELETE cascade (→ Phase 4)

### Phase 3 — Cascades métier restantes ✅
- [x] Dispense : validation (status treatment = PRESCRIBED requis)
- [x] Bed assign : validation (patient libre, episode valide, facility alignée)
- [x] Reception commande : mouvements + batches (déjà OK)

### Phase 4 — Tests d'intégration automatisés ⬜
- [ ] Script cascade complet (cascade suite) en CI/CD
- [ ] Tests d'intégration (Vitest + MSW ou Playwright) sur les cascades critiques (annulation consultation, dispense, assign lit)
- [ ] Nettoyage auto test data (soft-delete patient cascade)

## Fichiers à revoir
- `src/app/api/v1/consultations/[id]/route.ts` ✅ (DELETE + cascade M-09)
- `src/app/api/v1/treatments/route.ts`, `lab/exams/route.ts`, `diagnostics/route.ts` ✅ (facility filter sur POST)
- `src/app/api/v1/pharmacy/dispense/route.ts` ✅ (validation)
- `src/app/api/v1/hospitalization/beds/[id]/assign/route.ts` ✅ (validation)
- `src/lib/api-errors.ts` ✅ (`addFacilityFilter`, `enforceFacilityAccess`)
