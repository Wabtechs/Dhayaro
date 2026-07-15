import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { patients, facilities } from '@/lib/schema'
import { eq, desc, ilike, and, or, count } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { apiError, logError, parsePagination } from '@/lib/api-errors'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { page, size, search, offset } = parsePagination(searchParams)

    const conditions = [eq(patients.isActive, true)]
    if (search) {
      conditions.push(or(
        ilike(patients.firstname, `%${search}%`),
        ilike(patients.lastname, `%${search}%`),
        ilike(patients.email, `%${search}%`),
        ilike(patients.patientUuid, `%${search}%`),
      )!)
    }

    const whereClause = and(...conditions)

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(patients).where(whereClause),
      getDb().select().from(patients).where(whereClause).orderBy(desc(patients.createdAt)).limit(size).offset(offset),
    ])

    return NextResponse.json({
      items,
      total: countResult?.value ?? 0,
      page,
      size,
    })
  } catch (e) {
    logError('GET /patients', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const patientUuid = body.patientUuid || crypto.randomUUID()

    const facilityId = sanitizeUuid(body.facilityId)

    if (facilityId) {
      const facilityCheck = await getDb().select({ id: facilities.id }).from(facilities).where(eq(facilities.id, facilityId)).limit(1)
      if (facilityCheck.length === 0) {
        return apiError(400, 'Facility not found')
      }
    }

    const now = new Date()

    const [row] = await getDb().insert(patients).values({
      id: crypto.randomUUID(),
      patientUuid,
      firstname: body.firstname || null,
      lastname: body.lastname || null,
      email: body.email || null,
      sex: body.sex || null,
      age: body.age ?? 0,
      bloodGroup: body.bloodGroup || null,
      phone: body.phone || null,
      address: body.address || null,
      dateOfBirth: body.dateOfBirth || null,
      facilityId,
      allergies: body.allergies || [],
      medicalHistoryJson: body.medicalHistoryJson || {},
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /patients', e)
    return apiError(500, 'Internal server error')
  }
}
