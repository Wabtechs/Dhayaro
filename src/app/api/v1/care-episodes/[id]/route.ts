import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { careEpisodes, patients, episodeEntities, consultations, diagnostics, treatments, labExams, documents } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { enforceFacilityAccess, apiError, logError, pickAllowedKeys } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

const ALLOWED_UPDATE_KEYS = ['status', 'dischargeDate', 'dischargeSummary', 'dischargeOutcome', 'isArchived', 'metadata', 'admitReason'] as const

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const episodeId = sanitizeUuid(id)
    if (!episodeId) return apiError(400, 'Invalid episode ID')

    const db = getDb()

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
    .where(eq(careEpisodes.id, episodeId))
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
    logError('GET /care-episodes/[id]', e)
    return apiError(500, e instanceof Error ? e.message : 'Internal server error')
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const episodeId = sanitizeUuid(id)
    if (!episodeId) return apiError(400, 'Invalid episode ID')

    const body = await request.json()
    const db = getDb()

    const [existing] = await db.select({ id: careEpisodes.id }).from(careEpisodes).where(eq(careEpisodes.id, episodeId)).limit(1)
    if (!existing) return apiError(404, 'Episode not found')

    const fields = pickAllowedKeys(body, ALLOWED_UPDATE_KEYS)

    const [row] = await db.update(careEpisodes).set(fields).where(eq(careEpisodes.id, episodeId)).returning()
    return NextResponse.json(row)
  } catch (e) {
    logError('PUT /care-episodes/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const episodeId = sanitizeUuid(id)
    if (!episodeId) return apiError(400, 'Invalid episode ID')

    const db = getDb()

    const [existing] = await db.select({ id: careEpisodes.id }).from(careEpisodes).where(eq(careEpisodes.id, episodeId)).limit(1)
    if (!existing) return apiError(404, 'Episode not found')

    await db.update(careEpisodes).set({ isArchived: true, updatedAt: new Date() }).where(eq(careEpisodes.id, episodeId))
    return NextResponse.json({ detail: 'Episode archived' })
  } catch (e) {
    logError('DELETE /care-episodes/[id]', e)
    return apiError(500, 'Internal server error')
  }
}
