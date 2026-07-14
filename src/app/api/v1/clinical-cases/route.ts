import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { clinicalCases, patients, users, facilities } from '@/lib/schema'
import { eq, desc, ilike, and, or, count } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20', 10)))
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * size

    const conditions = []
    if (search) {
      conditions.push(or(
        ilike(clinicalCases.title, `%${search}%`),
        ilike(clinicalCases.description, `%${search}%`),
        ilike(clinicalCases.provisionalDiagnosis, `%${search}%`),
      )!)
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [countResult] = await getDb()
      .select({ value: count() })
      .from(clinicalCases)
      .where(whereClause)

    const items = await getDb()
      .select({
        id: clinicalCases.id,
        facilityId: clinicalCases.facilityId,
        patientId: clinicalCases.patientId,
        doctorId: clinicalCases.doctorId,
        title: clinicalCases.title,
        description: clinicalCases.description,
        symptomsJson: clinicalCases.symptomsJson,
        provisionalDiagnosis: clinicalCases.provisionalDiagnosis,
        treatment: clinicalCases.treatment,
        treatmentDuration: clinicalCases.treatmentDuration,
        outcomeStatus: clinicalCases.outcomeStatus,
        outcomeNotes: clinicalCases.outcomeNotes,
        priority: clinicalCases.priority,
        tagsJson: clinicalCases.tagsJson,
        isSynced: clinicalCases.isSynced,
        createdAt: clinicalCases.createdAt,
        updatedAt: clinicalCases.updatedAt,
        patientFirstname: patients.firstname,
        patientLastname: patients.lastname,
        doctorFirstname: users.firstname,
        doctorLastname: users.lastname,
        facilityName: facilities.name,
      })
      .from(clinicalCases)
      .leftJoin(patients, eq(clinicalCases.patientId, patients.id))
      .leftJoin(users, eq(clinicalCases.doctorId, users.id))
      .leftJoin(facilities, eq(clinicalCases.facilityId, facilities.id))
      .where(whereClause)
      .orderBy(desc(clinicalCases.createdAt))
      .limit(size)
      .offset(offset)

    return NextResponse.json({
      items,
      total: countResult?.value ?? 0,
      page,
      size,
    })
  } catch {
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.patientId) {
      const patientCheck = await getDb().select({ id: patients.id }).from(patients).where(eq(patients.id, body.patientId)).limit(1)
      if (patientCheck.length === 0) {
        return NextResponse.json({ detail: 'Patient not found' }, { status: 400 })
      }
    }

    if (body.doctorId) {
      const doctorCheck = await getDb().select({ id: users.id }).from(users).where(eq(users.id, body.doctorId)).limit(1)
      if (doctorCheck.length === 0) {
        return NextResponse.json({ detail: 'Doctor not found' }, { status: 400 })
      }
    }

    if (body.facilityId) {
      const facilityCheck = await getDb().select({ id: facilities.id }).from(facilities).where(eq(facilities.id, body.facilityId)).limit(1)
      if (facilityCheck.length === 0) {
        return NextResponse.json({ detail: 'Facility not found' }, { status: 400 })
      }
    }

    const [created] = await getDb().insert(clinicalCases).values(body).returning()

    return NextResponse.json(created, { status: 201 })
  } catch {
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}
