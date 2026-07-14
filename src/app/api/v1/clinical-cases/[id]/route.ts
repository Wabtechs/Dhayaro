import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { clinicalCases, patients, users, facilities } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { apiError, logError, pickAllowedKeys } from '@/lib/api-errors'
import { sanitizeUuid } from '@/lib/validation'

const CLINICAL_CASE_KEYS = ['title', 'description', 'patientId', 'doctorId', 'facilityId', 'symptomsJson', 'provisionalDiagnosis', 'treatment', 'treatmentDuration', 'outcomeStatus', 'outcomeNotes', 'priority', 'tagsJson'] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [row] = await getDb().select().from(clinicalCases).where(eq(clinicalCases.id, id)).limit(1)

    if (!row) {
      return apiError(404, 'Clinical case not found')
    }

    return NextResponse.json(row)
  } catch (e) {
    logError('GET /clinical-cases/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const allowedFields = pickAllowedKeys(body, CLINICAL_CASE_KEYS)

    const db = getDb()

    if (allowedFields.patientId) {
      const pid = sanitizeUuid(allowedFields.patientId as string)
      if (!pid) return apiError(400, 'patientId must be a valid UUID')
      const check = await db.select({ id: patients.id }).from(patients).where(eq(patients.id, pid)).limit(1)
      if (check.length === 0) return apiError(400, 'Patient not found')
      allowedFields.patientId = pid
    }

    if (allowedFields.doctorId) {
      const did = sanitizeUuid(allowedFields.doctorId as string)
      if (!did) return apiError(400, 'doctorId must be a valid UUID')
      const check = await db.select({ id: users.id }).from(users).where(eq(users.id, did)).limit(1)
      if (check.length === 0) return apiError(400, 'Doctor not found')
      allowedFields.doctorId = did
    }

    if (allowedFields.facilityId) {
      const fid = sanitizeUuid(allowedFields.facilityId as string)
      if (!fid) return apiError(400, 'facilityId must be a valid UUID')
      const check = await db.select({ id: facilities.id }).from(facilities).where(eq(facilities.id, fid)).limit(1)
      if (check.length === 0) return apiError(400, 'Facility not found')
      allowedFields.facilityId = fid
    }

    const [updated] = await db
      .update(clinicalCases)
      .set(allowedFields)
      .where(eq(clinicalCases.id, id))
      .returning()

    if (!updated) {
      return apiError(404, 'Clinical case not found')
    }

    return NextResponse.json(updated)
  } catch (e) {
    logError('PUT /clinical-cases/[id]', e)
    return apiError(500, 'Internal server error')
  }
}
