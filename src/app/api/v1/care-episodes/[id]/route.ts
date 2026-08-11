import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { careEpisodes, patients, episodeEntities, consultations, diagnostics, treatments, labExams, documents } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, enforceFacilityAccess, apiError, handleEndpointError, pickAllowedKeys } from '@/lib/api-errors'
import { logAudit } from '@/lib/audit'
import { logPatientEvent, EVENT_TITLES } from '@/lib/patient-history'
import { requireAuth, requireRole } from '@/lib/auth'
import { parseJsonBody, careEpisodeUpdateSchema } from '@/lib/api-schemas'

const ALLOWED_UPDATE_KEYS = ['status', 'dischargeDate', 'dischargeSummary', 'dischargeOutcome', 'isArchived', 'metadata', 'admitReason'] as const

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const episodeId = sanitizeUuid(id)
    if (!episodeId) return apiError(400, 'Invalid episode ID')

    const db = getDb()

    const conditions = [eq(careEpisodes.id, episodeId)]
    const facilityFilter = addFacilityFilter(careEpisodes.facilityId, auth)
    if (facilityFilter) conditions.push(facilityFilter)

    const [episode] = await db.select({
      id: careEpisodes.id,
      facilityId: careEpisodes.facilityId,
      patientId: careEpisodes.patientId,
      episodeNumber: careEpisodes.episodeNumber,
      status: careEpisodes.status,
      admitDate: careEpisodes.admitDate,
      dischargeDate: careEpisodes.dischargeDate,
      admitReason: careEpisodes.admitReason,
      dischargeSummary: careEpisodes.dischargeSummary,
      dischargeOutcome: careEpisodes.dischargeOutcome,
      isArchived: careEpisodes.isArchived,
      metadata: careEpisodes.metadata,
      createdAt: careEpisodes.createdAt,
      updatedAt: careEpisodes.updatedAt,
      patientFirstname: patients.firstname,
      patientLastname: patients.lastname,
      patientSex: patients.sex,
      patientDateOfBirth: patients.dateOfBirth,
    })
    .from(careEpisodes)
    .leftJoin(patients, eq(careEpisodes.patientId, patients.id))
    .where(and(...conditions))
    .limit(1)

    if (!episode) return apiError(404, 'Episode not found')

    const entities = await db.select().from(episodeEntities).where(eq(episodeEntities.episodeId, episodeId))

    const entityData: Record<string, unknown[]> = {}
    for (const entity of entities) {
      const type = entity.entityType.toLowerCase() + 's'
      let rows: unknown[] = []
      switch (entity.entityType) {
        case 'CONSULTATION':
          rows = await db.select().from(consultations).where(eq(consultations.id, entity.entityId)).limit(1)
          break
        case 'DIAGNOSIS':
          rows = await db.select().from(diagnostics).where(eq(diagnostics.id, entity.entityId)).limit(1)
          break
        case 'TREATMENT':
          rows = await db.select().from(treatments).where(eq(treatments.id, entity.entityId)).limit(1)
          break
        case 'LAB_EXAM':
          rows = await db.select().from(labExams).where(eq(labExams.id, entity.entityId)).limit(1)
          break
        case 'DOCUMENT':
          rows = await db.select().from(documents).where(eq(documents.id, entity.entityId)).limit(1)
          break
      }
      if (!entityData[type]) entityData[type] = []
      entityData[type].push(...rows)
    }

    return NextResponse.json({ ...episode, entities: entityData })
  } catch (e) {
    return handleEndpointError(e, 'GET /care-episodes/[id]')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'NURSE'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const episodeId = sanitizeUuid(id)
    if (!episodeId) return apiError(400, 'Invalid episode ID')

    const parsed = await parseJsonBody(request, careEpisodeUpdateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body
    const db = getDb()

    const conditions = [eq(careEpisodes.id, episodeId)]
    const facilityFilter = addFacilityFilter(careEpisodes.facilityId, auth)
    if (facilityFilter) conditions.push(facilityFilter)

    const [existing] = await db.select({
      id: careEpisodes.id,
      isArchived: careEpisodes.isArchived,
    }).from(careEpisodes).where(and(...conditions)).limit(1)

    if (!existing) return apiError(404, 'Episode not found')
    if (existing.isArchived) return apiError(400, 'Cannot edit an archived episode')

    const fields = pickAllowedKeys(body, ALLOWED_UPDATE_KEYS)

    const [row] = await db.update(careEpisodes).set(fields).where(eq(careEpisodes.id, episodeId)).returning()
    await logAudit(auth.user, 'UPDATE', 'care_episode', episodeId, { status: row.status })

    if (fields.status && fields.status !== 'ARCHIVED') {
      await logPatientEvent({
        facilityId: row.facilityId,
        patientId: row.patientId,
        episodeId: row.id,
        eventType: 'EPISODE_STATUS_CHANGED',
        title: EVENT_TITLES.EPISODE_STATUS_CHANGED,
        description: `Épisode ${row.episodeNumber} - Nouveau statut: ${fields.status}`,
        performedBy: auth.user.sub,
        performedByName: `${auth.user.firstname} ${auth.user.lastname}`,
        metadata: { episodeId: row.id, episodeNumber: row.episodeNumber, previousStatus: row.status, newStatus: fields.status },
      })
    }

    if (fields.dischargeOutcome) {
      await logPatientEvent({
        facilityId: row.facilityId,
        patientId: row.patientId,
        episodeId: row.id,
        eventType: 'EPISODE_DISCHARGED',
        title: EVENT_TITLES.EPISODE_DISCHARGED,
        description: `Épisode ${row.episodeNumber} - Sortie: ${fields.dischargeOutcome}`,
        performedBy: auth.user.sub,
        performedByName: `${auth.user.firstname} ${auth.user.lastname}`,
        metadata: { episodeId: row.id, episodeNumber: row.episodeNumber, dischargeOutcome: fields.dischargeOutcome },
      })
    }

    return NextResponse.json(row)
  } catch (e) {
    return handleEndpointError(e, 'PUT /care-episodes/[id]')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const episodeId = sanitizeUuid(id)
    if (!episodeId) return apiError(400, 'Invalid episode ID')

    const db = getDb()

    const conditions = [eq(careEpisodes.id, episodeId)]
    const facilityFilter = addFacilityFilter(careEpisodes.facilityId, auth)
    if (facilityFilter) conditions.push(facilityFilter)

    const [existing] = await db.select({
      id: careEpisodes.id,
      isArchived: careEpisodes.isArchived,
      patientId: careEpisodes.patientId,
      episodeNumber: careEpisodes.episodeNumber,
      facilityId: careEpisodes.facilityId,
    }).from(careEpisodes).where(and(...conditions)).limit(1)

    if (!existing) return apiError(404, 'Episode not found')
    if (existing.isArchived) return apiError(400, 'Episode is already archived')

    await db.update(careEpisodes).set({ isArchived: true, updatedAt: new Date() }).where(eq(careEpisodes.id, episodeId))
    await logAudit(auth.user, 'DELETE', 'care_episode', episodeId, { isArchived: true })

    await logPatientEvent({
      facilityId: existing.facilityId,
      patientId: existing.patientId,
      episodeId: existing.id,
      eventType: 'EPISODE_ARCHIVED',
      title: EVENT_TITLES.EPISODE_ARCHIVED,
      description: `Épisode ${existing.episodeNumber} archivé`,
      performedBy: auth.user.sub,
      performedByName: `${auth.user.firstname} ${auth.user.lastname}`,
      metadata: { episodeId: existing.id, episodeNumber: existing.episodeNumber },
    })

    return NextResponse.json({ detail: 'Episode archived' })
  } catch (e) {
    return handleEndpointError(e, 'DELETE /care-episodes/[id]')
  }
}
