import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import {
  careEpisodes, episodeEntities, consultations, diagnostics, treatments,
  labExams, documents, clinicalKnowledgeBase, diseaseStatistics, archives, notifications
} from '@/lib/schema'
import { eq, and, sql } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { apiError, logError } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

function computeAgeRange(dateOfBirth: string | Date): string {
  const birth = new Date(dateOfBirth)
  const now = new Date()
  const age = Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  if (age < 5) return '0-4'
  if (age < 15) return '5-14'
  if (age < 25) return '15-24'
  if (age < 35) return '25-34'
  if (age < 45) return '35-44'
  if (age < 55) return '45-54'
  if (age < 65) return '55-64'
  if (age < 75) return '65-74'
  return '75+'
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const episodeId = sanitizeUuid(id)
    if (!episodeId) return apiError(400, 'Invalid episode ID')

    const db = getDb()
    const now = new Date()

    const [episode] = await db.select().from(careEpisodes).where(eq(careEpisodes.id, episodeId)).limit(1)
    if (!episode) return apiError(404, 'Episode not found')
    if (episode.isArchived) return apiError(400, 'Episode already archived')

    const entities = await db.select().from(episodeEntities).where(eq(episodeEntities.episodeId, episodeId))

    const consultIds = entities.filter(e => e.entityType === 'CONSULTATION').map(e => e.entityId)
    const diagIds = entities.filter(e => e.entityType === 'DIAGNOSIS').map(e => e.entityId)
    const treatIds = entities.filter(e => e.entityType === 'TREATMENT').map(e => e.entityId)
    const labIds = entities.filter(e => e.entityType === 'LAB_EXAM').map(e => e.entityId)
    const docIds = entities.filter(e => e.entityType === 'DOCUMENT').map(e => e.entityId)

    const [consultationsData, diagnosticsData, treatmentsData, labData, documentsData] = await Promise.all([
      consultIds.length > 0 ? db.select().from(consultations).where(sql`${consultations.id} IN ${consultIds}`) : Promise.resolve([]),
      diagIds.length > 0 ? db.select().from(diagnostics).where(sql`${diagnostics.id} IN ${diagIds}`) : Promise.resolve([]),
      treatIds.length > 0 ? db.select().from(treatments).where(sql`${treatments.id} IN ${treatIds}`) : Promise.resolve([]),
      labIds.length > 0 ? db.select().from(labExams).where(sql`${labExams.id} IN ${labIds}`) : Promise.resolve([]),
      docIds.length > 0 ? db.select().from(documents).where(sql`${documents.id} IN ${docIds}`) : Promise.resolve([]),
    ])

    const dischargeSummary = {
      episodeNumber: episode.episodeNumber,
      admitDate: episode.admitDate,
      dischargeDate: now,
      admitReason: episode.admitReason,
      consultationsCount: consultationsData.length,
      diagnosticsCount: diagnosticsData.length,
      treatmentsCount: treatmentsData.length,
      labExamsCount: labData.length,
      documentsCount: documentsData.length,
      diagnostics: diagnosticsData.map(d => ({ type: d.diagnosticType, description: d.description })),
      treatments: treatmentsData.map(t => ({ description: t.description, status: t.status })),
    }

    const outcome = (episode.dischargeOutcome as string) || 'AMELIORATION'
    const durationDays = Math.ceil((now.getTime() - new Date(episode.admitDate).getTime()) / (24 * 60 * 60 * 1000))

    const patientData = await db.select().from(careEpisodes).where(eq(careEpisodes.id, episodeId)).limit(1)
    const patientId = episode.patientId

    const symptomsList = consultationsData.flatMap(c => (c.symptoms as string[]) || [])
    const diagnosticsList = diagnosticsData.map(d => d.description)
    const treatmentsList = treatmentsData.map(t => t.description)
    const diseaseIds = diagnosticsData.filter(d => d.diseaseId).map(d => d.diseaseId as string)

    await db.insert(clinicalKnowledgeBase).values({
      id: crypto.randomUUID(),
      sourceEpisodeId: episodeId,
      ageRange: patientData[0] ? computeAgeRange(patientData[0].admitDate) : 'UNKNOWN',
      sex: 'OTHER',
      symptoms: [...new Set(symptomsList)],
      diagnostics: diagnosticsList,
      treatments: treatmentsList,
      examResults: { labCount: labData.length },
      evolution: outcome,
      durationDays,
      outcome,
      diseaseId: diseaseIds[0] || null,
      facilityId: episode.facilityId,
      isAnonymized: true,
      createdAt: now,
    })

    for (const diseaseId of diseaseIds) {
      const [existing] = await db.select().from(diseaseStatistics).where(eq(diseaseStatistics.diseaseId, diseaseId)).limit(1)
      if (existing) {
        await db.update(diseaseStatistics).set({
          totalCases: (existing.totalCases || 0) + 1,
          lastCalculated: now,
          updatedAt: now,
        }).where(eq(diseaseStatistics.diseaseId, diseaseId))
      }
    }

    await db.insert(archives).values({
      id: crypto.randomUUID(),
      facilityId: episode.facilityId,
      entityType: 'PATIENT_FILE',
      entityId: episodeId,
      patientId,
      title: `Épisode ${episode.episodeNumber} - Archivé`,
      summary: `Épisode archivé avec ${diagnosticsData.length} diagnostic(s) et ${treatmentsData.length} traitement(s)`,
      archivedBy: auth.user.sub,
      data: dischargeSummary as Record<string, unknown>,
      createdAt: now,
    })

    await db.update(careEpisodes).set({
      status: 'ARCHIVED',
      isArchived: true,
      dischargeDate: now,
      dischargeSummary: dischargeSummary as Record<string, unknown>,
      updatedAt: now,
    }).where(eq(careEpisodes.id, episodeId))

    if (episode.patientId) {
      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        userId: auth.user.sub,
        facilityId: episode.facilityId,
        title: 'Épisode archivé',
        message: `L'épisode ${episode.episodeNumber} a été archivé avec succès.`,
        type: 'SUCCESS',
        isRead: false,
        link: `/care-episodes/${episodeId}`,
        metadata: { episodeId, episodeNumber: episode.episodeNumber },
        createdAt: now,
      })
    }

    await logAudit(auth.user, 'UPDATE', 'care_episode', episodeId, {
      action: 'ARCHIVE',
      episodeNumber: episode.episodeNumber,
    })

    return NextResponse.json({ detail: 'Episode archived successfully', episodeId })
  } catch (e) {
    logError('POST /care-episodes/[id]/archive', e)
    return apiError(500, 'Internal server error')
  }
}
