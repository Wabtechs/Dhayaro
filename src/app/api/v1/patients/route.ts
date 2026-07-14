import { NextRequest, NextResponse } from 'next/server'
import { getDb, getSql } from '@/lib/db'
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

    const sql = getSql()
    const allergiesStr = body.allergies ? JSON.stringify(body.allergies) : '[]'
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const rows = await sql`
      INSERT INTO patients (id, patient_uuid, firstname, lastname, email, sex, date_of_birth, blood_group, facility_id, allergies, is_active, created_at, updated_at)
      VALUES (${id}, ${patientUuid}, ${body.firstname || null}, ${body.lastname || null}, ${body.email || null}, ${body.sex || null}, ${body.dateOfBirth || null}, ${body.bloodGroup || null}, ${facilityId}, ${allergiesStr}::jsonb, true, ${now}, ${now})
      RETURNING id, facility_id, patient_uuid, firstname, lastname, email, sex, date_of_birth, blood_group, is_active, created_at, updated_at
    `

    return NextResponse.json(rows[0], { status: 201 })
  } catch (e) {
    logError('POST /patients', e)
    return apiError(500, 'Internal server error')
  }
}
