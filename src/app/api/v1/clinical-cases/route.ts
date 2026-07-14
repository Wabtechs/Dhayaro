import { NextRequest, NextResponse } from 'next/server'
import { getDb, getSql } from '@/lib/db'
import { clinicalCases, patients, users, facilities } from '@/lib/schema'
import { eq, desc, ilike, and, or, count } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'

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

    const patientId = sanitizeUuid(body.patientId)
    const doctorId = sanitizeUuid(body.doctorId)
    const facilityId = sanitizeUuid(body.facilityId)

    if (!patientId) {
      return NextResponse.json({ detail: 'patientId is required and must be a valid UUID' }, { status: 400 })
    }

    const db = getDb()
    const sql = getSql()

    const patientCheck = await db.select({ id: patients.id }).from(patients).where(eq(patients.id, patientId)).limit(1)
    if (patientCheck.length === 0) {
      return NextResponse.json({ detail: 'Patient not found' }, { status: 400 })
    }

    if (doctorId) {
      const doctorCheck = await db.select({ id: users.id }).from(users).where(eq(users.id, doctorId)).limit(1)
      if (doctorCheck.length === 0) {
        return NextResponse.json({ detail: 'Doctor not found' }, { status: 400 })
      }
    }

    if (facilityId) {
      const facilityCheck = await db.select({ id: facilities.id }).from(facilities).where(eq(facilities.id, facilityId)).limit(1)
      if (facilityCheck.length === 0) {
        return NextResponse.json({ detail: 'Facility not found' }, { status: 400 })
      }
    }

    const outcomeVal = body.outcomeStatus || 'PENDING'
    const symptomsStr = body.symptomsJson ? JSON.stringify(body.symptomsJson) : '{}'
    const tagsStr = body.tagsJson ? JSON.stringify(body.tagsJson) : '{}'
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const rows = await sql`
      INSERT INTO clinical_cases (id, patient_id, doctor_id, facility_id, title, description, symptoms_json, provisional_diagnosis, treatment, treatment_duration, outcome_status, outcome_notes, priority, tags_json, is_synced, created_at, updated_at)
      VALUES (${id}, ${patientId}, ${doctorId}, ${facilityId}, ${body.title || null}, ${body.description || null}, ${symptomsStr}::jsonb, ${body.provisionalDiagnosis || null}, ${body.treatment || null}, ${body.treatmentDuration || null}, ${outcomeVal}, ${body.outcomeNotes || null}, ${body.priority || 'medium'}, ${tagsStr}::jsonb, false, ${now}, ${now})
      RETURNING id, facility_id, patient_id, doctor_id, title, description, symptoms_json, provisional_diagnosis, treatment, treatment_duration, outcome_status, outcome_notes, priority, tags_json, is_synced, created_at, updated_at
    `

    return NextResponse.json(rows[0], { status: 201 })
  } catch (e: unknown) {
    console.error('POST /clinical-cases error:', e)
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ detail: 'Internal server error', error: msg }, { status: 500 })
  }
}
