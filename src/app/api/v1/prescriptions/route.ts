import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { prescriptions, treatments, medications } from '@/lib/schema'
import { eq, desc, and, count } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addDoctorFilter, addFacilityFilter, apiError, logError, parsePagination } from '@/lib/api-errors'
import { logAudit } from '@/lib/audit'
import { requireAuth, requireRole } from '@/lib/auth'
import { parseJsonBody, prescriptionCreateSchema } from '@/lib/api-schemas'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, offset } = parsePagination(searchParams)

    const treatmentId = sanitizeUuid(searchParams.get('treatmentId'))

    const conditions = []
    if (treatmentId) conditions.push(eq(prescriptions.treatmentId, treatmentId))

    const doctorFilter = addDoctorFilter(treatments.doctorId, auth)
    if (doctorFilter) conditions.push(doctorFilter)

    const facilityFilter = addFacilityFilter(treatments.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(prescriptions).innerJoin(treatments, eq(prescriptions.treatmentId, treatments.id)).where(whereClause),
      getDb().select({
        id: prescriptions.id,
        treatmentId: prescriptions.treatmentId,
        medicationId: prescriptions.medicationId,
        dosage: prescriptions.dosage,
        frequency: prescriptions.frequency,
        duration: prescriptions.duration,
        instructions: prescriptions.instructions,
        quantity: prescriptions.quantity,
        createdAt: prescriptions.createdAt,
        medicationName: medications.name,
        medicationGenericName: medications.genericName,
        medicationForm: medications.form,
        medicationDosage: medications.dosage,
      })
      .from(prescriptions)
      .innerJoin(treatments, eq(prescriptions.treatmentId, treatments.id))
      .leftJoin(medications, eq(prescriptions.medicationId, medications.id))
      .where(whereClause)
      .orderBy(desc(prescriptions.createdAt))
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
    logError('GET /prescriptions', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST'])
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, prescriptionCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const treatmentId = sanitizeUuid(body.treatmentId)
    const medicationId = sanitizeUuid(body.medicationId)

    const db = getDb()

    const [treatmentCheck, medicationCheck] = await Promise.all([
      db.select({ id: treatments.id }).from(treatments).where(eq(treatments.id, treatmentId)).limit(1),
      db.select({ id: medications.id }).from(medications).where(eq(medications.id, medicationId)).limit(1),
    ])

    if (treatmentCheck.length === 0) return apiError(400, 'Treatment not found')
    if (medicationCheck.length === 0) return apiError(400, 'Medication not found')

    const [row] = await db.insert(prescriptions).values({
      id: crypto.randomUUID(),
      treatmentId,
      medicationId,
      dosage: body.dosage,
      frequency: body.frequency,
      duration: body.duration,
      instructions: body.instructions || null,
      quantity: body.quantity ?? null,
      createdAt: new Date(),
    }).returning()

    await logAudit(auth.user, 'CREATE', 'prescription', row.id, { medicationId: row.medicationId, dosage: row.dosage })

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /prescriptions', e)
    return apiError(500, 'Internal server error')
  }
}
