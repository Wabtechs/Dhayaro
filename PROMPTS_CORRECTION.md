# Prompts de Correction — Audit Fonctionnel Dhayaro

Chaque entrée décrit le problème et donne un prompt prêt à l'emploi pour corriger le bug avec un assistant IA.

---

## 🔴 Bloquantes

### B-01 — Triage non implémenté

**Problème :** Aucun module Triage n'existe. Pas de vue, pas d'API CRUD, pas d'entrée sidebar, pas de permissions. Le `episode_status` existe dans le schéma mais aucune fonctionnalité de triage n'est développée.

**Prompt :**
```
Crée un module Triage complet pour l'app Dhayaro (Next.js 15, React 19, TypeScript, Drizzle ORM).
- src/app/api/v1/triage/route.ts : API CRUD pour les signes vitaux (tension, pouls, température, SpO2, poids, taille), évaluation priorité (Manchester/NEWS), orientation patient.
- src/views/triage/index.tsx : Vue liste avec file d'attente triage, formulaire de saisie des signes vitaux, score de priorité (couleur), orientation vers service.
- src/app/(app)/triage/page.tsx : Page route.
- src/components/layout/sidebar.tsx : Ajouter entrée "Triage" avec icône Stethoscope, permission ['NURSE', 'DOCTOR'].
- src/middleware.ts : Ajouter /api/v1/triage avec les rôles NURSE, DOCTOR, SPECIALIST.
- src/lib/permissions.ts : Ajouter triage aux permissions.
- src/lib/schema.ts : Vérifier que la table triage existe ou utiliser care_episodes avec episode_status='TRIAGE'.
```

---

### B-02 — Pharmacie non implémentée

**Problème :** Aucun module Pharmacie. Pas de vue dédiée, pas de gestion de stock, pas d'interface de délivrance des prescriptions.

**Prompt :**
```
Crée un module Pharmacie pour Dhayaro.
- src/app/api/v1/pharmacy/route.ts : API pour la file d'attente pharmacie, validation de prescription, délivrance, historique.
- src/app/api/v1/pharmacy/stock/route.ts : API pour la gestion de stock (entrées, sorties, alertes seuil bas).
- src/views/pharmacy/index.tsx : Vue avec file d'attente, validation des prescriptions par pharmacien, interface de délivrance.
- src/app/(app)/pharmacy/page.tsx : Page route.
- src/components/layout/sidebar.tsx : Ajouter entrée "Pharmacie" avec icône Pill, permission ['PHARMACIST'].
- src/middleware.ts : Ajouter /api/v1/pharmacy pour PHARMACIST.
```

---

### B-03 — Hospitalisation non implémentée

**Problème :** Aucun module Hospitalisation. Pas de gestion des lits, suivi quotidien, constantes hospitalières, lettre de sortie.

**Prompt :**
```
Crée un module Hospitalisation pour Dhayaro.
- src/app/api/v1/hospitalization/route.ts : API pour admissions, lits, suivi quotidien, sorties.
- src/views/hospitalization/index.tsx : Vue liste des hospitalisés, interface d'admission, suivi constantes, sortie.
- src/app/(app)/hospitalization/page.tsx : Page route.
- src/components/layout/sidebar.tsx : Ajouter "Hospitalisation" icône Bed, permission ['DOCTOR', 'NURSE', 'SPECIALIST'].
- src/middleware.ts : Ajouter /api/v1/hospitalization.
```

---

### B-04 — Portail Patient non finalisé

**Problème :** Les routes `/patient/*` existent mais les vues utilisent l'API dashboard au lieu d'APIs dédiées.

