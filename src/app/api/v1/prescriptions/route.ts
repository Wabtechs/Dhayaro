import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { prescriptions, treatments, medications } from '@/lib/schema'
import { eq, desc, and, count } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { apiError, logError, parsePagination } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, offset } = parsePagination(searchParams)

    const treatmentId = sanitizeUuid(searchParams.get('treatmentId'))

    const conditions = []
    if (treatmentId) conditions.push(eq(prescriptions.treatmentId, treatmentId))

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(prescriptions).where(whereClause),
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
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const body = await request.json()

    const treatmentId = sanitizeUuid(body.treatmentId)
    const medicationId = sanitizeUuid(body.medicationId)

    if (!treatmentId) {
      return apiError(400, 'treatmentId is required and must be a valid UUID')
    }
    if (!medicationId) {
      return apiError(400, 'medicationId is required and must be a valid UUID')
    }
    if (!body.dosage) {
      return apiError(400, 'dosage is required')
    }
    if (!body.frequency) {
      return apiError(400, 'frequency is required')
    }
    if (!body.duration) {
      return apiError(400, 'duration is required')
    }

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

    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    logError('POST /prescriptions', e)
    return apiError(500, 'Internal server error')
  }
}
