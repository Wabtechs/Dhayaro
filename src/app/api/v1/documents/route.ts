import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { documents, patients } from '@/lib/schema'
import { eq, desc, and, count } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, apiError, enforceFacilityAccess, logError, parsePagination } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, offset } = parsePagination(searchParams)

    const patientId = sanitizeUuid(searchParams.get('patientId'))
    const documentType = searchParams.get('documentType')

    const conditions = []

    if (patientId) {
      conditions.push(eq(documents.patientId, patientId))
    }
    if (documentType) {
      conditions.push(eq(documents.documentType, documentType as 'PRESCRIPTION' | 'CERTIFICATE' | 'REPORT' | 'LAB_RESULT' | 'REFERRAL' | 'ORDONNANCE'))
    }

    const facilityFilter = addFacilityFilter(documents.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(documents).where(whereClause),
      getDb()
        .select({
          id: documents.id,
          facilityId: documents.facilityId,
          patientId: documents.patientId,
          consultationId: documents.consultationId,
          doctorId: documents.doctorId,
          documentType: documents.documentType,
          title: documents.title,
          content: documents.content,
          filePath: documents.filePath,
          isPrinted: documents.isPrinted,
          createdAt: documents.createdAt,
          patientFirstname: patients.firstname,
          patientLastname: patients.lastname,
        })
        .from(documents)
        .leftJoin(patients, eq(documents.patientId, patients.id))
        .where(whereClause)
        .orderBy(desc(documents.createdAt))
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
    logError('GET /documents', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const body = await request.json()

    if (!body.title || !body.documentType) {
      return apiError(400, 'title and documentType are required')
    }

    const now = new Date()

    const [row] = await getDb().insert(documents).values({
      id: crypto.randomUUID(),
      facilityId: enforceFacilityAccess(body, auth).facilityId,
      patientId: sanitizeUuid(body.patientId) || null,
      consultationId: sanitizeUuid(body.consultationId) || null,
      doctorId: auth.user.sub,
      documentType: body.documentType,
      title: body.title,
      content: body.content || {},
      filePath: body.filePath || null,
      isPrinted: false,
      createdAt: now,
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /documents', e)
    return apiError(500, 'Internal server error')
  }
}