**Prompt :**
```
Finalise le Portail Patient Dhayaro. Remplace les appels à l'API dashboard par des appels dédiés.
- Crée src/app/api/v1/patient/consultations/route.ts : GET liste des consultations du patient connecté (filtré par patientId du token).
- Crée src/app/api/v1/patient/treatments/route.ts : GET liste des traitements.
- Crée src/app/api/v1/patient/lab-exams/route.ts : GET liste des examens de laboratoire.
- Modifie src/views/patient-consultations/index.tsx : useQuery avec '/patient/consultations' au lieu de '/dashboard'.
- Modifie src/views/patient-treatments/index.tsx : useQuery avec '/patient/treatments'.
- Modifie src/views/patient-lab-exams/index.tsx : useQuery avec '/patient/lab-exams'.
- Ajoute la recherche (paramètre search) sur chaque vue patient.
- Vérifie que src/middleware.ts a /api/v1/patient dans PUBLIC_PATHS ou restreint à PATIENT.
```

---

## 🟠 Critiques

### C-01 — Pagination côté client

**Problème :** Tous les éléments sont chargés en mémoire puis filtrés/triés côté client. Inutilisable avec des données réelles.

**Prompt :**
```
Convertit la vue [VIEW] en pagination serveur côté client.
Dans src/views/[view]/index.tsx :
1. Supprime les imports de useMemo.
2. Supprime la constante ITEMS_PER_PAGE.
3. Supprime filtered (useMemo) et paginated (slice).
4. Remplace les appels API sans paramètres par :
   const searchParams = [
     `page=${currentPage}`,
     'size=10',
     ...(search ? [`search=${search}`] : []),
   ].join('&')
5. Remplace data par items = (data?.items ?? [])
6. Utilise totalCount = data?.total ?? 0 pour la pagination.
7. Remplace filtered.length par totalCount dans l'affichage.
8. Remplace paginated.map par items.map.

Puis ajoute la recherche ILIKE dans l'API route correspondante :
   import { ilike, or } from 'drizzle-orm'
   const { search } = parsePagination(searchParams)
   if (search) conditions.push(or(ilike(champ1, '%${search}%'), ilike(champ2, '%${search}%')))
   WHERE: ajoute un LEFT JOIN sur la table concernée si nécessaire.
```

---

### C-02 — Aucune validation des doublons patients

**Problème :** On peut créer plusieurs patients avec le même nom + téléphone.

**Prompt :**
```
Ajoute la validation des doublons dans POST /api/v1/patients.
Dans src/app/api/v1/patients/route.ts, après le parsing du body :
   import { eq, and, or } from 'drizzle-orm'
   
   const { firstname, lastname, phone, email, dateOfBirth } = body
   const existing = await getDb().select({ id: patients.id })
     .from(patients)
     .where(and(
       eq(patients.firstname, firstname),
       eq(patients.lastname, lastname),
       or(
         phone ? eq(patients.phone, phone) : undefined,
         email ? eq(patients.email, email) : undefined,
       )
     ))
     .limit(1)
   if (existing.length > 0) {
     return apiError(409, 'Un patient avec ce nom et téléphone existe déjà')
   }
```

---

### C-03 — Refresh token non sécurisé

**Problème :** Le refresh token est stocké dans localStorage (vulnérable XSS).

**Prompt :**
```
Remplace le stockage localStorage du refresh token par un cookie httpOnly.
1. Dans POST /api/v1/auth/login/route.ts et /patient-login/route.ts, après génération du refresh_token :
     const response = NextResponse.json({ access_token, user })
     response.cookies.set('dhayaro_refresh_token', refresh_token, {
       httpOnly: true, secure: true, sameSite: 'strict',
       path: '/api/v1/auth/refresh', maxAge: 7 * 24 * 3600,
     })
     return response
   
2. Dans POST /api/v1/auth/refresh/route.ts, lire depuis le cookie :
     const refreshToken = request.cookies.get('dhayaro_refresh_token')?.value
   (au lieu du body JSON)

3. Dans src/services/api.ts, ajouter credentials: 'include' aux fetch.
   Supprimer la lecture de dhayaro_refresh_token depuis localStorage.

4. Dans src/store/auth-store.ts, supprimer dhayaro_refresh_token des state/setters.
```

---

### C-04 — DELETE patients ouvert à DOCTOR

