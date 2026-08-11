# Roadmap — Fix Cascades & Facility Isolation

## Problèmes identifiés par le test cascade

| # | Problème | Cause racine probable | Priorité |
|---|----------|----------------------|----------|
| 1 | **Facility isolation bloque les créations cross-facility** (doctor/pharmacist/lab → 422) | Middleware + `enforceFacilityAccess` + routes n'utilisent pas `addFacilityFilter` sur mutations | 🔴 Haute |
| 2 | **DELETE /consultations/[id] → 308 (redirect)** | Middleware ou route mal gérée pour DELETE | 🔴 Haute |
| 3 | **Cascade M-09 ne cascade pas** (diagnostics/traitements/labExams non annulés) | Les enfants créés n'ont pas le bon `consultationId` ou DELETE ne filtre pas correctement | 🔴 Haute |
| 4 | **Pharmacy dispense 422** même avec admin token | Validation `treatment.status` invalide ou facility mismatch sur treatment | 🟡 Moyenne |
| 5 | **Bed assign 422** | Patient déjà hospitalisé, ou episodeId invalide, ou facility mismatch | 🟡 Moyenne |

## Plan d'action

### Phase 1 — Isolation facility (blocante)
- [ ] Audit toutes les routes POST/PUT/DELETE : utiliser `addFacilityFilter` / `enforceFacilityAccess` systématiquement
- [ ] Harmoniser : doctor/pharmacist/lab ne doivent créer que dans leur facility (ou via admin)
- [ ] Test : créer patient + consultation + traitement + lab + dispense en one-shot par rôle

### Phase 2 — Cascade M-09 (annulation consultation)
- [ ] Vérifier `DELETE /consultations/[id]` : pourquoi 308 ? (middleware OPTIONS ?)
- [ ] Corriger cascade children : `diagnostics.isValidated=false`, `treatments.status=CANCELLED`, `labExams.status=CANCELLED`
- [ ] Ajouter test unitaire/integration pour DELETE cascade

### Phase 3 — Cascades métier restantes
- [ ] Dispense : fixer validation (status treatment = PRESCRIBED requis)
- [ ] Bed assign : fixer validation (patient libre, episode valide, facility alignée)
- [ ] Reception commande : confirmer mouvements + batches (déjà OK)

### Phase 4 — Tests d'intégration automatisés
- [ ] Script cascade complet (ce .ps1) en CI/CD
- [ ] Nettoyage auto test data (soft-delete patient cascade)

## Fichiers à revoir
- `src/app/api/v1/consultations/[id]/route.ts` (DELETE + 308)
- `src/app/api/v1/treatments/route.ts`, `lab/exams/route.ts`, `diagnostics/route.ts` (facility filter sur POST)
- `src/app/api/v1/pharmacy/dispense/route.ts` (validation)
- `src/app/api/v1/hospitalization/beds/[id]/assign/route.ts` (validation)
- `src/lib/api-errors.ts` (`addFacilityFilter`, `enforceFacilityAccess`)