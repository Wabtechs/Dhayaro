import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { dispensations, treatments, medications, prescriptions, queue } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, apiError, enforceFacilityAccess, handleEndpointError } from '@/lib/api-errors'
import { requireRole } from '@/lib/auth'
import { logAudit, sendNotification } from '@/lib/audit'
import { logPatientEvent, EVENT_TITLES } from '@/lib/patient-history'
import { createClinicalDocument, documentExistsForEntity } from '@/lib/documents'
import { parseJsonBody, dispenseCreateSchema } from '@/lib/api-schemas'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST'])
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, dispenseCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const treatmentId = sanitizeUuid(body.treatmentId)

    const db = getDb()

    const treatment = await db
      .select({
        id: treatments.id,
        facilityId: treatments.facilityId,
        patientId: treatments.patientId,
        doctorId: treatments.doctorId,
        episodeId: treatments.episodeId,
        consultationId: treatments.consultationId,
        description: treatments.description,
        status: treatments.status,
      })
      .from(treatments)
      .where(eq(treatments.id, treatmentId))
      .limit(1)

    if (treatment.length === 0) return apiError(404, 'Treatment not found')
    const current = treatment[0]

    const facilityId = enforceFacilityAccess(current, auth).facilityId
    if (!facilityId || (auth.user.role !== 'SUPER_ADMIN' && current.facilityId !== facilityId)) {
      return apiError(403, 'This treatment does not belong to your facility')
    }

    const validStatuses = ['PRESCRIBED', 'IN_PROGRESS']
    if (!validStatuses.includes(current.status)) {
      return apiError(400, `Treatment status (${current.status}) cannot be dispensed`)
    }

    const now = new Date()

    const values: {
      id: string
      facilityId: string | null
      patientId: string
      treatmentId: string
      doctorId: string
      pharmacistId: string
      episodeId: string | null
      medicationId: string | null
      quantity: number
      dosage: string | null
      batchNumber: string | null
      expiryDate: string | null
      notes: string | null
      signature: string | null
      dispensedAt: Date
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    } = {
      id: crypto.randomUUID(),
      facilityId: current.facilityId,
      patientId: current.patientId,
      treatmentId: current.id,
      doctorId: current.doctorId,
      pharmacistId: auth.user.sub,
      episodeId: current.episodeId || null,
      medicationId: body.medicationId ? sanitizeUuid(body.medicationId) : null,
      quantity: body.quantity,
      dosage: body.dosage || null,
      batchNumber: body.batchNumber || null,
      expiryDate: body.expiryDate || null,
      notes: body.notes || null,
      signature: body.signature || null,
      dispensedAt: now,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }

    await db.insert(dispensations).values(values)

    await db.update(treatments).set({ status: 'COMPLETED', updatedAt: now }).where(eq(treatments.id, treatmentId))

    let advancedQueue = false
    if (body.queueId) {
      const queueId = sanitizeUuid(body.queueId)
      const queueEntry = await db
        .select({
          id: queue.id,
          patientId: queue.patientId,
          facilityId: queue.facilityId,
          status: queue.status,
        })
        .from(queue)
        .where(eq(queue.id, queueId))
        .limit(1)

      if (queueEntry.length === 0) return apiError(404, 'Queue entry not found')
      const q = queueEntry[0]
      const qFacility = enforceFacilityAccess(q, auth).facilityId
      if (!qFacility || (auth.user.role !== 'SUPER_ADMIN' && q.facilityId !== qFacility)) {
        return apiError(403, 'This queue entry does not belong to your facility')
      }
      if (q.patientId !== current.patientId) {
        return apiError(400, 'Queue entry does not belong to the same patient')
      }

      await db.update(queue).set({ status: 'COMPLETED', completedAt: now, updatedAt: now }).where(eq(queue.id, queueId))
      advancedQueue = true
    }

    const treatmentPrescriptions = await db
      .select({
        medicationId: prescriptions.medicationId,
        dosage: prescriptions.dosage,
        frequency: prescriptions.frequency,
        duration: prescriptions.duration,
        quantity: prescriptions.quantity,
        name: medications.name,
        form: medications.form,
      })
      .from(prescriptions)
      .leftJoin(medications, eq(prescriptions.medicationId, medications.id))
      .where(eq(prescriptions.treatmentId, treatmentId))

    await logAudit(auth.user, 'CREATE', 'pharmacy_dispense', values.id, {
      treatmentId,
      patientId: current.patientId,
      quantity: body.quantity,
      medicationId: values.medicationId,
      batchNumber: values.batchNumber,
    })

    if (current.consultationId) {
      const ordonnanceExists = await documentExistsForEntity('consultationId', current.consultationId, 'ORDONNANCE')
      if (!ordonnanceExists) {
        await createClinicalDocument({
          facilityId: current.facilityId,
          patientId: current.patientId,
          doctorId: current.doctorId,
          episodeId: current.episodeId,
          consultationId: current.consultationId,
          documentType: 'ORDONNANCE',
          title: 'Ordonnance de délivrance',
          content: {
            treatmentId: current.id,
            pharmacistId: auth.user.sub,
            pharmacistName: `${auth.user.firstname ?? ''} ${auth.user.lastname ?? ''}`.trim(),
            quantity: body.quantity,
            dosage: body.dosage,
            batchNumber: values.batchNumber,
            expiryDate: values.expiryDate,
            medications: treatmentPrescriptions.map((p) => ({
              id: p.medicationId,
              name: p.name,
              form: p.form,
              dosage: p.dosage,
              frequency: p.frequency,
              duration: p.duration,
              quantity: p.quantity,
            })),
          },
        })
      }
    }

    await logPatientEvent({
      facilityId: current.facilityId,
      patientId: current.patientId,
      episodeId: current.episodeId,
      eventType: 'PHARMACY_DISPENSED',
      title: EVENT_TITLES.PHARMACY_DISPENSED,
      description: `Médicament délivré pour traitement: ${current.description}`,
      performedBy: auth.user.sub,
      performedByName: `${auth.user.firstname ?? ''} ${auth.user.lastname ?? ''}`.trim(),
      metadata: {
        treatmentId: current.id,
        dispensationId: values.id,
        quantity: body.quantity,
        medicationId: values.medicationId,
        batchNumber: values.batchNumber,
        queueAdvanced: advancedQueue,
      },
    })

    if (current.doctorId !== auth.user.sub) {
      await sendNotification({
        userId: current.doctorId,
        facilityId: current.facilityId,
        title: 'Médicament délivré',
        message: `Le traitement "${current.description}" a été délivré au patient.`,
        type: 'SUCCESS',
        link: `/treatments/${treatmentId}`,
        metadata: { treatmentId, patientId: current.patientId },
      })
    }

    return NextResponse.json({
      id: values.id,
      treatmentId,
      patientId: current.patientId,
      status: 'COMPLETED',
      queueAdvanced: advancedQueue,
      ordonnanceCreated: !!(current.consultationId),
    }, { status: 201 })
  } catch (e) {
    return handleEndpointError(e, 'POST /pharmacy/dispense')
  }
}