**Problème :** Un médecin peut supprimer un dossier patient.

**Prompt :**
```
Restreint DELETE /api/v1/patients/[id] aux seuls ADMIN et SUPER_ADMIN.
Dans src/app/api/v1/patients/[id]/route.ts, change la condition de rôle :
   if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
     return apiError(403, seuls les administrateurs peuvent supprimer un patient')
   }
```

---

### C-05 — Diagnostic DELETE supprime physiquement

**Problème :** Suppression physique au lieu de soft-delete pour les diagnostics.

**Prompt :**
```
Remplace la suppression physique par un soft-delete dans DELETE /api/v1/diagnostics/[id].
1. Vérifie que la colonne is_active existe dans src/lib/schema.ts pour diagnostics.
2. Dans src/app/api/v1/diagnostics/[id]/route.ts, remplace :
     await getDb().delete(diagnostics).where(eq(diagnostics.id, id))
   par :
     await getDb().update(diagnostics).set({ is_active: false }).where(eq(diagnostics.id, id))
3. Dans GET /api/v1/diagnostics, ajoute eq(diagnostics.isActive, true) aux conditions.
```

---

### C-06 — LabExam DELETE supprime physiquement

**Problème :** Même problème que C-05 pour les examens de laboratoire.

**Prompt :**
```
Même correctif que C-05 mais pour src/app/api/v1/lab/exams/[id]/route.ts :
   await getDb().update(labExams).set({ is_active: false }).where(eq(labExams.id, id))
ET ajoute eq(labExams.isActive, true) dans GET /api/v1/lab/exams.
```

---

### C-07 — Incohérence DELETE entre modules

**Problème :** Les consultations utilisent CANCELLED (bon) mais diagnostics/examens utilisent delete physique (mauvais).

**Prompt :**
```
Uniformise le comportement DELETE : soft-delete partout.
- Diagnostics, LabExams : is_active = false (fix C-05, C-06).
- Consultations : garder le statut CANCELLED (déjà fait).
- Patients : ne jamais supprimer, juste désactiver is_active.
- Ajouter is_active aux schémas manquants dans src/lib/schema.ts.
```

---

### C-08 — Aucun audit trail

**Problème :** Les actions utilisateur (création, modification, suppression) ne sont pas tracées.

**Prompt :**
```
Ajoute un audit trail automatique sur toutes les mutations CRUD.
1. Crée src/lib/audit.ts :
   export async function createAuditEntry(params: {
     action: 'CREATE' | 'UPDATE' | 'DELETE',
     entityType: string, entityId: string,
     userId: string, facilityId?: string,
     oldValues?: Record<string, unknown>, newValues?: Record<string, unknown>,
   }) { ... insert dans table audit ... }

2. Dans chaque API route POST/PUT/DELETE, après l'opération :
     await createAuditEntry({
       action: 'CREATE', entityType: 'patient', entityId: newPatient.id,
       userId: auth.user.id, facilityId: auth.user.facilityId,
       newValues: { firstname, lastname, ... }
     })

3. Couvre au minimum ces endpoints :
   - patients (POST, PUT, DELETE)
   - consultations (POST, PUT, DELETE)
   - diagnostics (POST, PUT, DELETE)
   - treatments (POST, PUT, DELETE)
   - lab/exams (POST, PUT, DELETE)
   - documents (POST, PUT, DELETE)
```

---

## 🟡 Majeures

### M-01 — Sidebar ne cache pas le Dashboard

**Problème :** L'entrée "Tableau de bord" dans la sidebar n'a pas de permission définie.

**Prompt :**
```
Dans src/components/layout/sidebar.tsx, ajoute permission: ['DASHBOARD_VIEW'] à l'entrée Tableau de bord.
Ajoute DASHBOARD_VIEW dans les permissions de tous les rôles dans src/lib/permissions.ts.
Ou plus simplement, rends-le accessible à tous les rôles : permission: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', ...]
```

---

