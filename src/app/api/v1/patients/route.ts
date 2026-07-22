import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { patients, facilities } from '@/lib/schema'
import { eq, desc, ilike, and, or, count } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, enforceFacilityAccess, apiError, logError, parsePagination } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

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

    const facilityFilter = addFacilityFilter(patients.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

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
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const body = await request.json()

    if (!body.firstname || !body.lastname || !body.sex || !body.dateOfBirth) {
      return apiError(400, 'firstname, lastname, sex, and dateOfBirth are required')
    }

    const patientUuid = body.patientUuid || crypto.randomUUID()
    const { facilityId } = enforceFacilityAccess(body, auth)

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
      firstname: body.firstname,
      lastname: body.lastname,
      sex: body.sex,
      dateOfBirth: body.dateOfBirth,
      age: body.age ?? null,
      bloodGroup: body.bloodGroup || null,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      city: body.city || null,
      photo: body.photo || null,
      emergencyContactName: body.emergencyContactName || null,
      emergencyContactPhone: body.emergencyContactPhone || null,
      emergencyContactRelation: body.emergencyContactRelation || null,
      insuranceName: body.insuranceName || null,
      insuranceNumber: body.insuranceNumber || null,
      insuranceExpiry: body.insuranceExpiry || null,
      allergies: body.allergies || [],
      antecedents: body.antecedents || [],
      medicalHistoryJson: body.medicalHistoryJson || {},
      notes: body.notes || null,
      facilityId,
      isActive: true,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /patients', e)
    return apiError(500, 'Internal server error')
  }
}
