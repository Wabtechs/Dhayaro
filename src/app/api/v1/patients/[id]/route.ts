import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { patients } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { apiError, logError, pickAllowedKeys } from '@/lib/api-errors'
import { requireAuth, requireRole } from '@/lib/auth'

const PATIENT_KEYS = ['firstname', 'lastname', 'email', 'sex', 'dateOfBirth', 'bloodGroup', 'facilityId', 'allergies', 'phone', 'address', 'patientUuid', 'age', 'medicalHistoryJson'] as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const [row] = await getDb().select().from(patients).where(eq(patients.id, id)).limit(1)

    if (!row) {
      return apiError(404, 'Patient not found')
    }

    return NextResponse.json(row)
  } catch (e) {
    logError('GET /patients/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const body = await request.json()
    const allowedFields = pickAllowedKeys(body, PATIENT_KEYS)

    const [updated] = await getDb()
      .update(patients)
      .set(allowedFields)
      .where(eq(patients.id, id))
      .returning()

    if (!updated) {
      return apiError(404, 'Patient not found')
    }

    return NextResponse.json(updated)
  } catch (e) {
    logError('PUT /patients/[id]', e)
    return apiError(500, 'Internal server error')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ['ADMIN', 'DOCTOR'])
    if ('error' in auth) return auth.error

    const { id } = await params

    const [deleted] = await getDb()
      .update(patients)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning()

    if (!deleted) {
      return apiError(404, 'Patient not found')
    }

    return NextResponse.json({ detail: 'Patient deleted' })
  } catch (e) {
    logError('DELETE /patients/[id]', e)
    return apiError(500, 'Internal server error')
  }
}