### M-02 — Middleware ne couvre pas toutes les API

**Problème :** Plusieurs routes API n'ont pas de restriction de rôle dans le middleware.

**Prompt :**
```
Dans src/middleware.ts, ajoute les routes manquantes dans ROLE_ROUTES :
   '/api/v1/patients': ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', ...]
   '/api/v1/consultations': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'NURSE', ...]
   '/api/v1/treatments': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'NURSE', 'PHARMACIST']
   '/api/v1/prescriptions': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'PHARMACIST']
```

---

### M-03 — Recherche patients pas transmise à l'API

**Problème :** Le champ de recherche filtre côté client, pas côté serveur.

**Prompt :**
```
Dans src/views/patients/index.tsx, remplace :
   const { data, isLoading } = usePatientsData()
par :
   const searchParams = `page=${currentPage}&size=10&search=${search}`
   const { data, isLoading } = usePatientsData(searchParams)
Ajoute le support search dans GET /api/v1/patients avec ilike sur firstname, lastname, phone, email.
```

---

### M-04 — Téléphone required en frontend mais optionnel en API

**Problème :** Incohérence validation frontend/backend.

**Prompt :**
```
Dans src/views/patients/index.tsx, enlève le required du champ téléphone :
   <Input {...register('phone')} />
   (supprime required: 'Le téléphone est requis')
```

---

### M-05 — Settings bypass transformKeys

**Problème :** `useSettings()` passe par `transformKeys` qui altère les données JSONB.

**Prompt :**
```
Dans src/hooks/use-data.ts, modifie useSettings() pour ne pas passer par transformKeys :
   const raw = await fetchRaw('/settings')
   return raw  // pas de transformKeys
   // ou : transformer seulement les champs non-JSONB
```

---

### M-06 — Filtre médecins par établissement

**Problème :** Le formulaire consultation montre tous les médecins, pas seulement ceux de l'établissement courant.

**Prompt :**
```
Dans src/views/consultations/index.tsx :
1. Import useAuthStore et currentFacility.
2. Passe currentFacility à useUsersData pour filtrer par facilityId.
3. Ou filtre côté client : usersList.filter(u => u.facilityId === currentFacility).
```

---

### M-07 — Prescriptions standalone

**Problème :** Pas de vue dédiée pour lister les prescriptions.

**Prompt :**
```
Crée une vue Prescriptions standalone :
1. src/app/(app)/prescriptions/page.tsx : page route.
2. src/views/prescriptions/index.tsx : vue liste avec recherche, pagination serveur, statuts.
3. src/components/layout/sidebar.tsx : ajouter entrée "Prescriptions" icône ClipboardList.
4. src/middleware.ts : ajouter /api/v1/prescriptions.
```

---

## ⚠️ Avertissements

### A-01 — Validation format téléphone

**Problème :** Le champ téléphone accepte n'importe quel format.

**Prompt :**
```
Ajoute une validation du format téléphone RDC (+243 XX XXX XXXX) dans src/app/api/v1/patients/route.ts :
   if (phone && !/^\+243\d{9}$/.test(phone)) {
     return apiError(400, 'Le téléphone doit être au format +243 XX XXX XXXX')
   }
```

---

### A-02 — Gestion erreurs réseau spécifique

**Problème :** Toutes les erreurs API sont catchées en bloc, pas de distinction par code HTTP.

**Prompt :**
```
Dans src/services/api.ts, améliore la gestion d'erreur :
   if (res.status === 401) { handleRefresh() }
   if (res.status === 403) { toast.error('Accès refusé') }
   if (res.status === 404) { toast.error('Ressource introuvable') }
   if (res.status === 409) { toast.error('Conflit : doublon détecté') }
   if (res.status === 422) { toast.error('Données invalides') }
   if (res.status >= 500) { toast.error('Erreur serveur') }
```

---

### A-03 — Pagination Users/Facilities

**Problème :** `useUsersData()` et `useFacilitiesData()` chargent tout sans pagination.

