export const AUDIT_PROMPTS: Record<string, string> = {
  'B-01': `Crée un module Triage complet pour l'app Dhayaro (Next.js 15, React 19, TypeScript, Drizzle ORM).
- src/app/api/v1/triage/route.ts : API CRUD pour les signes vitaux (tension, pouls, température, SpO2, poids, taille), évaluation priorité (Manchester/NEWS), orientation patient.
- src/views/triage/index.tsx : Vue liste avec file d'attente triage, formulaire de saisie des signes vitaux, score de priorité (couleur), orientation vers service.
- src/app/(app)/triage/page.tsx : Page route.
- src/components/layout/sidebar.tsx : Ajouter entrée "Triage" avec icône Stethoscope, permission ['NURSE', 'DOCTOR'].
- src/middleware.ts : Ajouter /api/v1/triage avec les rôles NURSE, DOCTOR, SPECIALIST.
- src/lib/permissions.ts : Ajouter triage aux permissions.
- src/lib/schema.ts : Vérifier que la table triage existe ou utiliser care_episodes avec episode_status='TRIAGE'.`,

  'B-02': `Crée un module Pharmacie pour Dhayaro.
- src/app/api/v1/pharmacy/route.ts : API pour la file d'attente pharmacie, validation de prescription, délivrance, historique.
- src/app/api/v1/pharmacy/stock/route.ts : API pour la gestion de stock (entrées, sorties, alertes seuil bas).
- src/views/pharmacy/index.tsx : Vue avec file d'attente, validation des prescriptions par pharmacien, interface de délivrance.
- src/app/(app)/pharmacy/page.tsx : Page route.
- src/components/layout/sidebar.tsx : Ajouter entrée "Pharmacie" avec icône Pill, permission ['PHARMACIST'].
- src/middleware.ts : Ajouter /api/v1/pharmacy pour PHARMACIST.`,

  'B-03': `Crée un module Hospitalisation pour Dhayaro.
- src/app/api/v1/hospitalization/route.ts : API pour admissions, lits, suivi quotidien, sorties.
- src/views/hospitalization/index.tsx : Vue liste des hospitalisés, interface d'admission, suivi constantes, sortie.
- src/app/(app)/hospitalization/page.tsx : Page route.
- src/components/layout/sidebar.tsx : Ajouter "Hospitalisation" icône Bed, permission ['DOCTOR', 'NURSE', 'SPECIALIST'].
- src/middleware.ts : Ajouter /api/v1/hospitalization.`,

  'B-04': `Finalise le Portail Patient Dhayaro. Remplace les appels à l'API dashboard par des appels dédiés.
- Crée src/app/api/v1/patient/consultations/route.ts : GET liste des consultations du patient connecté (filtré par patientId du token).
- Crée src/app/api/v1/patient/treatments/route.ts : GET liste des traitements.
- Crée src/app/api/v1/patient/lab-exams/route.ts : GET liste des examens de laboratoire.
- Modifie src/views/patient-consultations/index.tsx : useQuery avec '/patient/consultations' au lieu de '/dashboard'.
- Modifie src/views/patient-treatments/index.tsx : useQuery avec '/patient/treatments'.
- Modifie src/views/patient-lab-exams/index.tsx : useQuery avec '/patient/lab-exams'.
- Ajoute la recherche (paramètre search) sur chaque vue patient.
- Vérifie que src/middleware.ts a /api/v1/patient dans PUBLIC_PATHS ou restreint à PATIENT.`,

  'C-01': `Convertit la vue [VIEW] en pagination serveur côté client.
Dans src/views/[view]/index.tsx :
1. Supprime les imports de useMemo.
2. Supprime la constante ITEMS_PER_PAGE.
3. Supprime filtered (useMemo) et paginated (slice).
4. Remplace les appels API sans paramètres par :
   const searchParams = [\`page=\${currentPage}\`, 'size=10', ...(search ? [\`search=\${search}\`] : [])].join('&')
5. Remplace data par items = (data?.items ?? [])
6. Utilise totalCount = data?.total ?? 0 pour la pagination.
7. Remplace filtered.length par totalCount dans l'affichage.
8. Remplace paginated.map par items.map.

Puis ajoute la recherche ILIKE dans l'API route :
   import { ilike, or } from 'drizzle-orm'
   const { search } = parsePagination(searchParams)
   if (search) conditions.push(or(ilike(champ, '%\${search}%')))`,

  'C-02': `Ajoute la validation des doublons dans POST /api/v1/patients.
Dans src/app/api/v1/patients/route.ts, après le parsing du body :
   import { eq, and, or } from 'drizzle-orm'
   const { firstname, lastname, phone, email } = body
   const existing = await getDb().select({ id: patients.id })
     .from(patients)
     .where(and(eq(patients.firstname, firstname), eq(patients.lastname, lastname),
       or(phone ? eq(patients.phone, phone) : undefined, email ? eq(patients.email, email) : undefined)))
     .limit(1)
   if (existing.length > 0) return apiError(409, 'Un patient avec ce nom et téléphone existe déjà')`,

  'C-03': `Remplace le stockage localStorage du refresh token par un cookie httpOnly.
1. POST /api/v1/auth/login/route.ts : response.cookies.set('dhayaro_refresh_token', refresh_token, { httpOnly: true, secure: true, sameSite: 'strict', path: '/api/v1/auth/refresh', maxAge: 7*24*3600 })
2. POST /api/v1/auth/refresh/route.ts : lire depuis le cookie (request.cookies.get('dhayaro_refresh_token')?.value)
3. src/services/api.ts : credentials: 'include', supprimer lecture localStorage
4. src/store/auth-store.ts : supprimer dhayaro_refresh_token des state/setters`,

  'C-04': `Restreint DELETE /api/v1/patients/[id] aux seuls ADMIN et SUPER_ADMIN.
Dans src/app/api/v1/patients/[id]/route.ts :
   if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
     return apiError(403, 'Seuls les administrateurs peuvent supprimer un patient')
   }`,

  'C-05': `Remplace la suppression physique par un soft-delete dans DELETE /api/v1/diagnostics/[id].
1. Vérifie is_active dans src/lib/schema.ts pour diagnostics.
2. Remplace db.delete(diagnostics) par db.update(diagnostics).set({ is_active: false }).
3. GET /api/v1/diagnostics : ajoute eq(diagnostics.isActive, true) aux conditions.`,

  'C-06': `Même correctif que C-05 pour src/app/api/v1/lab/exams/[id]/route.ts :
   await getDb().update(labExams).set({ is_active: false }).where(eq(labExams.id, id))
ET ajoute eq(labExams.isActive, true) dans GET /api/v1/lab/exams.`,

  'C-07': `Uniformise le comportement DELETE : soft-delete partout.
- Diagnostics, LabExams : is_active = false.
- Consultations : garder le statut CANCELLED.
- Ajouter is_active aux schémas manquants dans src/lib/schema.ts.`,

  'C-08': `Ajoute un audit trail automatique sur toutes les mutations CRUD.
1. Crée src/lib/audit.ts avec createAuditEntry(action, entityType, entityId, userId, facilityId, oldValues?, newValues?).
2. Dans chaque API POST/PUT/DELETE : await createAuditEntry({ action: 'CREATE', entityType: 'patient', ... }).
3. Couvre : patients, consultations, diagnostics, treatments, lab/exams, documents.`,

  'M-01': `Dans src/components/layout/sidebar.tsx, ajoute permission: ['DASHBOARD_VIEW'] à l'entrée Tableau de bord.
Ajoute DASHBOARD_VIEW dans les permissions de tous les rôles dans src/lib/permissions.ts.`,

  'M-02': `Dans src/middleware.ts, ajoute dans ROLE_ROUTES :
   '/api/v1/patients': ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'LABORATORY', 'PHARMACIST', 'NURSE', 'ACCOUNTANT', 'ARCHIVIST']
   '/api/v1/consultations': ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'LABORATORY', 'NURSE', 'ACCOUNTANT', 'ARCHIVIST']
   '/api/v1/treatments': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'NURSE', 'PHARMACIST']
   '/api/v1/prescriptions': ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'PHARMACIST']`,

  'M-03': `Dans src/views/patients/index.tsx, remplace :
   const { data, isLoading } = usePatientsData()
par :
   const searchParams = \`page=\${currentPage}&size=10&search=\${search}\`
   const { data, isLoading } = usePatientsData(searchParams)
Ajoute le support search dans GET /api/v1/patients avec ilike sur firstname, lastname, phone, email.`,

  'M-04': `Dans src/views/patients/index.tsx, enlève le required du champ téléphone :
   <Input {...register('phone')} /> (supprime required: 'Le téléphone est requis')`,

  'M-05': `Dans src/hooks/use-data.ts, modifie useSettings() pour ne pas passer par transformKeys :
   const raw = await fetchRaw('/settings')
   return raw  // pas de transformKeys`,

  'M-06': `Dans src/views/consultations/index.tsx :
1. Import useAuthStore et currentFacility.
2. Passe currentFacility à useUsersData pour filtrer par facilityId.
3. Ou filtre côté client : usersList.filter(u => u.facilityId === currentFacility).`,

  'M-07': `Crée une vue Prescriptions standalone :
1. src/app/(app)/prescriptions/page.tsx : page route.
2. src/views/prescriptions/index.tsx : vue liste avec recherche, pagination serveur, statuts.
3. src/components/layout/sidebar.tsx : ajouter entrée "Prescriptions" icône ClipboardList.
4. src/middleware.ts : ajouter /api/v1/prescriptions.`,

  'A-01': `Ajoute validation format RDC dans POST /api/v1/patients :
   if (phone && !/^\\+243\\d{9}$/.test(phone)) return apiError(400, 'Le téléphone doit être au format +243 XX XXX XXXX')`,

  'A-02': `Dans src/services/api.ts, améliore la gestion d'erreur par code HTTP :
   if (res.status === 401) handleRefresh()
   if (res.status === 403) toast.error('Accès refusé')
   if (res.status === 404) toast.error('Ressource introuvable')
   if (res.status === 409) toast.error('Conflit : doublon détecté')
   if (res.status === 422) toast.error('Données invalides')
   if (res.status >= 500) toast.error('Erreur serveur')`,

  'A-03': `Ajoute pagination à useUsersData() et useFacilitiesData() :
   useUsersData(facilityId?, page?, size?, search?)
   useFacilitiesData(page?, size?)`,

  'A-04': `Dans GET /api/v1/dashboard/stats, assure un retour par défaut :
   return NextResponse.json({ stats: { consultations: 0, patients: 0, ... }, charts: { consultations: [], patients: [], ... } })`,

  'A-05': `Ajoute à useRoleDashboardData() :
   staleTime: 30 * 1000, refetchInterval: 60 * 1000`,

  'A-06': `Persiste les préférences darkMode/sidebarOpen via PUT /api/v1/settings.
Dans src/store/index.ts, appelle PUT /api/v1/settings à chaque changement.
useEffect initial : GET /api/v1/settings pour restaurer.`,

  'A-07': `Dans header.tsx, au clic notification :
   await fetch('/api/v1/notifications/read', { method: 'POST', body: JSON.stringify({ ids: [id] }) })
   Puis invalider la query et mettre à jour le compteur.`,

  'A-08': `Ajoute un select "Issue de sortie" dans le formulaire care-episodes :
   <Select name="dischargeOutcome">
     <SelectItem value="GUERISON">Guérison</SelectItem>
     <SelectItem value="DECES">Décès</SelectItem>
     <SelectItem value="TRANSFERT">Transfert</SelectItem>
     <SelectItem value="ABANDON">Abandon</SelectItem>
   </Select>`,

  'A-09': `Applique la pagination serveur à queue/index.tsx :
   const searchParams = \`page=\${currentPage}&size=10&search=\${search}&status=\${statusFilter}\`
   const { data } = useQueueData(searchParams)
   const totalPages = Math.ceil((data?.total ?? 0) / 10)
Puis ajoute search + pagination dans GET /api/v1/queue.`,

  'A-10': `Dans src/lib/utils.ts, ajoute timeZone: 'Africa/Lubumbashi' aux options Intl.DateTimeFormat
dans formatDate() et formatDateTime().`,

  'A-11': `Dans lab/exams/route.ts et archives/route.ts :
   if (JSON.stringify(body.results).length > 10 * 1024 * 1024)
     return apiError(413, 'Payload trop volumineux (max 10MB)')`,

  'A-12': `Dans src/lib/seed.ts, avant d'insérer avec FK, vérifie l'existence des parents :
   const facilities = await getDb().select().from(facilities)
   if (facilities.length === 0) créer d'abord les établissements`,

  'A-13': `Modifie genConsultationNumber() pour qu'il soit unique par facilityId :
   const last = await getDb().select({ num: consultations.consultationNumber })
     .from(consultations).where(eq(consultations.facilityId, facilityId))
     .orderBy(desc(consultations.createdAt)).limit(1)`,

  'A-14': `Dans GET /api/v1/dashboard/stats, filtre selon le rôle :
   if (role === 'DOCTOR') filtrer ses propres consultations
   if (role === 'NURSE') filtrer par service`,

  'UX-01': `Ajoute Skeleton dans chaque vue liste. Afficher 5-10 lignes skeleton quand isLoading est true.`,

  'UX-06': `Dans les vues paginées, ajoute : <p>{totalCount} résultat{totalCount > 1 ? 's' : ''}</p>`,

  'S-03': `Dans chaque API route avec [id] :
   import { sanitizeUuid } from '@/lib/validation'
   const id = sanitizeUuid(params.id)
   if (!id) return apiError(400, 'ID invalide')`,

  'S-07': `Dans POST /api/v1/auth/login, en cas d'échec :
   console.warn('[AUTH] Échec', { email, ip: request.headers.get('x-forwarded-for'), time: new Date() })`,

  'P-02': `Ajoute des index Drizzle dans schema.ts :
   patients: index('idx_patients_firstname_lastname').on(patients.firstname, patients.lastname)
   consultations: index('idx_consultations_patient_id').on(consultations.patientId)`,

  'P-03': `Ajoute staleTime: 30_000 et gcTime: 300_000 sur chaque useQuery dans use-data.ts.`,

  'P-06': `Remplace .select() par .select({ champs ciblés }) dans les API routes.`,
}
