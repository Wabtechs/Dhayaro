import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { careEpisodes, patients, users } from '@/lib/schema'
import { eq, desc, ilike, and, or, count, sql, max } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, enforceFacilityAccess, logError, parsePagination } from '@/lib/api-errors'
import { logAudit } from '@/lib/audit'
import { requireAuth, requireRole } from '@/lib/auth'
import { parseJsonBody, careEpisodeCreateSchema } from '@/lib/api-schemas'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)

    const conditions = []
    if (search) {
      conditions.push(or(
        ilike(careEpisodes.episodeNumber, `%${search}%`),
        ilike(careEpisodes.admitReason, `%${search}%`),
        ilike(patients.firstname, `%${search}%`),
        ilike(patients.lastname, `%${search}%`),
      )!)
    }

    const patientId = sanitizeUuid(searchParams.get('patientId'))
    const status = searchParams.get('status')

    if (patientId) conditions.push(eq(careEpisodes.patientId, patientId))
    if (status) conditions.push(eq(careEpisodes.status, status as 'ADMITTED' | 'TRIAGE' | 'CONSULTATION' | 'TREATMENT' | 'HOSPITALIZED' | 'DISCHARGED' | 'TRANSFERRED' | 'ARCHIVED'))

    const facilityFilter = addFacilityFilter(careEpisodes.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(careEpisodes).where(whereClause),
      getDb().select({
        id: careEpisodes.id,
        facilityId: careEpisodes.facilityId,
        patientId: careEpisodes.patientId,
        episodeNumber: careEpisodes.episodeNumber,
        status: careEpisodes.status,
        admitDate: careEpisodes.admitDate,
        dischargeDate: careEpisodes.dischargeDate,
        admitReason: careEpisodes.admitReason,
        dischargeOutcome: careEpisodes.dischargeOutcome,
        isArchived: careEpisodes.isArchived,
        createdAt: careEpisodes.createdAt,
        updatedAt: careEpisodes.updatedAt,
        patientFirstname: patients.firstname,
        patientLastname: patients.lastname,
      })
      .from(careEpisodes)
      .leftJoin(patients, eq(careEpisodes.patientId, patients.id))
      .where(whereClause)
      .orderBy(desc(careEpisodes.createdAt))
      .limit(size)
      .offset(offset),
    ])

    return NextResponse.json({
      items,
      total: countResult?.value ?? 0,
      page,
      size,
    })
  } catch (e) {
    logError('GET /care-episodes', e)
    return NextResponse.json(
      { success: false, message: 'Une erreur inattendue s\'est produite lors du chargement des épisodes de soins.', code: 'SERVER_ERROR', errors: {}, data: null },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'NURSE'])
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, careEpisodeCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const patientId = sanitizeUuid(body.patientId)

    const db = getDb()

    const patientCheck = await db.select({ id: patients.id }).from(patients).where(eq(patients.id, patientId)).limit(1)
    if (patientCheck.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Patient introuvable.', code: 'RESOURCE_NOT_FOUND', errors: {}, data: null },
        { status: 404 }
      )
    }

    const { facilityId } = enforceFacilityAccess(body, auth)
    const now = new Date()
    const year = now.getFullYear()
    const yearPrefix = `EP-${year}-`
    const [{ value: maxNum }] = await db.select({
      value: sql<number>`coalesce(max(cast(right(${careEpisodes.episodeNumber}, 6) as integer)), 0)`
    }).from(careEpisodes)
      .where(ilike(careEpisodes.episodeNumber, `${yearPrefix}%`))
    const episodeNumber = `EP-${year}-${String((maxNum ?? 0) + 1).padStart(6, '0')}`

    const [row] = await db.insert(careEpisodes).values({
      id: crypto.randomUUID(),
      facilityId: facilityId || null,
      patientId,
      episodeNumber,
      status: body.status || 'ADMITTED',
      admitDate: body.admitDate ? new Date(body.admitDate) : now,
      dischargeDate: null,
      admitReason: body.admitReason || null,
      dischargeSummary: {},
      dischargeOutcome: null,
      isArchived: false,
      metadata: body.metadata || {},
      createdAt: now,
      updatedAt: now,
    }).returning()

    await logAudit(auth.user, 'CREATE', 'care_episode', row.id, { episodeNumber: row.episodeNumber, patientId: row.patientId })

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    console.error('POST /care-episodes ERROR:', e instanceof Error ? e.message : e)
    if (e && typeof e === 'object' && 'cause' in e) console.error('CAUSE:', e.cause)
    logError('POST /care-episodes', e)
    return NextResponse.json(
      { success: false, message: 'Impossible d\'enregistrer l\'épisode de soins. Veuillez vérifier les informations puis réessayer.', code: 'RESOURCE_CREATE_FAILED', errors: {}, data: null },
      { status: 500 }
    )
  }
}