**Prompt :**
```
Ajoute les paramètres de pagination aux hooks :
   useUsersData(facilityId?: string) accepte des paramètres search, page, size.
   useFacilitiesData() accepte page, size.
```

---

### A-04 — Dashboard stats API vides

**Problème :** `/api/v1/dashboard/stats` peut retourner des données vides ou nulles.

**Prompt :**
```
Dans l'API route dashboard/stats, assure un retour par défaut :
   return NextResponse.json({
     stats: { consultations: 0, patients: 0, ... },
     charts: { consultations: [], patients: [], ... }
   })
```

---

### A-05 — Auto-refresh dashboard

**Problème :** Pas de rafraîchissement automatique des données dashboard.

**Prompt :**
```
Ajoute refetchInterval et staleTime à useRoleDashboardData() :
   staleTime: 30 * 1000,
   refetchInterval: 60 * 1000,
```

---

### A-06 — Préférences non persistées

**Problème :** Les préférences darkMode/sidebarOpen ne sont pas persistées côté serveur.

**Prompt :**
```
Implémente la persistance des préférences utilisateur via l'API settings.
Dans src/store/index.ts, appelle PUT /api/v1/settings à chaque changement de darkMode.
Dans le useEffect initial, appelle GET /api/v1/settings pour restaurer les préférences.
```

---

### A-07 — Marquage notifications comme lues

**Problème :** Cliquer sur une notification ne la marque pas comme lue.

**Prompt :**
```
Dans src/components/layout/header.tsx, au clic sur une notification :
   await fetch('/api/v1/notifications/read', {
     method: 'POST',
     body: JSON.stringify({ ids: [notification.id] })
   })
   Puis invalider la query useNotifications et mettre à jour le compteur.
```

---

### A-08 — dischargeOutcome modifiable

**Problème :** Le champ dischargeOutcome n'est pas accessible dans le formulaire d'édition care-episodes.

**Prompt :**
```
Ajoute un champ select "Issue de sortie" dans le formulaire d'édition care-episodes :
   <Select name="dischargeOutcome">
     <SelectItem value="GUERISON">Guérison</SelectItem>
     <SelectItem value="DECES">Décès</SelectItem>
     <SelectItem value="TRANSFERT">Transfert</SelectItem>
     <SelectItem value="ABANDON">Abandon</SelectItem>
   </Select>
```

---

### A-09 — Recherche file attente en mémoire

**Problème :** `useQueueData()` charge 100 entrées puis filtre côté client.

**Prompt :**
```
Applique la pagination serveur à src/views/queue/index.tsx :
   const searchParams = `page=${currentPage}&size=10&search=${search}&status=${statusFilter}`
   const { data } = useQueueData(searchParams)
   const items = (data?.items ?? []) as QueueItem[]
   const totalPages = Math.ceil((data?.total ?? 0) / 10)
Puis ajoute le support search + pagination dans GET /api/v1/queue (parsePagination, ilike).
```

---

### A-10 — Timestamps sans fuseau horaire

**Problème :** Les dates affichées ne précisent pas le fuseau horaire (UTC vs UTC+2).

**Prompt :**
```
Dans src/lib/utils.ts, ajoute timeZone: 'Africa/Lubumbashi' aux options Intl.DateTimeFormat
dans formatDate() et formatDateTime().
```

---

### A-11 — Limite uploads JSON

**Problème :** Pas de limite de taille sur les champs JSON (résultats examens, archives).

**Prompt :**
```
Dans les API routes lab/exams et archives, ajoute une validation :
   if (JSON.stringify(body.results).length > 10 * 1024 * 1024) {
     return apiError(413, 'Payload trop volumineux (max 10MB)')
   }
```

---

### A-12 — Seed data clés étrangères

**Problème :** Les insertions seed ne vérifient pas l'existence des références.

**Prompt :**
```
Dans src/lib/seed.ts, avant d'insérer des données avec des foreign keys,
vérifie d'abord l'existence des enregistrements parents :
   const facilities = await getDb().select().from(facilities)
   if (facilities.length === 0) { ... créer d'abord les établissements ... }
```

