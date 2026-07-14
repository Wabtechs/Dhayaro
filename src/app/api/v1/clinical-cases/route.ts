import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { clinicalCases, patients, users, facilities } from '@/lib/schema'
import { eq, desc, ilike, and, count } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20', 10)))
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * size

    const conditions = []
    if (search) {
      conditions.push(ilike(clinicalCases.title, `%${search}%`))
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

    const [created] = await getDb().insert(clinicalCases).values(body).returning()

    return NextResponse.json(created, { status: 201 })
  } catch {
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}
