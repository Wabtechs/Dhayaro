import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import {
  consultations, diagnostics, treatments,
  labExams, queue, documents, archives, careEpisodes,
  clinicalCases, facilities, users, notifications, patients, medications,
} from '@/lib/schema'
import { eq, ne, and, count, desc, gte, SQL } from 'drizzle-orm'
import { addFacilityFilter, apiError, logError } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

function buildMonthlyChart(items: Array<{ createdAt?: Date | string | null }>) {
  const map = new Map<string, number>()
  MONTH_NAMES.forEach(m => map.set(m, 0))
  items.forEach(item => {
    const d = item.createdAt ? new Date(item.createdAt) : null
    if (d && !isNaN(d.getTime())) {
      const m = MONTH_NAMES[d.getMonth()]
      map.set(m, (map.get(m) || 0) + 1)
    }
  })
  return MONTH_NAMES.map(name => ({ name, value: map.get(name) || 0 }))
}

function buildStatusChart(items: Array<{ status?: string }>, labels: Record<string, string>) {
  const counts = new Map<string, number>()
  items.forEach(item => {
    const label = labels[item.status || ''] || item.status || 'Inconnu'
    counts.set(label, (counts.get(label) || 0) + 1)
  })
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .filter(i => i.value > 0)
}

function compactAnd(...conditions: (SQL | undefined)[]): SQL | undefined {
  const valid = conditions.filter(c => c !== undefined) as SQL[]
  return valid.length > 0 ? and(...valid) : undefined
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const role = auth.user.role as string

    const isDoctor = role === 'DOCTOR'

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [
      consultationsCount,
      consultationsTodayCount,
      treatmentsTodayCount,
      patientsCount,
      diagnosticsCount,
      labExamsCount,
      treatmentsCount,
      queueCount,
      documentsCount,
      archivesCount,
      episodesCount,
      clinicalCasesCount,
      facilitiesCount,
      usersCount,
      notificationsCount,
      medicationsCount,
      archivedEpisodesCount,
      consultationItems,
      labExamItems,
      treatmentItems,
      queueItems,
      episodeItems,
      archiveItems,
      diagnosticItems,
      clinicalCaseItems,
    ] = await Promise.all([
      getDb().select({ total: count() }).from(consultations)
        .where(compactAnd(
          addFacilityFilter(consultations.facilityId, auth, searchParams),
          isDoctor ? eq(consultations.doctorId, auth.user.sub) : undefined,
        )),
      getDb().select({ total: count() }).from(consultations)
        .where(compactAnd(
          gte(consultations.createdAt, todayStart),
          addFacilityFilter(consultations.facilityId, auth, searchParams),
          isDoctor ? eq(consultations.doctorId, auth.user.sub) : undefined,
        )),
      getDb().select({ total: count() }).from(treatments)
        .where(compactAnd(
          gte(treatments.createdAt, todayStart),
          addFacilityFilter(treatments.facilityId, auth, searchParams),
        )),
      getDb().select({ total: count() }).from(patients)
        .where(compactAnd(
          eq(patients.isActive, true),
          addFacilityFilter(patients.facilityId, auth, searchParams),
        )),
      getDb().select({ total: count() }).from(diagnostics)
        .where(addFacilityFilter(diagnostics.facilityId, auth, searchParams)),
      getDb().select({ total: count() }).from(labExams)
        .where(compactAnd(
          addFacilityFilter(labExams.facilityId, auth, searchParams),
          isDoctor ? eq(labExams.doctorId, auth.user.sub) : undefined,
        )),
      getDb().select({ total: count() }).from(treatments)
        .where(compactAnd(
          addFacilityFilter(treatments.facilityId, auth, searchParams),
          isDoctor ? eq(treatments.doctorId, auth.user.sub) : undefined,
        )),
      getDb().select({ total: count() }).from(queue)
        .where(compactAnd(
          eq(queue.status, 'WAITING'),
          addFacilityFilter(queue.facilityId, auth, searchParams),
        )),
      getDb().select({ total: count() }).from(documents)
        .where(addFacilityFilter(documents.facilityId, auth, searchParams)),
      getDb().select({ total: count() }).from(archives)
        .where(addFacilityFilter(archives.facilityId, auth, searchParams)),
      getDb().select({ total: count() }).from(careEpisodes)
        .where(compactAnd(
          eq(careEpisodes.isArchived, false),
          addFacilityFilter(careEpisodes.facilityId, auth, searchParams),
        )),
      getDb().select({ total: count() }).from(clinicalCases)
        .where(addFacilityFilter(clinicalCases.facilityId, auth, searchParams)),
      getDb().select({ total: count() }).from(facilities)
        .where(eq(facilities.isActive, true)),
      getDb().select({ total: count() }).from(users)
        .where(and(eq(users.isActive, true), ne(users.role, 'PATIENT'))),
      getDb().select({ total: count() }).from(notifications)
        .where(compactAnd(
          eq(notifications.isRead, false),
          addFacilityFilter(notifications.facilityId, auth, searchParams),
        )),
      getDb().select({ total: count() }).from(medications)
        .where(eq(medications.isActive, true)),
      getDb().select({ total: count() }).from(careEpisodes)
        .where(eq(careEpisodes.isArchived, true)),
      getDb().select({ status: consultations.status, createdAt: consultations.createdAt }).from(consultations)
        .where(compactAnd(
          addFacilityFilter(consultations.facilityId, auth, searchParams),
          isDoctor ? eq(consultations.doctorId, auth.user.sub) : undefined,
        ))
        .orderBy(desc(consultations.createdAt)).limit(100),
      getDb().select({ status: labExams.status, createdAt: labExams.createdAt }).from(labExams)
        .where(compactAnd(
          addFacilityFilter(labExams.facilityId, auth, searchParams),
          isDoctor ? eq(labExams.doctorId, auth.user.sub) : undefined,
        ))
        .orderBy(desc(labExams.createdAt)).limit(100),
      getDb().select({ status: treatments.status, createdAt: treatments.createdAt }).from(treatments)
        .where(compactAnd(
          addFacilityFilter(treatments.facilityId, auth, searchParams),
          isDoctor ? eq(treatments.doctorId, auth.user.sub) : undefined,
        ))
        .orderBy(desc(treatments.createdAt)).limit(100),
      getDb().select({ status: queue.status, priority: queue.priority, createdAt: queue.createdAt }).from(queue)
        .where(addFacilityFilter(queue.facilityId, auth, searchParams))
        .orderBy(desc(queue.createdAt)).limit(100),
      getDb().select({ status: careEpisodes.status, createdAt: careEpisodes.createdAt }).from(careEpisodes)
        .where(compactAnd(
          eq(careEpisodes.isArchived, false),
          addFacilityFilter(careEpisodes.facilityId, auth, searchParams),
        ))
        .orderBy(desc(careEpisodes.createdAt)).limit(100),
      getDb().select({ entityType: archives.entityType, createdAt: archives.createdAt }).from(archives)
        .where(addFacilityFilter(archives.facilityId, auth, searchParams))
        .orderBy(desc(archives.createdAt)).limit(100),
      getDb().select({ diagnosticType: diagnostics.diagnosticType }).from(diagnostics)
        .where(addFacilityFilter(diagnostics.facilityId, auth, searchParams))
        .orderBy(desc(diagnostics.createdAt)).limit(100),
      getDb().select({ facilityId: clinicalCases.facilityId, createdAt: clinicalCases.createdAt }).from(clinicalCases)
        .where(addFacilityFilter(clinicalCases.facilityId, auth, searchParams))
        .orderBy(desc(clinicalCases.createdAt)).limit(100),
    ])

    const totalConsultations = consultationsCount[0]?.total ?? 0
    const totalPatients = patientsCount[0]?.total ?? 0
    const totalDiagnostics = diagnosticsCount[0]?.total ?? 0
    const totalLabExams = labExamsCount[0]?.total ?? 0
    const totalTreatments = treatmentsCount[0]?.total ?? 0
    const queueWaiting = queueCount[0]?.total ?? 0
    const totalDocuments = documentsCount[0]?.total ?? 0
    const totalArchives = archivesCount[0]?.total ?? 0
    const totalEpisodes = episodesCount[0]?.total ?? 0
    const totalClinicalCases = clinicalCasesCount[0]?.total ?? 0
    const totalFacilities = facilitiesCount[0]?.total ?? 0
    const totalUsers = usersCount[0]?.total ?? 0
    const unreadNotifications = notificationsCount[0]?.total ?? 0
    const totalMedications = medicationsCount[0]?.total ?? 0
    const archivedEpisodes = archivedEpisodesCount[0]?.total ?? 0
    const treatmentsToday = treatmentsTodayCount[0]?.total ?? 0

    const consultationsToday = consultationsTodayCount[0]?.total ?? 0

    const labPending = labExamItems.filter(i => i.status === 'REQUESTED').length
    const labInProgress = labExamItems.filter(i => i.status === 'IN_PROGRESS').length
    const labCompleted = labExamItems.filter(i => i.status === 'COMPLETED').length

    const activeEpisodes = episodeItems.filter(i =>
      ['ADMITTED', 'TRIAGE', 'CONSULTATION', 'TREATMENT', 'HOSPITALIZED'].includes(i.status)
    ).length

    const treatmentsPending = treatmentItems.filter(i => i.status === 'PRESCRIBED').length
    const treatmentsInProgress = treatmentItems.filter(i => i.status === 'IN_PROGRESS').length

    const facilityMapResult = await getDb().select({ id: facilities.id, name: facilities.name }).from(facilities)
    const facilityNameMap = Object.fromEntries(facilityMapResult.map(f => [f.id, f.name]))

    const casesByFacility = Object.entries(
      clinicalCaseItems.reduce((acc: Record<string, number>, item) => {
        const name = facilityNameMap[item.facilityId] || 'Inconnu'
        acc[name] = (acc[name] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }))

    const resolutionRate = totalConsultations > 0
      ? Math.round((consultationItems.filter(i => i.status === 'COMPLETED').length / totalConsultations) * 100)
      : 0

    const stats = {
      total_consultations: totalConsultations,
      total_patients: totalPatients,
      total_diagnostics: totalDiagnostics,
      total_lab_exams: totalLabExams,
      total_treatments: totalTreatments,
      total_documents: totalDocuments,
      total_archives: totalArchives,
      total_episodes: totalEpisodes,
      total_facilities: totalFacilities,
      total_users: totalUsers,
      total_clinical_cases: totalClinicalCases,
      total_reports: totalConsultations,
      unread_notifications: unreadNotifications,
      consultations_today: consultationsToday,
      queue_waiting: queueWaiting,
      lab_exams_pending: labPending,
      lab_exams_in_progress: labInProgress,
      lab_exams_completed: labCompleted,
      lab_exams_validated: labCompleted,
      lab_exams_total: totalLabExams,
      active_treatments: treatmentsInProgress,
      treatments_pending: treatmentsPending,
      prescriptions_pending: treatmentsPending,
      prescriptions_dispensed_today: treatmentsToday,
      hospitalized_patients: activeEpisodes,
      active_episodes: activeEpisodes,
      validated_diagnostics: totalDiagnostics,
      resolution_rate: resolutionRate,
      total_medications: totalMedications,
      archived_episodes: archivedEpisodes,
    }

    const charts = {
      consultationsByMonth: buildMonthlyChart(consultationItems),
      consultationsByStatus: buildStatusChart(consultationItems, {
        WAITING: 'En attente',
        IN_PROGRESS: 'En cours',
        COMPLETED: 'Terminée',
        CANCELLED: 'Annulée',
      }),
      labExamsByMonth: buildMonthlyChart(labExamItems),
      labExamsByStatus: buildStatusChart(labExamItems, {
        REQUESTED: 'Demandé',
        IN_PROGRESS: 'En cours',
        COMPLETED: 'Terminé',
        CANCELLED: 'Annulé',
      }),
      treatmentsByMonth: buildMonthlyChart(treatmentItems),
      treatmentsByStatus: buildStatusChart(treatmentItems, {
        PRESCRIBED: 'Prescrit',
        IN_PROGRESS: 'En cours',
        COMPLETED: 'Terminé',
        CANCELLED: 'Annulé',
        SUSPENDED: 'Suspendu',
      }),
      episodesByMonth: buildMonthlyChart(episodeItems),
      episodesByStatus: buildStatusChart(episodeItems, {
        ADMITTED: 'Admis',
        TRIAGE: 'Triage',
        CONSULTATION: 'Consultation',
        TREATMENT: 'Traitement',
        HOSPITALIZED: 'Hospitalisé',
        DISCHARGED: 'Sorti',
        TRANSFERRED: 'Transféré',
        ARCHIVED: 'Archivé',
      }),
      queueByPriority: buildStatusChart(queueItems.map(i => ({ status: i.priority })), {
        LOW: 'Faible',
        NORMAL: 'Normale',
        HIGH: 'Élevée',
        URGENT: 'Urgente',
      }),
      casesByStatus: [{ name: 'Actif', value: totalClinicalCases }],
      casesByFacility: casesByFacility.length > 0 ? casesByFacility : [{ name: 'Aucun', value: 0 }],
      archivesByMonth: buildMonthlyChart(archiveItems),
      archivesByType: buildStatusChart(archiveItems.map(a => ({ status: a.entityType })), {}),
      diagnosticsByType: buildStatusChart(diagnosticItems.map(d => ({ status: d.diagnosticType })), {
        PROVISIONAL: 'Provisoire',
        FINAL: 'Final',
        DIFFERENTIAL: 'Différentiel',
      }),
    }

    return NextResponse.json({ role, stats, charts })
  } catch (e) {
    logError('GET /dashboard/stats', e)
    return apiError(500, 'Internal server error')
  }
}