---

### A-13 — ConsultationNumber unique par table

**Problème :** Le numéro de consultation est unique globalement, pas par établissement.

**Prompt :**
```
Modifie genConsultationNumber() dans src/app/api/v1/consultations/route.ts
pour qu'il soit unique par facilityId :
   const last = await getDb().select({ num: consultations.consultationNumber })
     .from(consultations)
     .where(eq(consultations.facilityId, facilityId))
     .orderBy(desc(consultations.createdAt))
     .limit(1)
```

---

### A-14 — Dashboard non filtré par rôle

**Problème :** Les données dashboard ne sont pas filtrées selon le rôle utilisateur.

**Prompt :**
```
Dans GET /api/v1/dashboard/stats, ajoute un filtre selon le rôle :
   if (role === 'DOCTOR') { ... ne montrer que ses propres consultations ... }
   if (role === 'NURSE') { ... filtrer par service ... }
```

---

## 💡 UX/UI

### UX-01 — Skeletons de chargement

**Problème :** Les listes n'ont pas d'état de chargement visuel.

**Prompt :**
```
Ajoute un composant Skeleton (@/components/ui/skeleton) dans chaque vue de liste.
Afficher 5-10 lignes skeleton quand isLoading est true.
```

---

### UX-06 — Nombre total d'éléments

**Problème :** Chaque page affiche "page X/Y" mais pas le total d'éléments.

**Prompt :**
```
Dans les vues paginées, ajoute :
   <p className="text-sm text-muted-foreground">
     {totalCount} résultat{totalCount > 1 ? 's' : ''}
   </p>
```

---

## 🔒 Sécurité

### S-03 — Validation UUID systématique

**Problème :** Les UUIDs passés en paramètres ne sont pas validés avant utilisation.

**Prompt :**
```
Dans chaque API route qui utilise un paramètre [id], ajoute :
   import { sanitizeUuid } from '@/lib/validation'
   const id = sanitizeUuid(params.id)
   if (!id) return apiError(400, 'ID invalide')
```

---

### S-07 — Journalisation tentatives échouées

**Problème :** Les tentatives de connexion échouées ne sont pas loggées.

**Prompt :**
```
Dans POST /api/v1/auth/login, ajoute un log en cas d'échec :
   console.warn('[AUTH] Échec connexion', { email, ip: request.headers.get('x-forwarded-for'), time: new Date() })
   // ou logger dans une table auth_logs
```

---

## ⚡ Performance

### P-02 — Indexation DB

**Problème :** Les champs WHERE/JOIN ne sont pas nécessairement indexés.

**Prompt :**
```
Ajoute des index Drizzle sur les champs fréquemment utilisés dans WHERE/JOIN :
   import { index } from 'drizzle-orm/pg-core'
   // Dans schema.ts, pour chaque table :
   patients: index('idx_patients_firstname_lastname').on(patients.firstname, patients.lastname),
   consultations: index('idx_consultations_patient_id').on(consultations.patientId),
   etc.
```

---

### P-03 — Cache TanStack Query

**Problème :** `staleTime` et `gcTime` ne sont pas configurés sur tous les hooks.

**Prompt :**
```
Ajoute staleTime et gcTime sur chaque useQuery dans src/hooks/use-data.ts :
   useQuery({
     queryKey: [...],
     queryFn: ...,
     staleTime: 30 * 1000,  // 30s avant revalidation
     gcTime: 5 * 60 * 1000, // 5min dans le cache
   })
```

---

### P-06 — Optimisation requêtes Drizzle

**Problème :** Beaucoup de requêtes SELECT * qui chargent des colonnes inutiles.

**Prompt :**
```
Dans les API routes, remplace les sélections larges par des SELECT ciblés :
   .select({ id: table.id, firstname: table.firstname, lastname: table.lastname })
   au lieu de
   .select()
```
